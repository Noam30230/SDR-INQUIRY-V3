import type { Account } from '@/types'
import type { DealData, DealContact, Step1Result, BriefLanguage } from './types'
import { STAGE_LABELS } from './types'

function languageBlock(language: BriefLanguage): string {
  if (language !== 'fr') return ''
  return `

LANGUAGE — CRITICAL:
Write ALL content in professional French (France) — every title, body, signal, question, email and LinkedIn message. This is for a French sales team selling on the French market.
- Keep the JSON keys and the "tag" field values in English exactly as specified in the schema (Signal 1, Matches Signal 1, Trigger 1, Structural Fit…).
- Keep universally-used sales/tech jargon in English where French teams use it naturally (Champion, Economic Buyer, discovery, pipeline, cloud, SaaS…).
- Outbound emails and LinkedIn messages: natural French as a French SDR would actually write, vouvoiement.`
}

function formatAccountData(account: Account): string {
  const stack = account.tech_stack

  const stackFlat = [
    ...(stack?.Cloud ?? []),
    ...(stack?.Data ?? []),
    ...(stack?.AI ?? []),
    ...(stack?.DevOps ?? []),
    ...(stack?.Monitoring ?? []),
  ].filter(Boolean).join(', ')

  return `
Company: ${account.company_name}
Domain: ${account.domain ?? 'Unknown'}
Tier: ${account.tier ?? 'Unknown'} | Score: ${account.score ?? 'Unknown'}

Detected tech stack: ${stackFlat || 'None detected'}
Positive signals: ${account.signals?.positive?.join(', ') || 'None'}
Negative signals: ${account.signals?.negative?.join(', ') || 'None'}
AI reasoning: ${account.reasoning ?? 'None'}

Press articles: ${account.press_signals?.articles?.slice(0, 5).map(a => `[${a.date}] ${a.title} (${a.source})`).join(' | ') || 'None'}

Call angle: ${(account.raw_data?.call_angle as string) ?? 'None'}
Funding: ${(account.raw_data?.funding as string) ?? 'Unknown'}
`.trim()
}

function formatMeetingsIntel(deal: DealData): string {
  if (!deal.meetings.length && !deal.facts.length) return ''
  const meetings = deal.meetings.map(m => {
    const intel = m.intel
    const parts = [
      `### ${STAGE_LABELS[m.stage]} — "${m.title}" (${m.date})`,
      intel?.summary ? `Summary: ${intel.summary}` : '',
      intel?.pains?.length ? `Pains heard: ${intel.pains.join(' | ')}` : '',
      intel?.objections?.length ? `Objections raised: ${intel.objections.map(o => o.objection).join(' | ')}` : '',
      intel?.budget_timing ? `Budget / timing: ${intel.budget_timing}` : '',
      intel?.competitors?.length ? `Competitors mentioned: ${intel.competitors.join(', ')}` : '',
      intel?.next_steps?.length ? `Agreed next steps: ${intel.next_steps.join(' | ')}` : '',
      intel?.key_facts?.length ? `Key facts: ${intel.key_facts.join(' | ')}` : '',
      m.kind === 'notes' ? `Raw notes:\n${m.content.slice(0, 1500)}` : '',
    ].filter(Boolean)
    return parts.join('\n')
  }).join('\n\n')

  const facts = deal.facts.length ? `\nACCUMULATED GROUND-TRUTH FACTS (verified by the sales rep across meetings — these OVERRIDE any conflicting detected signal):\n${deal.facts.map(f => `- ${f}`).join('\n')}` : ''

  return `\nMEETING HISTORY (real conversations with the prospect — GROUND TRUTH, overrides automated detection):\n${meetings}\n${facts}`
}

function formatContacts(contacts: DealContact[]): string {
  if (!contacts.length) return 'No contacts provided — only include people found with confirmed sources in web search.'
  return contacts.map(c =>
    `- ${c.name} | ${c.title}${c.email ? ` | ${c.email}` : ''}${c.linkedin ? ` | ${c.linkedin}` : ''} | role: ${c.role}`
  ).join('\n')
}

// ─── STEP 1 — Web research + 3 Whys ─────────────────────────────────────────

export function buildStep1Prompt(
  account: Account,
  vendorName: string,
  vendorDomain: string,
  deal: DealData,
  language: BriefLanguage = 'en'
): { system: string; user: string } {
  const system = `You are an elite commercial intelligence analyst. Your job is to produce structured account intelligence for a B2B sales rep working at ${vendorName} (${vendorDomain}).

You know ${vendorName}'s product from your own knowledge of the company and its public positioning. All "Why Product" capabilities must be real ${vendorName} capabilities.

You follow a strict framework called the "3 Whys":
- WHY ANYTHING: 3 pain points this specific prospect has right now (operational, financial, strategic). These must be grounded in observable signals — tech stack, team growth, press events, regulatory context. Each pain must be distinct (no theme overlap).
- WHY PRODUCT: 3 capabilities of ${vendorName} that map EXACTLY 1-for-1 to each pain. Signal 1 maps to Why Product 1, Signal 2 to Why Product 2, etc. No mixing.
- WHY NOW: 3 timing triggers that create urgency for THIS account at THIS moment. Must be recent, verifiable events — not generic trends. Each trigger names the best persona to engage first.

MOTION SYSTEM — declare one based on what you find:
- Motion A (Upgrade): Prospect already uses a tool in the same category as ${vendorName} → conversation is about maturity and TCO
- Motion B (Greenfield): No incumbent in this category → conversation is about category creation
- Motion C (Competitive): Prospect evaluates or uses a competitor → conversation is about differentiation

EPISTEMIC RULES:
- Distinguish facts (confirmed signals) from inferences (reasoned extrapolation)
- Never invent data. If unknown, say so explicitly.
- "Why Now" triggers must answer: why this week, not in 6 months?
- Events older than 18 months are context, not triggers.
- Cloudflare is present at thousands of companies and is NOT a differentiating signal — do not mention it unless it is the direct subject of ${vendorName}'s capability.

DATING DISCIPLINE — CRITICAL, ZERO TOLERANCE:
- Before calling ANYTHING "recent", "just", "newly", or using it as a timing trigger, you MUST establish its date from the search result. The current date is given in the task below — compute the age of every event against it.
- "Recent" / "récent" may ONLY describe events less than 3 MONTHS old. An event from a blog post published 2 years ago is NOT recent, even if you found it today. Finding an article today does not make its content current.
- Events 3-18 months old: you may cite them, but ALWAYS with their explicit date ("in March 2025"), never with recency words.
- If you cannot date an event from the source, do not present it as timed at all — and NEVER build a "Why Now" trigger on it.
- A "Why Now" trigger built on an undated or stale event is a critical error: the rep will say "I saw you just changed your pricing" about something from 2023 and instantly lose credibility.

SOURCING — MANDATORY:
- Every number and every key fact (headcount, funding amount, dates, growth figures, pricing changes, leadership changes, product launches) must carry its source inline in the body text, in parentheses: "(LinkedIn, May 2026)", "(TechCrunch, Jan 2025)", "(company blog, 2023)".
- Format: (source name, date of the information). The date is the date of the information itself, not the date you searched.
- A fact you cannot attribute to a source does not go in the brief. No exceptions for round numbers or "well-known" facts.

MEETING HISTORY OVERRIDE — CRITICAL:
- If meeting history is provided below, it is GROUND TRUTH from real conversations with the prospect. It overrides ANY conflicting signal from automated detection or web search.
- TECH STACK OVERRIDE: if the rep heard a specific infrastructure or provider in a call (e.g. "they run on Azure"), use ONLY that. Do not merge with detected signals. Do not say "multi-cloud".
- Pains confirmed in calls take priority over inferred pains. Anchor "Why Anything" on what the prospect actually said whenever available.

ENRICHMENT FORMAT RULES — these must be SHORT:
- headcount: max 8 chars, e.g. "~62", "~1,640", "Unknown"
- funding: max 20 chars, e.g. "$652M", "No public funding", "Unknown"
- open_relevant_roles: integer only (0 if unknown)
- recent_events: ONLY events from the last 12 months, each with date and source, e.g. "Series B closed (TechCrunch, Mar 2026)". An event you cannot date does not belong here.
${languageBlock(language)}
OUTPUT: Return ONLY valid JSON matching the exact schema specified. No markdown, no explanation.`

  const today = new Date().toISOString().slice(0, 10)

  const user = `TODAY'S DATE: ${today} — use this to compute the age of every event you find. "Recent" = less than 3 months before this date.

Account data (collected by our scoring system — may be overridden by meeting history below):
${formatAccountData(account)}
${formatMeetingsIntel(deal)}

TASK: Use web search to enrich the account data. Perform exactly 3 searches — no more:
1. "${account.company_name} funding headcount employees" — funding history, team size
2. "${account.company_name} news announcement ${new Date().getFullYear()}" — recent strategic events, product launches, leadership changes
3. "${account.company_name} CTO VP Head of Engineering" — key stakeholders and open relevant roles

CRITICAL on headcount and funding: find the actual number from a credible source (LinkedIn, PitchBook, Crunchbase, Dealroom). If you find conflicting numbers, pick the most recent credible one. If the meeting history mentions a headcount, use that.

ABSOLUTE RULE on key_personnel: Only include a person if you found them in an actual web search result with a specific source (LinkedIn page, company site, press article). If your web search did not return a named executive with a verifiable source, return an empty array []. Do NOT infer executive names from general knowledge or company context. A hallucinated name is a critical error that damages the sales rep's credibility — an empty array is always the correct fallback.

Then produce the intelligence brief. Return this exact JSON:
{
  "company_summary": "one sentence: what the company does, how its core system works, and what the current state of its infrastructure appears to be",
  "how_they_make_money": "one sentence: business model, primary revenue driver, and where ${vendorName} fits in the value chain",
  "enrichment": {
    "headcount": "~62",
    "funding": "$10M Series A",
    "open_relevant_roles": 3,
    "recent_events": ["event 1 (max 10 words)", "event 2"],
    "key_personnel": []
  },
  "icp_rationale": [
    {"tag": "Structural Fit", "title": "short title of the structural ICP reason", "body": "specific observable signal that makes this company structurally ICP — 2 sentences. Not a sector label."},
    {"tag": "Tech Fit", "title": "short title", "body": "specific tech or product signal — 2 sentences."},
    {"tag": "Timing Fit", "title": "short title", "body": "why now is the right moment to engage — 2 sentences."}
  ],
  "motion": "A",
  "motion_evidence": "specific signal that determines the motion",
  "partner_angle": "if the account uses tools with a confirmed partnership/integration with ${vendorName}, describe it — else null",
  "why_anything": [
    {"tag": "Signal 1", "title": "short title of the pain", "body": "fact + implication. 2-3 sentences."},
    {"tag": "Signal 2", "title": "...", "body": "..."},
    {"tag": "Signal 3", "title": "...", "body": "..."}
  ],
  "why_product": [
    {"tag": "Matches Signal 1", "title": "outcome-first title", "body": "economic or risk outcome → specific ${vendorName} capability → why better than current state → metric to move. 2-3 sentences."},
    {"tag": "Matches Signal 2", "title": "...", "body": "..."},
    {"tag": "Matches Signal 3", "title": "...", "body": "..."}
  ],
  "why_now": [
    {"tag": "Trigger 1", "title": "timing trigger title", "body": "dated event with source (publication, date) → why it creates urgency → best persona to lead with. 2-3 sentences. The event date MUST appear in the body."},
    {"tag": "Trigger 2", "title": "...", "body": "..."},
    {"tag": "Trigger 3", "title": "...", "body": "..."}
  ]
}`

  return { system, user }
}

// ─── STEP 2 — Stakeholders + outbound + discovery prep ─────────────────────

export function buildStep2Prompt(
  accountName: string,
  step1: Step1Result,
  deal: DealData,
  vendorName: string,
  preparerName: string,
  language: BriefLanguage = 'en'
): { system: string; user: string } {
  const step1Summary = `
Motion: ${step1.motion} — ${step1.motion_evidence}
Partner angle: ${step1.partner_angle ?? 'None'}

Why Anything:
${step1.why_anything.map(s => `  ${s.tag}: ${s.title}`).join('\n')}

Why Product:
${step1.why_product.map(s => `  ${s.tag}: ${s.title}`).join('\n')}

Why Now:
${step1.why_now.map(s => `  ${s.tag}: ${s.title}`).join('\n')}

Key personnel found (web search verified): ${step1.enrichment.key_personnel.map(p => `${p.name} (${p.title})`).join(', ') || 'None confirmed'}
Recent events: ${step1.enrichment.recent_events.join(', ') || 'None'}
`.trim()

  const system = `You are a B2B sales strategist specializing in stakeholder mapping, discovery preparation, and outbound sequencing. The rep works at ${vendorName}.

SALES CYCLE CONTEXT — how this rep works:
- Cold call → goal: book a discovery call (the first video meeting with the prospect).
- Discovery call → goal: surface real pains and, if there are topics, book a concrete next step (demo, new business meeting, technical workshop…).
- This brief is generated 99% of the time right after a successful cold call, to PREPARE the discovery call. Everything must serve that: walk into the disco knowing the account cold, ask sharp questions, and walk out with a booked next step.

STAKEHOLDER FRAMEWORK:
- Validated Champion: confirmed through real conversation — has direct operational pain matching ${vendorName}, engaged, advocating internally.
- Potential Champion: has the profile and likely pain but not yet validated through conversation.
- Economic Buyer: controls budget and final decision. Typically VP/C-level.
- Coach: knows the org well, shares information, but lacks the pain or influence to champion.
- Technical Validator: documented involvement in a technical evaluation. Not a default category.

Classification rule: same title as a Champion but no specific documented signal → Coach, never Champion by inference. Respect the roles the rep has already assigned to provided contacts — they have first-hand knowledge.

Motion A entry rule: always validate what the Champion built before surfacing any limits. Never frame their current setup as a failure.

ABSOLUTE ANTI-HALLUCINATION RULES FOR PEOPLE — CRITICAL:
- A named person may ONLY appear in people_map, champion_shortlist, economic_buyers, or outbound if they were: (a) explicitly provided by the sales rep in the contacts list, OR (b) present in the key_personnel list from Step 1 enrichment (meaning a web search actually returned them with a source), OR (c) explicitly named in the meeting history.
- If no contacts were provided and Step 1 key_personnel is empty and no meeting history names anyone: ALL people_map arrays MUST be empty []. Do not invent anyone. Do not put placeholder names.
- A hallucinated person appearing in an outbound email is a catastrophic error — the sales rep will send it and look incompetent. An empty stakeholder map is infinitely better than a fabricated name.
- For contacts provided by the sales rep: use them exactly as given.

DISCOVERY PREP RULES:
- call_objective: ONE sentence — what the rep must walk out of the discovery call with. It should almost always end with a booked next step (demo, new business meeting…) anchored on the strongest pain.
- questions: 6-8 discovery questions, ordered. Each must be specific to THIS account (reference their stack, their events, what they said in the cold call). No generic "what keeps you up at night".
- If the cold call or past meetings raised objections, include questions that re-open and defuse them.
- landmines: things NOT to say given what we know (e.g. don't pitch a capability they said they don't need, don't mention a competitor positively).

OUTBOUND RULES:
- Every message must reference the prospect's specific tech stack or a specific dated event.
- NEVER call an event "recent" or "just happened" in a message unless Step 1 dated it within the last 3 months. Saying "I saw you just changed your pricing" about a 2-year-old blog post destroys the rep's credibility. When in doubt, name the event without recency framing.
- If meeting history exists, reference what was actually discussed — the messages are follow-ups, not cold outreach.
- Open with what the person has built, decided, or experienced — not with ${vendorName}.
- No hype adjectives: "leading", "robust", "powerful", "innovative".
- No em dashes anywhere. Use commas or restructure.
- Sign-off: "Best,\\n${preparerName}\\n${vendorName}"
- LinkedIn sign-off: "Best,\\n${preparerName}"
- Start every message: "Hi [first name]," (in French: "Bonjour [first name]," and sign-off "Bien à vous,\\n${preparerName}")
${languageBlock(language)}
OUTPUT: Return ONLY valid JSON. No markdown, no explanation.`

  const user = `Account: ${accountName}
Vendor: ${vendorName}
Preparer: ${preparerName}
Current deal stage: ${STAGE_LABELS[deal.stage]}

Intelligence summary:
${step1Summary}

Contacts provided by sales rep (verified, use as-is, respect assigned roles):
${formatContacts(deal.contacts)}
${formatMeetingsIntel(deal)}

TASK: Produce the full stakeholder map, champion profiles, economic buyer profiles, value messaging table, outbound messages, and discovery call prep.

Return this exact JSON:
{
  "people_map": {
    "economic_buyers": [{"name": "...", "title": "...", "role": "Economic Buyer", "email": "..."}],
    "champions": [{"name": "...", "title": "...", "role": "Validated Champion or Potential Champion", "email": "..."}],
    "coaches": [{"name": "...", "title": "...", "role": "Coach", "email": "..."}]
  },
  "champion_shortlist": [
    {
      "name": "...",
      "title": "...",
      "why_champion": "2-3 specific facts about this person that make them the right internal advocate",
      "entry_angle": "1-sentence opening that validates their current setup before surfacing a limit",
      "likely_objection": "the first pushback they will raise, in their words",
      "how_to_handle": "1-sentence response"
    }
  ],
  "economic_buyers": [
    {
      "name": "...",
      "title": "...",
      "why_them": "1-2 sentences on their role in the decision",
      "what_they_need": "1-2 sentences on what they need to see to move"
    }
  ],
  "value_messaging": [
    {
      "persona_name": "...",
      "persona_title": "...",
      "pain": "specific pain for this person, not generic",
      "product_mechanism": "specific ${vendorName} capability + what it does concretely for this person",
      "value_delivered": "expressed in their metrics: time recovered, incidents eliminated, cost reduced, etc."
    }
  ],
  "outbound": [
    {
      "name": "...",
      "title": "...",
      "role_in_deal": "Champion / Economic Buyer / Coach",
      "email": {"subject": "...", "body": "full email body — reference specific stack, specific event, specific pain, and past conversations if any"},
      "linkedin": {"body": "full LinkedIn message — shorter, more conversational than email"}
    }
  ],
  "discovery_prep": {
    "call_objective": "one sentence",
    "questions": ["question 1", "question 2", "... 6 to 8 total"],
    "landmines": ["thing not to say 1", "thing not to say 2"]
  }
}`

  return { system, user }
}
