import Anthropic from '@anthropic-ai/sdk'
import type { AggregatedData, ScorerOutput, TechStack } from '@/types'
import { aggregate } from './aggregator'

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const SYSTEM_PROMPT = `You are a B2B account qualification expert for Datadog.

Datadog is a cloud monitoring platform (APM, logs, infrastructure, security, synthetics).
Your mission: search the web to find real signals about this company, then assign an SDR priority tier.

SEARCH STRATEGY (do 3 targeted searches):
1. Search "[company name] tech stack cloud infrastructure DevOps" to find cloud/infra signals
2. Search "[company name] hiring engineer SRE DevOps" to find tech team signals
3. Search "[company name] funding raised Series investment levée de fonds Bpifrance financement" to find funding stage — search in both English AND French

TIERING CRITERIA:
- T1 (high priority): SaaS or tech-forward company. Visible cloud stack (AWS/GCP/Azure), structured tech team, active DevOps/SRE/Platform/Backend hiring, modern website. Any confirmed funding round (seed or above) boosts to T1 if other signals are present.
- T2 (medium priority): partial tech presence, some positive signals (AI/cloud/API mentions), less concrete evidence.
- T3 (low priority): traditional sector, few tech signals, basic site or page builder.
- DQ (disqualified): IT consulting firms, pure services companies (no SaaS product), public institutions. Do NOT DQ based on sector — a legaltech SaaS, accounting SaaS, or HR SaaS are T1/T2.

Key DQ question: "Does this company sell software, or only human time/consulting?"

SCORE (0-100):
- 80-100: Visible cloud stack + active tech hiring + proven SaaS + tech-forward site
- 60-79: Some solid cloud/tech signals but incomplete
- 40-59: Mixed signals, uncertainty about business model
- 20-39: Few tech signals, traditional sector
- 0-19: Clearly DQ or no tech signal
- Any confirmed funding round (pre-seed/seed/Series A/B/C+) adds +10 to the score

FUNDING: Identify the funding stage from search results. Use one of: "pre-seed", "seed", "Series A", "Series B", "Series C+", "bootstrapped", "unknown".

CALL ANGLE: Write ONE short sentence in English (max 15 words) for the SDR's opening angle. Use the strongest signal found. Examples:
- "Just raised Series B — perfect timing to pitch observability as they scale"
- "K8s stack with no monitoring detected — clear gap to fill"
- "Prometheus user with fast-growing engineering team — strong displacement opportunity"

After searching, respond ONLY with valid JSON, no markdown, no surrounding text. All signals and reasoning must be in English.`

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
  lines.push(`  "funding": "pre-seed" | "seed" | "Series A" | "Series B" | "Series C+" | "bootstrapped" | "unknown",`)
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

export async function scoreAccount(data: AggregatedData): Promise<ScorerOutput> {
  const { techStack } = aggregate(data)
  const prompt = buildPrompt(data)

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 1500,
    tools: [{ type: 'web_search_20250305' as const, name: 'web_search' }],
    system: SYSTEM_PROMPT,
    messages: [{ role: 'user', content: prompt }],
  })

  const finalText: string = response.content
    .filter(block => block.type === 'text')
    .map(block => (block as Anthropic.TextBlock).text)
    .join('')

  try {
    // Extract JSON from response (might be wrapped in text)
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
