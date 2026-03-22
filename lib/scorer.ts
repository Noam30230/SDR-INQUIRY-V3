import OpenAI from 'openai'
import type { AggregatedData, ScorerOutput, TechStack } from '@/types'
import { aggregate } from './aggregator'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `You are a B2B account qualification expert for Datadog.

Datadog is a cloud monitoring platform (APM, logs, infrastructure, security, synthetics).
Your mission: analyze collected data about a company and assign an SDR priority tier.

TIERING CRITERIA:
- T1 (high priority): SaaS or tech-forward company in any vertical (fintech, edtech, e-commerce, healthtech, legaltech...). Visible cloud stack (AWS/GCP/Azure), structured tech team, active DevOps/SRE/Platform/Backend hiring, modern website.
- T2 (medium priority): partial tech presence, decent site, some positive signals (AI/cloud/API mentions), but less concrete evidence.
- T3 (low priority): traditional sector, few tech signals, basic site or page builder.
- DQ (disqualified): IT consulting firms, pure services companies (no SaaS product), public institutions, agencies without their own SaaS. DO NOT DQ based on sector alone — a legaltech SaaS, accounting SaaS, or HR SaaS are T1 or T2.

Key DQ question: "Does this company sell software, or only human time/consulting?"

SCORE (0-100):
- 80-100: Visible cloud stack + active tech hiring + proven SaaS + tech-forward site
- 60-79: Some solid cloud/tech signals but incomplete
- 40-59: Mixed signals, uncertainty about business model
- 20-39: Few tech signals, traditional sector
- 0-19: Clearly DQ or no tech signal

Respond ONLY with valid JSON, no markdown, no surrounding text. All signals and reasoning must be in English.`

function buildUserPrompt(data: AggregatedData): string {
  const lines: string[] = [`Entreprise : ${data.companyName}`, `Domaine : ${data.domain || 'inconnu'}`]

  if (data.pappers) {
    lines.push(`\n[DONNÉES LÉGALES (Pappers)]`)
    lines.push(`Effectif : ${data.pappers.effectif || 'inconnu'}`)
    lines.push(`CA : ${data.pappers.chiffre_affaires ? `${data.pappers.chiffre_affaires}€` : 'inconnu'}`)
    lines.push(`Code NAF : ${data.pappers.naf} — ${data.pappers.nafLabel}`)
    lines.push(`Forme juridique : ${data.pappers.formeJuridique}`)
    if (data.pappers.isDQCandidate) lines.push(`⚠️ Code NAF suggère ESN/conseil — à confirmer`)
    if (data.pappers.dirigeants.length) lines.push(`Dirigeants : ${data.pappers.dirigeants.join(', ')}`)
  }

  if (data.github) {
    lines.push(`\n[GITHUB]`)
    if (data.github.orgFound) {
      lines.push(`Org GitHub : ${data.github.orgName} (${data.github.repoCount} repos publics)`)
      lines.push(`Langages : ${data.github.languages.join(', ')}`)
      lines.push(`Activité récente : ${data.github.recentActivity ? 'oui' : 'non'}`)
    } else {
      lines.push(`Aucune organisation GitHub trouvée`)
    }
  }

  if (data.wappalyzer?.technologies?.length) {
    lines.push(`\n[STACK TECHNIQUE (site web)]`)
    lines.push(data.wappalyzer.technologies.map(t => `${t.name} (${t.categories.join('/')})`).join(', '))
  }

  if (data.siteQuality) {
    lines.push(`\n[QUALITÉ DU SITE WEB]`)
    lines.push(`Site accessible : ${data.siteQuality.loadable ? 'oui' : 'non'}`)
    lines.push(`HTTPS : ${data.siteQuality.hasHttps ? 'oui' : 'non'}`)
    lines.push(`Responsive : ${data.siteQuality.isResponsive ? 'oui' : 'non'}`)
    lines.push(`Framework : ${data.siteQuality.framework || 'non détecté'}`)
    lines.push(`Page builder : ${data.siteQuality.isPageBuilder ? data.siteQuality.pageBuilderName : 'non'}`)
    lines.push(`Page carrières : ${data.siteQuality.hasCareers ? 'oui' : 'non'}`)
    if (data.siteQuality.techJobsFound.length) {
      lines.push(`Postes tech trouvés : ${data.siteQuality.techJobsFound.join(', ')}`)
    }
    lines.push(`Blog/changelog : ${data.siteQuality.hasBlog ? 'oui' : 'non'}`)
    lines.push(`Hébergeur (mentions légales) : ${data.siteQuality.hosting || 'non détecté'}`)
  }

  if (data.brave) {
    lines.push(`\n[HIRING & FUNDING SIGNALS]`)
    lines.push(`Actively hiring tech roles: ${data.brave.isTechHiring ? 'yes' : 'no'}`)
    if (data.brave.techJobRoles.length) lines.push(`Tech roles found: ${data.brave.techJobRoles.join(', ')}`)
    if (data.brave.fundingSignals.length) lines.push(`Funding signals: ${data.brave.fundingSignals.join(', ')}`)
    if (data.brave.newsHeadlines.length) {
      lines.push(`Recent news:`)
      data.brave.newsHeadlines.forEach(h => lines.push(`  - ${h}`))
    }
  }

  if (data.github?.techSignals?.length) {
    lines.push(`\n[TECH TOOLS CONFIRMED VIA GITHUB REPOS]`)
    lines.push(`(These are confirmed: found in repo names, topics or descriptions)`)
    lines.push(data.github.techSignals.join(', '))
  }

  if (data.news?.articles?.length) {
    lines.push(`\n[ARTICLES DE PRESSE]`)
    data.news.articles.forEach(a => lines.push(`  - [${a.date}] ${a.title} (${a.source})`))
  }

  return lines.join('\n')
}

const EMPTY_TECH_STACK: TechStack = {
  Cloud: [], Monitoring: [], DevOps: [], Languages: [], Data: [], AI: [], Security: [], Other: [],
}

export async function scoreAccount(data: AggregatedData): Promise<ScorerOutput> {
  const { techStack } = aggregate(data)
  const userPrompt = buildUserPrompt(data)

  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    temperature: 0.2,
    max_tokens: 600,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user', content: `${userPrompt}

IMPORTANT: Do NOT use your prior knowledge about this company. Only use the data provided above.
The tech stack has already been collected — do not add tools not mentioned in the data.

Return exactly this JSON:
{
  "tier": "T1" | "T2" | "T3" | "DQ",
  "score": <number between 0 and 100>,
  "signals": {
    "positive": ["signal 1", "signal 2", ...],
    "negative": ["signal 1", ...]
  },
  "reasoning": "2-3 sentence explanation in English based strictly on the provided data."
}`,
      },
    ],
  })

  try {
    const raw = completion.choices[0].message.content || '{}'
    const parsed = JSON.parse(raw)

    // Tech stack comes exclusively from collectors — GPT does not modify it
    return {
      tier: parsed.tier || 'T3',
      score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 50,
      tech_stack: techStack,
      signals: {
        positive: parsed.signals?.positive || [],
        negative: parsed.signals?.negative || [],
      },
      reasoning: parsed.reasoning || '',
    }
  } catch {
    return {
      tier: 'T3',
      score: 0,
      tech_stack: EMPTY_TECH_STACK,
      signals: { positive: [], negative: ['Erreur de parsing de la réponse GPT-4o'] },
      reasoning: 'Erreur lors de l\'analyse.',
    }
  }
}
