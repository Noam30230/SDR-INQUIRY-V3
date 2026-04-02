import type { BraveSearchData } from '@/types'

async function googleSearch(query: string, apiKey: string, cseId: string, num = 5): Promise<string[]> {
  try {
    const url = new URL('https://www.googleapis.com/customsearch/v1')
    url.searchParams.set('key', apiKey)
    url.searchParams.set('cx', cseId)
    url.searchParams.set('q', query)
    url.searchParams.set('num', String(num))
    const res = await fetch(url.toString(), { signal: AbortSignal.timeout(4000) })
    if (!res.ok) return []
    const data = await res.json()
    return (data.items || []).map((r: { title: string; snippet?: string }) =>
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
  const apiKey = process.env.GOOGLE_API_KEY
  const cseId = process.env.GOOGLE_CSE_ID
  if (!apiKey || !cseId) return null

  const name = `"${companyName}"`

  // Only two queries: hiring signals + funding signals
  // We do NOT use Serper for tech stack — too many false positives from generic snippets
  const [jobResults, fundingResults] = await Promise.all([
    googleSearch(`${name} jobs hiring "software engineer" OR devops OR sre OR "data engineer" OR "platform engineer"`, apiKey, cseId),
    googleSearch(`${name} funding OR "series" OR "raised" OR "levée de fonds" OR investment 2023 OR 2024 OR 2025`, apiKey, cseId),
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
