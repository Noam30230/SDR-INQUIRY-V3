// Sumble API — désactivé par défaut (tokens épuisés)
// Activer via SUMBLE_ENABLED=true dans les variables d'environnement
// Docs : https://docs.sumble.com/api

export async function collectSumble(companyName: string, domain?: string): Promise<Record<string, unknown> | null> {
  if (process.env.SUMBLE_ENABLED !== 'true') return null

  const apiKey = process.env.SUMBLE_API_KEY
  if (!apiKey) return null

  try {
    const res = await fetch('https://api.sumble.com/v1/companies/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({ name: companyName, domain }),
      signal: AbortSignal.timeout(10000),
    })

    if (!res.ok) return null
    return await res.json()
  } catch {
    return null
  }
}
