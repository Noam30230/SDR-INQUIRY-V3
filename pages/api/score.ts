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

  // Cross-user cache — reuse result if same domain scored in last 30 days
  if (domain) {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: cached } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('domain', domain)
      .eq('status', 'done')
      .gte('created_at', thirtyDaysAgo)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (cached) {
      const { data: newAccount } = await supabaseAdmin
        .from('accounts')
        .insert({
          user_id: user.id,
          company_name: companyName || cached.company_name,
          domain: cached.domain,
          salesforce_id: salesforceId || null,
          tier: cached.tier,
          score: cached.score,
          signals: cached.signals,
          tech_stack: cached.tech_stack,
          web_quality: cached.web_quality,
          press_signals: cached.press_signals,
          reasoning: cached.reasoning,
          raw_data: cached.raw_data,
          status: 'done',
        })
        .select()
        .single()
      return res.status(200).json({ id: newAccount?.id, status: 'done', cached: true })
    }
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
    const [github, wappalyzer, siteQuality, pappers] = await Promise.all([
      timeout(safeCollect(() => import('@/lib/collectors/github').then(m => m.collectGitHub(companyName, domain)))),
      timeout(safeCollect(() => domain ? import('@/lib/collectors/wappalyzer').then(m => m.collectWappalyzer(domain)) : Promise.resolve(null))),
      timeout(safeCollect(() => domain ? import('@/lib/collectors/site-quality').then(m => m.collectSiteQuality(domain)) : Promise.resolve(null))),
      timeout(safeCollect(() => import('@/lib/collectors/pappers').then(m => m.collectPappers(companyName, domain)))),
    ])

    const aggregated: AggregatedData = {
      companyName,
      domain,
      github: github ?? undefined,
      wappalyzer: wappalyzer ?? undefined,
      siteQuality: siteQuality ?? undefined,
      pappers: pappers ?? undefined,
    }

    const EMPTY_STACK = { Cloud: [], Monitoring: [], DevOps: [], Languages: [], Data: [], AI: [], Security: [], Other: [] }

    // Hard DQ rule: already a Datadog customer
    const datadogInWappalyzer = wappalyzer?.technologies?.some(t => t.name.toLowerCase() === 'datadog')
    const datadogInGitHub = github?.techSignals?.some(t => t.toLowerCase().includes('datadog'))
    if (datadogInWappalyzer || datadogInGitHub) {
      await supabaseAdmin.from('accounts').update({
        tier: 'DQ',
        score: 0,
        signals: { positive: [], negative: ['Already a Datadog customer — no outbound needed'] },
        tech_stack: EMPTY_STACK,
        web_quality: null,
        press_signals: { articles: [] },
        reasoning: 'Datadog detected in this company\'s tech stack. They are already a customer — skip outbound.',
        raw_data: { pappers: pappers ?? null, alreadyCustomer: true },
        status: 'done',
        domain: domain || null,
      }).eq('id', account.id)
      return res.status(200).json({ id: account.id, status: 'done' })
    }

    // Hard DQ rule: ESN/IT consulting NAF code, BUT override if website shows SaaS signals
    if (pappers?.isDQCandidate) {
      const sq = siteQuality
      const hasSaaSSignals = !!(sq?.hasPricing || sq?.hasSignup || sq?.hasDemo || sq?.hasLogin || sq?.hasApi)
      if (!hasSaaSSignals) {
        await supabaseAdmin.from('accounts').update({
          tier: 'DQ',
          score: 5,
          signals: {
            positive: [],
            negative: [`NAF code ${pappers.naf} (${pappers.nafLabel}) — IT consulting / ESN, not a software product company`],
          },
          tech_stack: EMPTY_STACK,
          web_quality: null,
          press_signals: { articles: [] },
          reasoning: `Automatically disqualified: NAF code ${pappers.naf} indicates an IT services / consulting firm (ESN). Datadog targets software product companies, not service providers.`,
          raw_data: { pappers: pappers ?? null },
          status: 'done',
          domain: domain || null,
        }).eq('id', account.id)
        return res.status(200).json({ id: account.id, status: 'done' })
      }
      // SaaS signals found despite ESN NAF — let GPT decide, flag it in aggregated data
      aggregated.pappers = { ...pappers, isDQCandidate: false }
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
        raw_data: {
          pappers: aggregated.pappers ?? null,
          call_angle: scored.call_angle || null,
          funding: scored.funding || null,
        },
        status: 'done',
        domain: domain || null,
      })
      .eq('id', account.id)

    return res.status(200).json({ id: account.id, status: 'done', tier: scored.tier, score: scored.score })

  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Erreur inconnue'
    await supabaseAdmin
      .from('accounts')
      .update({ status: 'error', error_message: msg })
      .eq('id', account.id)
    return res.status(500).json({ error: msg })
  }
}
