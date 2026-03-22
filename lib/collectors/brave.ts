import type { BraveSearchData } from '@/types'

const BASE = 'https://api.search.brave.com/res/v1/web/search'

async function braveSearch(query: string, apiKey: string, count = 5): Promise<string[]> {
  try {
    const res = await fetch(
      `${BASE}?q=${encodeURIComponent(query)}&count=${count}&search_lang=en&country=us`,
      {
        headers: {
          Accept: 'application/json',
          'Accept-Encoding': 'gzip',
          'X-Subscription-Token': apiKey,
        },
        signal: AbortSignal.timeout(8000),
      }
    )
    if (!res.ok) return []
    const data = await res.json()
    return (data.web?.results || []).map((r: { title: string; description: string }) =>
      `${r.title} — ${r.description || ''}`
    )
  } catch {
    return []
  }
}

const TECH_JOB_KEYWORDS = ['devops', 'sre', 'platform', 'cloud', 'kubernetes', 'infrastructure', 'backend', 'software engineer', 'data', 'security']
const CLOUD_KEYWORDS = ['aws', 'gcp', 'azure', 'kubernetes', 'docker', 'terraform', 'microservices', 'cloud native', 'serverless', 'databricks', 'snowflake']
const FUNDING_KEYWORDS = ['series a', 'series b', 'series c', 'seed', 'levée de fonds', 'raised', 'funding', 'million', 'investment']

export async function collectBrave(companyName: string, domain?: string): Promise<BraveSearchData | null> {
  const apiKey = process.env.BRAVE_SEARCH_API_KEY
  if (!apiKey) return null

  const name = `"${companyName}"`

  const [jobResults, cloudResults, fundingResults] = await Promise.all([
    braveSearch(`${name} devops OR sre OR kubernetes OR "software engineer" jobs hiring`, apiKey),
    braveSearch(`${name} aws OR gcp OR azure OR "cloud native" OR microservices OR kubernetes technology`, apiKey),
    braveSearch(`${name} funding OR "series" OR "raised" OR "levée de fonds" OR investment 2023 OR 2024 OR 2025`, apiKey),
  ])

  const allJobText = jobResults.join(' ').toLowerCase()
  const allCloudText = cloudResults.join(' ').toLowerCase()
  const allFundingText = fundingResults.join(' ').toLowerCase()

  const techJobs = TECH_JOB_KEYWORDS.filter(kw => allJobText.includes(kw))
  const cloudSignals = CLOUD_KEYWORDS.filter(kw => allCloudText.includes(kw))
  const fundingSignals = FUNDING_KEYWORDS.filter(kw => allFundingText.includes(kw))

  return {
    techJobs,
    cloudSignals,
    newsHeadlines: fundingResults.slice(0, 3),
    fundingSignals,
  }
}
