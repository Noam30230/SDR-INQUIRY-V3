import type { NextApiRequest, NextApiResponse } from 'next'
import Anthropic from '@anthropic-ai/sdk'
import { getUserFromToken } from '@/lib/auth-server'
import { getDeal, saveDeal, fetchAccountForUser, getPreparer, vendorFromWebsite } from '@/lib/account-intelligence/deal'
import { buildStep1Prompt, buildStep2Prompt } from '@/lib/account-intelligence/prompts'
import { buildHTML } from '@/lib/account-intelligence/html-template'
import type { Step1Result, Step2Result, BriefData } from '@/lib/account-intelligence/types'
import { STAGE_LABELS } from '@/lib/account-intelligence/types'
import type { Account } from '@/types'

export const config = { maxDuration: 300 }

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const SONNET = 'claude-sonnet-4-6'

function extractJSON<T>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) as T }
  catch { return null }
}

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

async function withRateLimitRetry<T>(fn: () => Promise<T>): Promise<T> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      return await fn()
    } catch (err) {
      const status = (err as { status?: number }).status
      if (status === 429 && attempt < 2) {
        await sleep(65_000)
        continue
      }
      throw err
    }
  }
  throw new Error('Max retries exceeded')
}

function textOf(response: Anthropic.Message): string {
  return response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  const user = await getUserFromToken(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { accountId, language } = req.body as { accountId?: string; language?: 'fr' | 'en' }
  if (!accountId) return res.status(400).json({ error: 'accountId required' })

  const account = await fetchAccountForUser(accountId, user.id)
  if (!account) return res.status(404).json({ error: 'Account not found' })

  const deal = getDeal(account)
  if (language) deal.language = language
  const briefLanguage = deal.language ?? 'en'
  const { name: preparerName, website } = await getPreparer(user.id, user.email)
  const vendor = vendorFromWebsite(website)

  try {
    // ── Step 1: web research + 3 Whys (Sonnet + web search) ─────────────────
    const s1Prompt = buildStep1Prompt(account as Account, vendor.name, vendor.domain, deal, briefLanguage)
    const s1Response = await withRateLimitRetry(() =>
      (anthropic.messages.create as (opts: unknown) => Promise<Anthropic.Message>)({
        model: SONNET,
        max_tokens: 4000,
        tools: [{ type: 'web_search_20250305', name: 'web_search' }],
        system: s1Prompt.system,
        messages: [{ role: 'user', content: s1Prompt.user }],
      })
    )
    const step1 = extractJSON<Step1Result>(textOf(s1Response))
    if (!step1) throw new Error('Step 1 returned invalid JSON')

    await sleep(3000)

    // ── Step 2: stakeholders + outbound + discovery prep ─────────────────────
    const s2Prompt = buildStep2Prompt(account.company_name, step1, deal, vendor.name, preparerName, briefLanguage)
    const s2Response = await withRateLimitRetry(() =>
      anthropic.messages.create({
        model: SONNET,
        max_tokens: 6000,
        system: s2Prompt.system,
        messages: [{ role: 'user', content: s2Prompt.user }],
      })
    )
    const step2 = extractJSON<Step2Result>(textOf(s2Response))
    if (!step2) throw new Error('Step 2 returned invalid JSON')

    // ── Step 3: assemble deal history + build HTML ───────────────────────────
    const dealHistory = deal.meetings.length ? {
      meetings: deal.meetings.map(m => ({
        title: m.title,
        date: m.date,
        stage: STAGE_LABELS[m.stage],
        summary: m.intel?.summary ?? '',
      })),
      next_steps: deal.meetings[deal.meetings.length - 1]?.intel?.next_steps ?? [],
      risks: [...new Set(deal.meetings.flatMap(m => m.intel?.risks ?? []))].slice(0, 6),
    } : undefined

    const briefData: BriefData = {
      account_name: account.company_name,
      vendor_name: vendor.name,
      month_year: new Date().toLocaleString(briefLanguage === 'fr' ? 'fr-FR' : 'en-US', { month: 'long', year: 'numeric' }),
      preparer_name: preparerName,
      step1,
      step2,
      deal_history: dealHistory,
    }

    const html = buildHTML(briefData, briefLanguage)

    const version = (deal.brief?.version ?? 0) + 1
    deal.brief = { step1, step2, html, generated_at: new Date().toISOString(), version }
    await saveDeal(account, deal)

    return res.status(200).json({ html, version, generated_at: deal.brief.generated_at })

  } catch (err) {
    console.error('Brief generation failed:', err)
    return res.status(500).json({ error: err instanceof Error ? err.message : 'Generation failed' })
  }
}
