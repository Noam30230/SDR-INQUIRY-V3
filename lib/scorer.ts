import OpenAI from 'openai'
import type { AggregatedData, ScorerOutput, TechStack } from '@/types'
import { aggregate } from './aggregator'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

const SYSTEM_PROMPT = `Tu es un expert en qualification de comptes B2B pour Datadog.

Datadog est une plateforme de monitoring cloud (APM, logs, infrastructure, sécurité, synthetics).
Ta mission : analyser les données collectées sur une entreprise et lui attribuer un tier de priorité SDR.

CRITÈRES DE TIERING :
- T1 (haute priorité) : entreprise SaaS ou tech-forward, quel que soit le secteur (fintech, edtech, e-commerce, healthtech, legaltech...). Stack cloud visible (AWS/GCP/Azure), équipe tech structurée, recrutements DevOps/SRE/Platform/Backend actifs, bon site web moderne.
- T2 (priorité moyenne) : présence tech partielle, site correct, quelques signaux positifs (mention AI/cloud/API), mais moins de preuves concrètes.
- T3 (basse priorité) : secteur traditionnel, peu de signaux tech, site basique ou page builder.
- DQ (disqualifié) : ESN, SSII, cabinet de conseil IT pur services (pas de SaaS propre), institutions publiques, agences sans produit SaaS. ATTENTION : ne pas DQ uniquement à cause du secteur — une legaltech SaaS, une comptabilité SaaS, une RH SaaS sont T1 ou T2.

La question clé pour DQ : "Cette entreprise vend-elle un logiciel, ou vend-elle uniquement du temps humain/conseil ?"

SCORE (0-100) :
- 80-100 : Stack cloud visible + recrutements tech actifs + SaaS prouvé + site tech-forward
- 60-79 : Quelques signaux cloud/tech solides mais incomplets
- 40-59 : Signaux mixtes, incertitude sur le business model
- 20-39 : Peu de signaux tech, secteur traditionnel
- 0-19 : Clairement DQ ou aucun signal tech

Réponds UNIQUEMENT en JSON valide, sans markdown, sans texte autour.`

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
    lines.push(`\n[SIGNAUX WEB (Brave Search)]`)
    if (data.brave.techJobs.length) lines.push(`Recrutement tech : ${data.brave.techJobs.join(', ')}`)
    if (data.brave.cloudSignals.length) lines.push(`Signaux cloud : ${data.brave.cloudSignals.join(', ')}`)
    if (data.brave.fundingSignals.length) lines.push(`Signaux financement : ${data.brave.fundingSignals.join(', ')}`)
    if (data.brave.newsHeadlines.length) {
      lines.push(`Actualités récentes :`)
      data.brave.newsHeadlines.forEach(h => lines.push(`  - ${h}`))
    }
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
    model: 'gpt-4o',
    response_format: { type: 'json_object' },
    temperature: 0.2,
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      {
        role: 'user', content: `${userPrompt}

Retourne ce JSON exactement :
{
  "tier": "T1" | "T2" | "T3" | "DQ",
  "score": <nombre entre 0 et 100>,
  "tech_stack": {
    "Cloud": [],
    "Monitoring": [],
    "DevOps": [],
    "Languages": [],
    "Data": [],
    "AI": [],
    "Security": [],
    "Other": []
  },
  "signals": {
    "positive": ["signal 1", "signal 2", ...],
    "negative": ["signal 1", ...]
  },
  "reasoning": "Explication en 2-3 phrases."
}`,
      },
    ],
  })

  try {
    const raw = completion.choices[0].message.content || '{}'
    const parsed = JSON.parse(raw)

    // Merge avec la tech stack détectée localement
    const mergedStack: TechStack = { ...EMPTY_TECH_STACK }
    const keys = Object.keys(mergedStack) as Array<keyof TechStack>
    for (const key of keys) {
      const local = techStack[key] || []
      const gpt = parsed.tech_stack?.[key] || []
      mergedStack[key] = Array.from(new Set([...local, ...gpt]))
    }

    return {
      tier: parsed.tier || 'T3',
      score: typeof parsed.score === 'number' ? Math.max(0, Math.min(100, parsed.score)) : 50,
      tech_stack: mergedStack,
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
