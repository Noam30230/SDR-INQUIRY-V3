import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromToken } from '@/lib/auth-server'
import { scoreAccount } from '@/lib/scorer'
import type { AggregatedData } from '@/types'

function extractCompanyName(website: string): string {
  const clean = website.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '')
  const part = clean.split('/')[0].split('.')[0]
  return part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
}

function extractCompanyDomain(website: string): string {
  return website.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0].split('.')[0].toLowerCase()
}

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

  const user = await getUserFromToken(token)
  if (!user) return res.status(401).json({ error: 'Non authentifié' })

  // Fetch user profile: company info + subscription/usage
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('company_website, subscription_status, subscription_plan, trial_ends_at, analyses_used, analyses_limit')
    .eq('id', user.id)
    .single()

  // ── Usage enforcement ──────────────────────────────────────────────────────
  if (profile) {
    const { subscription_status, trial_ends_at, analyses_used, analyses_limit } = profile

    // Trial expired
    if (subscription_status === 'trial' && trial_ends_at && new Date() > new Date(trial_ends_at)) {
      return res.status(402).json({ error: 'trial_expired' })
    }

    // Subscription inactive
    if (subscription_status === 'canceled') {
      return res.status(402).json({ error: 'subscription_inactive' })
    }

    // Monthly quota reached
    if ((analyses_used ?? 0) >= (analyses_limit ?? 30)) {
      return res.status(402).json({ error: 'usage_limit_reached' })
    }
  }
  // ──────────────────────────────────────────────────────────────────────────

  const clientCompany = profile?.company_website
    ? { name: extractCompanyName(profile.company_website), domain: extractCompanyDomain(profile.company_website) }
    : { name: 'your company', domain: '' }

  const { companyName: inputName, domain: inputDomain, salesforceId, searchDepth } = req.body as {
    companyName?: string; domain?: string; salesforceId?: string; searchDepth?: 'standard' | 'deep'
  }

  const domain = (inputDomain || '').trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').replace(/\/.*$/, '').toLowerCase()
  const companyName = inputName?.trim() || domain.split('.')[0] || ''
  if (!companyName) return res.status(400).json({ error: 'Company name or domain required' })

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
    const timeout = <T>(p: Promise<T | null>): Promise<T | null> =>
      Promise.race([p, new Promise<null>(r => setTimeout(() => r(null), 5000))])

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

    // Hard DQ: already a customer of the user's company (detected in tech stack)
    const clientDomain = clientCompany.domain
    const existingCustomerInWappalyzer = clientDomain
      ? wappalyzer?.technologies?.some(t => t.name.toLowerCase().includes(clientDomain))
      : false
    const existingCustomerInGitHub = clientDomain
      ? github?.techSignals?.some(t => t.toLowerCase().includes(clientDomain))
      : false

    if (existingCustomerInWappalyzer || existingCustomerInGitHub) {
      await supabaseAdmin.from('accounts').update({
        tier: 'DQ',
        score: 0,
        signals: { positive: [], negative: [`Already a ${clientCompany.name} customer — no outbound needed`] },
        tech_stack: EMPTY_STACK,
        web_quality: null,
        press_signals: { articles: [] },
        reasoning: `${clientCompany.name} detected in this company's tech stack. They are already a customer — skip outbound.`,
        raw_data: { pappers: pappers ?? null, alreadyCustomer: true },
        status: 'done',
        domain: domain || null,
      }).eq('id', account.id)
      return res.status(200).json({ id: account.id, status: 'done' })
    }

    // Hard DQ: ESN/IT consulting NAF code, unless website shows SaaS signals
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
          reasoning: `Automatically disqualified: NAF code ${pappers.naf} indicates an IT services / consulting firm (ESN). Targets software product companies, not service providers.`,
          raw_data: { pappers: pappers ?? null },
          status: 'done',
          domain: domain || null,
        }).eq('id', account.id)
        return res.status(200).json({ id: account.id, status: 'done' })
      }
      aggregated.pappers = { ...pappers, isDQCandidate: false }
    }

    const scored = await scoreAccount(aggregated, searchDepth ?? 'standard', clientCompany)

    // Hard DQ override: Claude confirmed existing customer via web search
    if (scored.is_existing_customer) {
      await supabaseAdmin.from('accounts').update({
        tier: 'DQ',
        score: 0,
        signals: { positive: [], negative: [`Already a ${clientCompany.name} customer — no outbound needed`] },
        tech_stack: EMPTY_STACK,
        web_quality: null,
        press_signals: { articles: [] },
        reasoning: `Confirmed ${clientCompany.name} customer via web search. They are already a customer — skip outbound.`,
        raw_data: { pappers: pappers ?? null, is_existing_customer: true },
        status: 'done',
        domain: domain || null,
      }).eq('id', account.id)
      return res.status(200).json({ id: account.id, status: 'done', tier: 'DQ', score: 0 })
    }

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
          is_existing_customer: scored.is_existing_customer || false,
        },
        status: 'done',
        domain: domain || null,
      })
      .eq('id', account.id)

    // Increment usage counter
    if (profile) {
      await supabaseAdmin.from('profiles')
        .update({ analyses_used: (profile.analyses_used ?? 0) + 1 })
        .eq('id', user.id)
    }

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
