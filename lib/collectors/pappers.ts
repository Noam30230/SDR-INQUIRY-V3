import type { PappersData } from '@/types'

const BASE = 'https://api.pappers.fr/v2'

// Codes NAF qui indiquent une ESN / conseil IT → potentiel DQ
const ESN_NAF_CODES = ['6201Z', '6202A', '6202B', '6203Z', '6209Z', '6311Z', '6312Z', '6399Z']

export async function collectPappers(companyName: string, domain?: string): Promise<PappersData | null> {
  const apiKey = process.env.PAPPERS_API_KEY
  if (!apiKey) return null

  try {
    // Recherche par nom
    const searchRes = await fetch(
      `${BASE}/recherche?api_token=${apiKey}&q=${encodeURIComponent(companyName)}&par_page=3`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!searchRes.ok) return null

    const searchData = await searchRes.json()
    const results = searchData.resultats || []
    if (results.length === 0) return null

    // Prendre le premier résultat (le plus pertinent)
    const company = results[0]
    const siren = company.siren

    // Détail de l'entreprise
    const detailRes = await fetch(
      `${BASE}/entreprise?api_token=${apiKey}&siren=${siren}&champs=siren,nom_entreprise,forme_juridique,code_naf,libelle_code_naf,tranche_effectif_salarie,chiffre_affaires,dirigeants,date_creation`,
      { signal: AbortSignal.timeout(8000) }
    )
    if (!detailRes.ok) return null

    const detail = await detailRes.json()

    const naf = detail.code_naf || ''
    const isDQCandidate = ESN_NAF_CODES.includes(naf.replace('.', '').toUpperCase())

    const dirigeants: string[] = (detail.dirigeants || [])
      .slice(0, 5)
      .map((d: { prenom?: string; nom?: string; qualite?: string }) =>
        `${d.prenom || ''} ${d.nom || ''} (${d.qualite || ''})`.trim()
      )

    return {
      siren,
      nom: detail.nom_entreprise || companyName,
      effectif: detail.tranche_effectif_salarie || null,
      chiffre_affaires: detail.chiffre_affaires || null,
      naf,
      nafLabel: detail.libelle_code_naf || '',
      formeJuridique: detail.forme_juridique || '',
      dateCreation: detail.date_creation || '',
      dirigeants,
      isDQCandidate,
    }
  } catch {
    return null
  }
}
