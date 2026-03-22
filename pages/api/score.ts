import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { scoreAccount } from '@/lib/scorer'
import type { AggregatedData } from '@/types'

async function safeCollect<T>(fn: () => Promise<T>): Promise<T | null> {
  try {
    return await fn()
  } catch {
    return null
  }
}

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

  const { companyName: inputName, domain: inputDomain, salesforceId } = req.body as {
    companyName: string; domain?: string; salesforceId?: string
  }
  if (!inputName?.trim()) return res.status(400).json({ error: 'Company name required' })

  const companyName = inputName.trim()
  const domain = (inputDomain || '').trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '').toLowerCase()

  // Duplicate check — same domain already scored for this user
  if (domain) {
    const { count } = await supabaseAdmin
      .from('accounts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('domain', domain)
      .eq('status', 'done')
    if ((count ?? 0) > 0) return res.status(409).json({ error: 'already_scored' })
  }

  // Crée le compte
  const { data: account, error: insertError } = await supabaseAdmin
    .from('accounts')
    .insert({
      user_id: user.id,
      company_name: companyName,
      domain: domain || null,
      salesforce_id: salesforceId || null,
      status: 'scoring',
    })
    .select()
    .single()

  if (insertError || !account) return res.status(500).json({ error: 'Erreur création compte' })

  try {
    // Collecte parallèle — chaque collecteur a 5s max, tout le bloc 7s max
    const timeout = <T>(p: Promise<T | null>): Promise<T | null> =>
      Promise.race([p, new Promise<null>(r => setTimeout(() => r(null), 5000))])

    // Try Pappers for all companies — it returns null gracefully if not found
    const [github, wappalyzer, siteQuality, search, news, pappers] = await Promise.all([
      timeout(safeCollect(() => import('@/lib/collectors/github').then(m => m.collectGitHub(companyName, domain)))),
      timeout(safeCollect(() => domain ? import('@/lib/collectors/wappalyzer').then(m => m.collectWappalyzer(domain)) : Promise.resolve(null))),
      timeout(safeCollect(() => domain ? import('@/lib/collectors/site-quality').then(m => m.collectSiteQuality(domain)) : Promise.resolve(null))),
      timeout(safeCollect(() => import('@/lib/collectors/brave').then(m => m.collectBrave(companyName, domain)))),
      timeout(safeCollect(() => import('@/lib/collectors/newsapi').then(m => m.collectNews(companyName)))),
      timeout(safeCollect(() => import('@/lib/collectors/pappers').then(m => m.collectPappers(companyName, domain)))),
    ])

    const aggregated: AggregatedData = {
      companyName,
      domain,
      github: github ?? undefined,
      wappalyzer: wappalyzer ?? undefined,
      siteQuality: siteQuality ?? undefined,
      brave: search ?? undefined,
      news: news ?? undefined,
      pappers: pappers ?? undefined,
    }

    const scored = await scoreAccount(aggregated)

    const sq = aggregated.siteQuality
    const webQuality = sq ? {
      hosting: sq.hosting,
      isResponsive: sq.isResponsive,
      hasHttps: sq.hasHttps,
      hasCareers: sq.hasCareers,
      hasBlog: sq.hasBlog,
      framework: sq.framework,
      isPageBuilder: sq.isPageBuilder,
      techJobsCount: sq.techJobsFound.length,
      hasPricing: sq.hasPricing,
      hasSignup: sq.hasSignup,
      hasDemo: sq.hasDemo,
      hasDocs: sq.hasDocs,
      hasLogin: sq.hasLogin,
      hasApi: sq.hasApi,
      hasIntegrations: sq.hasIntegrations,
      saasKeywords: sq.saasKeywords,
      consultingKeywords: sq.consultingKeywords,
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
        raw_data: { pappers: aggregated.pappers ?? null },
        status: 'done',
        domain: domain || null,
      })
      .eq('id', account.id)

    return res.status(200).json({ id: account.id, status: 'done' })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    await supabaseAdmin
      .from('accounts')
      .update({ status: 'error', error_message: msg })
      .eq('id', account.id)
    return res.status(500).json({ error: msg })
  }
}
