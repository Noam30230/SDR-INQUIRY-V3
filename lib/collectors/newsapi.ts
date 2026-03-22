import type { NewsData, PressArticle } from '@/types'

export async function collectNews(companyName: string): Promise<NewsData | null> {
  const apiKey = process.env.NEWS_API_KEY
  if (!apiKey) return null

  try {
    const from = new Date(Date.now() - 1000 * 60 * 60 * 24 * 365).toISOString().split('T')[0]
    const res = await fetch(
      `https://newsapi.org/v2/everything?q=${encodeURIComponent(`"${companyName}"`)}&language=fr,en&sortBy=publishedAt&pageSize=5&from=${from}`,
      {
        headers: { 'X-Api-Key': apiKey },
        signal: AbortSignal.timeout(4000),
      }
    )
    if (!res.ok) return null

    const data = await res.json()
    const articles: PressArticle[] = (data.articles || []).map(
      (a: { title: string; url: string; publishedAt: string; source: { name: string } }) => ({
        title: a.title,
        url: a.url,
        date: a.publishedAt?.split('T')[0] || '',
        source: a.source?.name || '',
      })
    )

    return { articles }
  } catch {
    return null
  }
}
