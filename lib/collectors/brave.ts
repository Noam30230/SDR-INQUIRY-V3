import type { BraveSearchData } from '@/types'

async function serperSearch(query: string, apiKey: string, num = 5): Promise<string[]> {
  try {
    const res = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num }),
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return []
    const data = await res.json()
    return (data.organic || []).map((r: { title: string; snippet?: string }) =>
      `${r.title} — ${r.snippet || ''}`
    )
  } catch {
    return []
  }
}

const TECH_JOB_ROLES = [
  'devops', 'sre', 'platform engineer', 'cloud engineer', 'infrastructure',
  'backend engineer', 'software engineer', 'data engineer', 'security engineer',
  'mlops', 'data scientist', 'solutions architect',
]

const FUNDING_KEYWORDS = [
  'series a', 'series b', 'series c', 'series d', 'seed round',
  'raised', 'funding', 'levée de fonds', 'investment', 'million',
]

export async function collectBrave(companyName: string, domain?: string): Promise<BraveSearchData | null> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) return null

  const name = `"${companyName}"`

  // Only two queries: hiring signals + funding signals
  // We do NOT use Serper for tech stack — too many false positives from generic snippets
  const [jobResults, fundingResults] = await Promise.all([
    serperSearch(`${name} jobs hiring "software engineer" OR devops OR sre OR "data engineer" OR "platform engineer"`, apiKey),
    serperSearch(`${name} funding OR "series" OR "raised" OR "levée de fonds" OR investment 2023 OR 2024 OR 2025`, apiKey),
  ])

  const allJobText = jobResults.join(' ').toLowerCase()
  const allFundingText = fundingResults.join(' ').toLowerCase()

  const techJobRoles = TECH_JOB_ROLES.filter(role => allJobText.includes(role))
  const fundingSignals = FUNDING_KEYWORDS.filter(kw => allFundingText.includes(kw))

  return {
    isTechHiring: techJobRoles.length > 0,
    techJobRoles,
    newsHeadlines: fundingResults.slice(0, 3),
    fundingSignals,
  }
}
