import Anthropic from '@anthropic-ai/sdk'
import type { Account, TechStack } from '@/types'
import type { DealData, DealMeeting, MeetingIntel } from './types'
import { supabaseAdmin } from '@/lib/supabase-admin'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const TECH_CATEGORIES = ['Cloud', 'Monitoring', 'DevOps', 'Languages', 'Data', 'AI', 'Security', 'Other']

function extractJSON<T>(text: string): T | null {
  const match = text.match(/\{[\s\S]*\}/)
  if (!match) return null
  try { return JSON.parse(match[0]) as T }
  catch { return null }
}

/**
 * Extract structured intel from meeting notes or a transcript.
 * Also detects corrections to the automated scoring (e.g. AWS → Azure).
 */
export async function extractMeetingIntel(
  account: Account,
  meeting: Pick<DealMeeting, 'stage' | 'title' | 'date' | 'kind' | 'content'>,
  vendorName: string,
  preparerName: string
): Promise<MeetingIntel> {
  const stack = account.tech_stack
  const currentStack = TECH_CATEGORIES
    .map(cat => `${cat}: ${((stack as unknown as Record<string, string[]>)?.[cat] ?? []).join(', ') || 'none'}`)
    .join(' | ')

  const system = `You are a B2B sales intelligence analyst. A sales rep at ${vendorName} just had a "${meeting.stage}" interaction with the prospect "${account.company_name}" and recorded ${meeting.kind === 'transcript' ? 'a meeting transcript' : 'call notes'}.

Your job: extract every piece of actionable intelligence and detect corrections to our automated account data.

CURRENT AUTOMATED DATA (may be wrong — the rep's notes are ground truth):
Tech stack detected: ${currentStack}
Tier: ${account.tier} | Score: ${account.score}
Reasoning: ${account.reasoning ?? 'None'}

CORRECTION DETECTION — CRITICAL:
- If the notes/transcript state a tech fact that CONTRADICTS the detected stack (e.g. detected "AWS" but rep heard "Azure"), emit a correction with field = the TechStack category (one of: ${TECH_CATEGORIES.join(', ')}) and new_values = ONLY what the rep heard. The rep saw/heard the environment firsthand — their version replaces ours entirely.
- Also emit corrections for confirmed facts that ADD to a category we had empty.
- Never emit a correction for something merely implied.

STAKEHOLDERS: extract every person named in the notes with their title if mentioned. Suggest a role: Economic Buyer / Validated Champion / Potential Champion / Coach / Technical Validator / Other. Someone who showed concrete pain + engagement = Potential Champion (Validated only if they actively advocated or committed to something).

CHAMPION UPDATES: if a person already known shows champion behavior (brought colleagues, asked for pricing, defended us against an objection, committed to internal action), emit a champion_update suggesting promotion, with the evidence quote.

FOLLOW-UP EMAIL: write a short follow-up email the rep can send after this meeting. Reference specifics actually discussed. No hype adjectives. No em dashes. Sign-off: "Best,\\n${preparerName}". Start: "Hi [first name]," using the main interlocutor's first name if known.

Respond ONLY with valid JSON. No markdown.`

  const user = `Meeting: "${meeting.title}" (${meeting.date}) — stage: ${meeting.stage}

${meeting.kind === 'transcript' ? 'TRANSCRIPT' : 'NOTES'}:
${meeting.content.slice(0, 60000)}

Return this exact JSON:
{
  "summary": "3-4 sentences: what happened, what was learned, where the deal stands",
  "key_facts": ["short factual statements learned in this meeting (stack, team, process, budget…)"],
  "corrections": [
    {"field": "Cloud", "new_values": ["Azure"], "evidence": "exact quote or paraphrase from the notes"}
  ],
  "stakeholders_mentioned": [
    {"name": "...", "title": "...", "suggested_role": "Potential Champion", "evidence": "why this role"}
  ],
  "pains": ["specific pains the prospect expressed"],
  "objections": [
    {"objection": "what they pushed back on, in their words", "suggested_response": "1-2 sentence response strategy"}
  ],
  "budget_timing": "any budget or timeline info heard, else null",
  "competitors": ["competitor names mentioned"],
  "champion_updates": [
    {"name": "...", "suggestion": "Validated Champion", "evidence": "what they did that proves it"}
  ],
  "next_steps": ["agreed next steps"],
  "risks": ["deal risks spotted in this conversation"],
  "follow_up_email": {"subject": "...", "body": "..."}
}`

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 3000,
    system,
    messages: [{ role: 'user', content: user }],
  })

  const text = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === 'text')
    .map(b => b.text)
    .join('')

  const intel = extractJSON<MeetingIntel>(text)
  if (!intel) throw new Error('Intel extraction returned invalid JSON')

  return {
    summary: intel.summary ?? '',
    key_facts: intel.key_facts ?? [],
    corrections: (intel.corrections ?? []).map(c => ({ ...c, applied: false })),
    stakeholders_mentioned: intel.stakeholders_mentioned ?? [],
    pains: intel.pains ?? [],
    objections: intel.objections ?? [],
    budget_timing: intel.budget_timing ?? null,
    competitors: intel.competitors ?? [],
    champion_updates: intel.champion_updates ?? [],
    next_steps: intel.next_steps ?? [],
    risks: intel.risks ?? [],
    follow_up_email: intel.follow_up_email ?? null,
  }
}

/**
 * Apply tech-stack corrections to the account (e.g. Cloud: AWS → Azure)
 * and append key facts to the deal's accumulated ground truth.
 */
export async function applyCorrections(
  account: Account,
  deal: DealData,
  intel: MeetingIntel
): Promise<{ stackChanged: boolean }> {
  let stackChanged = false
  const stack = { ...(account.tech_stack ?? {}) } as unknown as Record<string, string[]>

  for (const correction of intel.corrections) {
    if (TECH_CATEGORIES.includes(correction.field) && correction.new_values?.length) {
      stack[correction.field] = correction.new_values
      correction.applied = true
      stackChanged = true
      deal.facts.push(`${correction.field}: ${correction.new_values.join(', ')} (confirmed by rep — ${correction.evidence})`)
    }
  }

  for (const fact of intel.key_facts) {
    if (!deal.facts.includes(fact)) deal.facts.push(fact)
  }
  // Keep the ground-truth list manageable
  if (deal.facts.length > 60) deal.facts = deal.facts.slice(-60)

  if (stackChanged) {
    await supabaseAdmin
      .from('accounts')
      .update({ tech_stack: stack as unknown as TechStack })
      .eq('id', account.id)
    ;(account as unknown as Record<string, unknown>).tech_stack = stack
  }

  return { stackChanged }
}
