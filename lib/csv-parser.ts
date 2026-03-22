// Smart CSV column detection — handles messy Salesforce exports and any column order

export interface ParsedRow {
  name: string
  domain?: string
  salesforceId?: string
}

// Patterns pour détecter chaque type de colonne (insensible à la casse)
const NAME_PATTERNS = [
  /^account.?name$/i, /^company.?name$/i, /^company$/i, /^account$/i,
  /^name$/i, /^nom$/i, /^entreprise$/i, /^organization$/i, /^org$/i,
  /^client$/i, /^prospect$/i,
]

const DOMAIN_PATTERNS = [
  /^website$/i, /^domain$/i, /^site$/i, /^web$/i, /^url$/i,
  /^homepage$/i, /^site.?web$/i, /^domaine$/i, /^website.?url$/i,
]

const SFDC_PATTERNS = [
  /^account.?id$/i, /^salesforce.?id$/i, /^sfdc.?id$/i, /^sf.?id$/i,
  /^crm.?id$/i, /^id$/i, /^record.?id$/i, /^accountid$/i,
]

function matchColumn(header: string, patterns: RegExp[]): boolean {
  return patterns.some(p => p.test(header.trim()))
}

function scoreColumn(header: string, patterns: RegExp[]): number {
  // Score plus élevé = meilleure correspondance (basé sur la position dans la liste)
  const idx = patterns.findIndex(p => p.test(header.trim()))
  return idx === -1 ? -1 : patterns.length - idx
}

function cleanDomain(value: string): string {
  if (!value) return ''
  return value
    .trim()
    .replace(/^https?:\/\//i, '')
    .replace(/^www\./i, '')
    .replace(/\/.*$/, '')
    .toLowerCase()
}

export function detectColumns(headers: string[]): {
  nameCol: string | null
  domainCol: string | null
  sfdcCol: string | null
  allCols: string[]
} {
  let nameCol: string | null = null
  let domainCol: string | null = null
  let sfdcCol: string | null = null
  let bestNameScore = -1
  let bestDomainScore = -1
  let bestSfdcScore = -1

  for (const header of headers) {
    const ns = scoreColumn(header, NAME_PATTERNS)
    const ds = scoreColumn(header, DOMAIN_PATTERNS)
    const ss = scoreColumn(header, SFDC_PATTERNS)

    if (ns > bestNameScore) { bestNameScore = ns; nameCol = header }
    if (ds > bestDomainScore) { bestDomainScore = ds; domainCol = header }
    if (ss > bestSfdcScore) { bestSfdcScore = ss; sfdcCol = header }
  }

  // Éviter que la même colonne soit assignée à deux rôles
  if (nameCol && domainCol && nameCol === domainCol) domainCol = null
  if (nameCol && sfdcCol && nameCol === sfdcCol) sfdcCol = null
  if (domainCol && sfdcCol && domainCol === sfdcCol) sfdcCol = null

  // Ne garder que les colonnes avec un score positif
  if (bestNameScore < 0) nameCol = null
  if (bestDomainScore < 0) domainCol = null
  if (bestSfdcScore < 0) sfdcCol = null

  return { nameCol, domainCol, sfdcCol, allCols: headers }
}

export function parseRows(
  data: Record<string, string>[],
  nameCol: string,
  domainCol: string | null,
  sfdcCol: string | null
): ParsedRow[] {
  return data
    .map(row => ({
      name: (row[nameCol] || '').trim(),
      domain: domainCol ? cleanDomain(row[domainCol] || '') : undefined,
      salesforceId: sfdcCol ? (row[sfdcCol] || '').trim() : undefined,
    }))
    .filter(r => r.name)
}
