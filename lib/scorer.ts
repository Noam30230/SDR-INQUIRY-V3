import Anthropic from '@anthropic-ai/sdk'
import type { AggregatedData, ScorerOutput, TechStack } from '@/types'
import { aggregate } from './aggregator'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

function buildSystemPrompt(clientName: string): string {
  return `You are a B2B account qualification expert for ${clientName}.

${clientName} is a monitoring and observability platform.
Your mission: search the web to find real signals about this company, then assign an SDR priority tier.

⚠️ EXISTING CUSTOMER CHECK — TOP PRIORITY:
Before anything else, search whether this company is already a ${clientName} customer.
If you find ANY evidence — case study, blog post, customer story, conference talk, press release, social media post, or ANY mention of this company using ${clientName} — then:
  → Set is_existing_customer: true
  → Set tier: "DQ"
  → Set score: 0
  → Stop. Do not evaluate anything else.
This overrides ALL other criteria. Even a T1 company must be DQ if they are already a ${clientName} customer.

TIERING CRITERIA (apply only if NOT an existing customer):
- T1 (high priority): Confirmed SaaS or tech product company. A modern website with SaaS signals (pricing, login, signup, API, integrations) ALONE is sufficient for T1 if the product is clearly software. Cloud stack is a bonus, NOT a requirement. Active hiring is a bonus, NOT a requirement. A stable SaaS company that isn't actively recruiting can still be T1.
- T2 (medium priority): Likely software company but product model is unclear, OR traditional sector company with meaningful tech signals. Some SaaS signals but not conclusive.
- T3 (low priority): Traditional sector, few or no tech signals, basic site or page builder, no SaaS indicators.
- DQ (disqualified): (1) Already a ${clientName} customer — see above. (2) Pure IT staff augmentation / ESN (sells human time only, no product). (3) Public institutions, NGOs. Do NOT DQ based on sector — legaltech, HR tech, fintech, AI, SaaS, AMOA tools, accounting software are T1/T2.

Key DQ question for non-customers: "Does this company sell software as a product, or exclusively human services?"

STRICT DQ RULES for ESN/consulting — a company is DQ only when ALL of the following are true:
1. No software product found (no login, no pricing, no SaaS signals on website)
2. Web search confirms pure services/consulting model with no product
3. Clear ESN/staff-aug signals: "régie", "portage salarial", "assistance technique", "IT staffing", or equivalent

If the company has a login portal, pricing page, signup CTA, or any software product — it CANNOT be DQ for ESN reasons. Assign T2 or T3 minimum.
Words like "accompagnement", "conseil", "consulting", "agence", "services" alone are NOT sufficient to DQ. Many software companies use these words to describe their support or onboarding offering.

SCORE (0-100):
- 85-100: Clear SaaS product + cloud stack confirmed + tech team signals + funding or strong growth
- 70-84: Clear SaaS product + modern tech website + some infra/team signals (this is the typical T1 range)
- 55-69: Likely SaaS but limited evidence, or good tech signals without confirmed product model
- 35-54: Mixed signals, traditional sector with some tech
- 0-34: Clearly DQ, no tech signals, or pure services
- Any confirmed funding round (pre-seed/seed/Series A/B/C+) adds +8 to the score

FUNDING: Identify the funding stage and amount from search results. Format: "Stage · Amount" if the amount is known (e.g. "Series B · €15M", "Seed · $2M", "Series A · €8M"). If no amount found, just the stage alone (e.g. "Series B"). Use one of these stages: "pre-seed", "seed", "Series A", "Series B", "Series C+", "bootstrapped", "unknown". Only include an amount if you find it explicitly in search results — do not guess.

CALL ANGLE: Write ONE short sentence in English (max 15 words) for the SDR's opening angle. Use the strongest signal found. Examples:
- "Just raised Series B — perfect timing to pitch observability as they scale"
- "K8s stack with no monitoring detected — clear gap to fill"
- "Prometheus user with fast-growing engineering team — strong displacement opportunity"

STRICT RULE — NO HALLUCINATION ON TECH STACK:
- For signals and reasoning, ONLY reference technologies that appear explicitly in the pre-collected data above (TECH STACK / GITHUB sections).
- If no cloud provider was detected in the pre-collected data, do NOT mention any cloud provider (not AWS, not GCP, not Azure).
- If a technology was not found by the collectors, do NOT assume or infer it based on the company sector, size, or any other signal.
- When in doubt about a technology, omit it entirely. Silence is better than a wrong tech signal.

After searching, respond ONLY with valid JSON, no markdown, no surrounding text. All signals and reasoning must be in English.`
}

function buildSearchInstruction(clientName: string, searchDepth: 'standard' | 'deep'): string {
  const customerCheck = `STEP 0 — EXISTING CUSTOMER CHECK (mandatory before any search):
First, use your training knowledge: do you know, from your training data, that this company uses or has ever used ${clientName}? Known customers, case studies, conference talks, press releases, or any public mention count.
If YES → immediately set is_existing_customer: true, tier: "DQ", score: 0. Skip all other steps.
If UNSURE → do ONE search: "${clientName} [company name] customer" and check results.
If that search returns ANY evidence (case study page, customer story, blog, conference talk, G2/Gartner review mentioning ${clientName}) → is_existing_customer: true, tier: "DQ", score: 0. Stop.
Only continue to qualification steps if you are confident they are NOT a ${clientName} customer.`

  if (searchDepth === 'deep') {
    return `${customerCheck}

SEARCH STRATEGY for qualification (only if NOT an existing customer — do exactly 2 searches):
1. Search "[company name] SaaS product tech stack cloud AWS GCP Azure funding" — product model + infra signals + funding
2. Search "[company name] software engineers team Crunchbase LinkedIn" — team signals and funding data`
  }
  return `${customerCheck}

SEARCH STRATEGY for qualification (only if NOT an existing customer — do exactly 1 search):
1. Search "[company name] SaaS product tech stack cloud funding" — product model, infra signals, and funding`
}

function buildPrompt(data: AggregatedData): string {
  const lines: string[] = [
    `Company: ${data.companyName}`,
    `Domain: ${data.domain || 'unknown'}`,
    ``,
    `Search the web for up-to-date signals about this company, then analyze ALL of the following pre-collected data too:`,
  ]

  if (data.pappers) {
    lines.push(`\n[LEGAL DATA (Pappers)]`)
    lines.push(`Employees: ${data.pappers.effectif || 'unknown'}`)
    lines.push(`Revenue: ${data.pappers.chiffre_affaires ? `${data.pappers.chiffre_affaires}€` : 'unknown'}`)
    lines.push(`NAF code: ${data.pappers.naf} — ${data.pappers.nafLabel}`)
    lines.push(`Legal form: ${data.pappers.formeJuridique}`)
    if (data.pappers.isDQCandidate) lines.push(`⚠ NAF suggests ESN/consulting — verify via website and search`)
    if (data.pappers.dirigeants.length) lines.push(`Directors: ${data.pappers.dirigeants.join(', ')}`)
  }

  if (data.github) {
    lines.push(`\n[GITHUB]`)
    if (data.github.orgFound) {
      lines.push(`Org: ${data.github.orgName} (${data.github.repoCount} public repos)`)
      lines.push(`Languages: ${data.github.languages.join(', ')}`)
      lines.push(`Recent activity: ${data.github.recentActivity ? 'yes' : 'no'}`)
      if (data.github.techSignals?.length) lines.push(`Tech signals: ${data.github.techSignals.join(', ')}`)
    } else {
      lines.push(`No GitHub org found`)
    }
  }

  if (data.wappalyzer?.technologies?.length) {
    lines.push(`\n[TECH STACK (website)]`)
    lines.push(data.wappalyzer.technologies.map(t => `${t.name} (${t.categories.join('/')})`).join(', '))
  }

  if (data.siteQuality) {
    const sq = data.siteQuality
    lines.push(`\n[WEBSITE ANALYSIS]`)
    lines.push(`HTTPS: ${sq.hasHttps ? 'yes' : 'no'} | Responsive: ${sq.isResponsive ? 'yes' : 'no'}`)
    lines.push(`Framework: ${sq.framework || 'unknown'} | Page builder: ${sq.isPageBuilder ? sq.pageBuilderName : 'no'}`)
    lines.push(`Cloud host (DNS/ASN): ${sq.hosting || 'unknown'}`)
    const saasFlags = [
      sq.hasPricing && 'pricing page',
      sq.hasSignup && 'sign-up CTA',
      sq.hasDemo && 'demo CTA',
      sq.hasLogin && 'login portal',
      sq.hasDocs && 'docs/API',
      sq.hasApi && 'API page',
      sq.hasIntegrations && 'integrations page',
      sq.hasCareers && 'careers page',
      sq.hasBlog && 'blog',
    ].filter(Boolean)
    if (saasFlags.length) lines.push(`SaaS signals: ${saasFlags.join(', ')}`)
    if (sq.saasKeywords.length) lines.push(`SaaS keywords: ${sq.saasKeywords.join(', ')}`)
    if (sq.consultingKeywords.length) lines.push(`⚠ Consulting signals: ${sq.consultingKeywords.join(', ')}`)
  }

  lines.push(`\nReturn ONLY this JSON (no markdown):`)
  lines.push(`{`)
  lines.push(`  "tier": "T1" | "T2" | "T3" | "DQ",`)
  lines.push(`  "score": <0-100>,`)
  lines.push(`  "funding": "Stage" or "Stage · Amount" — e.g. "Series B · €15M", "Seed · $2M", "Series A". Only include amount if explicitly found in search results.`)
  lines.push(`  "is_existing_customer": true | false,`)
  lines.push(`  "call_angle": "One sentence SDR opening angle in English (max 15 words)",`)
  lines.push(`  "signals": {`)
  lines.push(`    "positive": ["signal 1", ...],`)
  lines.push(`    "negative": ["signal 1", ...]`)
  lines.push(`  },`)
  lines.push(`  "reasoning": "2-3 sentences in English based on collected data AND what you found via search."`)
  lines.push(`}`)

  return lines.join('\n')
}

const EMPTY_TECH_STACK: TechStack = {
  Cloud: [], Monitoring: [], DevOps: [], Languages: [], Data: [], AI: [], Security: [], Other: [],
}

export async function scoreAccount(
  data: AggregatedData,
  searchDepth: 'standard' | 'deep' = 'standard',
  clientCompany: { name: string; domain: string } = { name: 'your company', domain: '' }
): Promise<ScorerOutput> {
  const { techStack } = aggregate(data)
  const prompt = buildPrompt(data)

  const searchInstruction = buildSearchInstruction(clientCompany.name, searchDepth)
  const systemPrompt = buildSystemPrompt(clientCompany.name)
    .replace('TIERING CRITERIA:', searchInstruction + '\n\nTIERING CRITERIA:')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const response = await (anthropic.messages.create as any)({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    tools: [{ type: 'web_search_20250305', name: 'web_search' }],
    system: systemPrompt,
    messages: [{ role: 'user', content: prompt }],
  })

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const finalText: string = (response.content as any[])
    .filter((block: any) => block.type === 'text')
    .map((block: any) => block.text as string)
    .join('')

  try {
    const jsonMatch = finalText.match(/\{[\s\S]*\}/)
    const raw = jsonMatch ? jsonMatch[0] : '{}'
    const parsed = JSON.parse(raw)

    return {
      tier: parsed.tier || 'T3',
      score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 50,
      tech_stack: techStack,
      signals: {
        positive: parsed.signals?.positive || [],
        negative: parsed.signals?.negative || [],
      },
      reasoning: parsed.reasoning || '',
      funding: parsed.funding || 'unknown',
      call_angle: parsed.call_angle || '',
      is_existing_customer: parsed.is_existing_customer === true,
    }
  } catch {
    return {
      tier: 'T3',
      score: 0,
      tech_stack: EMPTY_TECH_STACK,
      signals: { positive: [], negative: ['Failed to parse scoring response'] },
      reasoning: 'Scoring error.',
    }
  }
}
