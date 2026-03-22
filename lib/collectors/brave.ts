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

const TECH_JOB_KEYWORDS = ['devops', 'sre', 'platform', 'cloud', 'kubernetes', 'infrastructure', 'backend', 'software engineer', 'data', 'security']
const CLOUD_KEYWORDS = ['aws', 'gcp', 'azure', 'kubernetes', 'docker', 'terraform', 'microservices', 'cloud native', 'serverless', 'databricks', 'snowflake']
const FUNDING_KEYWORDS = ['series a', 'series b', 'series c', 'seed', 'levée de fonds', 'raised', 'funding', 'million', 'investment']

export async function collectBrave(companyName: string, domain?: string): Promise<BraveSearchData | null> {
  const apiKey = process.env.SERPER_API_KEY
  if (!apiKey) return null

  const name = `"${companyName}"`

  const [jobResults, cloudResults, fundingResults] = await Promise.all([
    serperSearch(`${name} devops OR sre OR kubernetes OR "software engineer" jobs hiring`, apiKey),
    serperSearch(`${name} aws OR gcp OR azure OR "cloud native" OR microservices OR kubernetes technology`, apiKey),
    serperSearch(`${name} funding OR "series" OR "raised" OR "levée de fonds" OR investment 2023 OR 2024 OR 2025`, apiKey),
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
