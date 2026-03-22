// OpenCorporates — registre global d'entreprises (gratuit, limité)
// Utilisé uniquement pour les entreprises non-françaises

interface OpenCorpData {
  name: string
  jurisdiction: string
  incorporationDate: string
  companyType: string
  registeredAddress: string
}

export async function collectOpenCorporates(companyName: string): Promise<OpenCorpData | null> {
  try {
    const res = await fetch(
      `https://api.opencorporates.com/v0.4/companies/search?q=${encodeURIComponent(companyName)}&per_page=3&format=json`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!res.ok) return null

    const data = await res.json()
    const companies = data.results?.companies || []
    if (companies.length === 0) return null

    const c = companies[0].company
    return {
      name: c.name || companyName,
      jurisdiction: c.jurisdiction_code || '',
      incorporationDate: c.incorporation_date || '',
      companyType: c.company_type || '',
      registeredAddress: c.registered_address_in_full || '',
    }
  } catch {
    return null
  }
}
