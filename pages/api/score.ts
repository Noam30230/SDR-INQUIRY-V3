import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { collectPappers } from '@/lib/collectors/pappers'
import { collectGitHub } from '@/lib/collectors/github'
import { collectWappalyzer } from '@/lib/collectors/wappalyzer'
import { collectSiteQuality } from '@/lib/collectors/site-quality'
import { collectBrave } from '@/lib/collectors/brave'
import { collectNews } from '@/lib/collectors/newsapi'
import { collectOpenCorporates } from '@/lib/collectors/opencorporates'
import { collectSumble } from '@/lib/collectors/sumble'
import { scoreAccount } from '@/lib/scorer'
import type { AggregatedData } from '@/types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return res.status(401).json({ error: 'Non authentifié' })

  const { companyName, domain: inputDomain, salesforceId } = req.body as { companyName: string; domain?: string; salesforceId?: string }
  if (!companyName?.trim()) return res.status(400).json({ error: 'Company name required' })

  const { data: account, error: insertError } = await supabaseAdmin
    .from('accounts')
    .insert({ user_id: user.id, company_name: companyName.trim(), domain: inputDomain || null, salesforce_id: salesforceId || null, status: 'scoring' })
    .select()
    .single()

  if (insertError || !account) return res.status(500).json({ error: 'Erreur création compte' })

  res.status(202).json({ id: account.id, status: 'scoring' })

  // Scoring asynchrone
  try {
    const domain = inputDomain?.trim() || ''
    const isFrench = domain.endsWith('.fr')

    const [pappers, github, wappalyzer, siteQuality, brave, news, opencorp, sumble] =
      await Promise.allSettled([
        isFrench ? collectPappers(companyName, domain) : Promise.resolve(null),
        collectGitHub(companyName, domain),
        domain ? collectWappalyzer(domain) : Promise.resolve(null),
        domain ? collectSiteQuality(domain) : Promise.resolve(null),
        collectBrave(companyName, domain),
        collectNews(companyName),
        !isFrench ? collectOpenCorporates(companyName) : Promise.resolve(null),
        collectSumble(companyName, domain),
      ])

    const aggregated: AggregatedData = {
      companyName,
      domain,
      pappers: pappers.status === 'fulfilled' ? pappers.value ?? undefined : undefined,
      github: github.status === 'fulfilled' ? github.value ?? undefined : undefined,
      wappalyzer: wappalyzer.status === 'fulfilled' ? wappalyzer.value ?? undefined : undefined,
      siteQuality: siteQuality.status === 'fulfilled' ? siteQuality.value ?? undefined : undefined,
      brave: brave.status === 'fulfilled' ? brave.value ?? undefined : undefined,
      news: news.status === 'fulfilled' ? news.value ?? undefined : undefined,
    }

    const scored = await scoreAccount(aggregated)

    const sq = aggregated.siteQuality
    const webQuality = sq ? {
      score: (sq.hasHttps ? 5 : 0) + (sq.isResponsive ? 5 : 0) + (sq.framework ? 10 : 0) +
        (sq.hasCareers ? 5 : 0) + (sq.hasBlog ? 5 : 0) + (sq.isPageBuilder ? -5 : 0),
      hosting: sq.hosting,
      isResponsive: sq.isResponsive,
      hasHttps: sq.hasHttps,
      hasCareers: sq.hasCareers,
      hasBlog: sq.hasBlog,
      framework: sq.framework,
      isPageBuilder: sq.isPageBuilder,
      techJobsCount: sq.techJobsFound.length,
    } : null

    await supabaseAdmin
      .from('accounts')
      .update({
        tier: scored.tier,
        score: scored.score,
        signals: scored.signals,
        tech_stack: scored.tech_stack,
        web_quality: webQuality,
        press_signals: { articles: aggregated.news?.articles || [] },
        reasoning: scored.reasoning,
        raw_data: {
          pappers: pappers.status === 'fulfilled' ? pappers.value : null,
          github: github.status === 'fulfilled' ? github.value : null,
          brave: brave.status === 'fulfilled' ? brave.value : null,
          opencorporates: opencorp.status === 'fulfilled' ? opencorp.value : null,
          sumble: sumble.status === 'fulfilled' ? sumble.value : null,
        },
        status: 'done',
        domain: domain || null,
      })
      .eq('id', account.id)

  } catch (err) {
    await supabaseAdmin
      .from('accounts')
      .update({ status: 'error', error_message: err instanceof Error ? err.message : 'Erreur inconnue' })
      .eq('id', account.id)
  }
}
