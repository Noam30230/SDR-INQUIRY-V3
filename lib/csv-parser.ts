// Smart CSV column detection — handles messy Salesforce exports and any column order
// Falls back to content-based detection if headers don't match known patterns

export interface ParsedRow {
  name?: string
  domain: string
  salesforceId?: string
}

const NAME_PATTERNS = [
  /^account.?name$/i, /^company.?name$/i, /^company$/i, /^account$/i,
  /^name$/i, /^nom.?entreprise$/i, /^nom.?société$/i, /^nom.?de.?la.?société$/i,
  /^nom$/i, /^entreprise$/i, /^organization$/i, /^org$/i,
  /^client$/i, /^prospect$/i, /^raison.?sociale$/i, /^société$/i,
  /^business.?name$/i, /^firm$/i, /^entity$/i,
]

const DOMAIN_PATTERNS = [
  /^website$/i, /^domain$/i, /^site$/i, /^web$/i, /^url$/i,
  /^homepage$/i, /^site.?web$/i, /^domaine$/i, /^website.?url$/i,
  /^account.?site$/i, /^account.?website$/i, /^account.?url$/i,
  /^lien$/i, /^adresse.?web$/i, /^web.?address$/i, /^link$/i,
  /^page.?web$/i, /^web.?site$/i, /^internet$/i,
]

const SFDC_PATTERNS = [
  /^account.?id$/i, /^salesforce.?id$/i, /^sfdc.?id$/i, /^sf.?id$/i,
  /^crm.?id$/i, /^record.?id$/i, /^accountid$/i,
  /^id.?sfdc$/i, /^id.?salesforce$/i, /^sf$/i,
]

function scoreColumn(header: string, patterns: RegExp[]): number {
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
    .replace(/\?.*$/, '')
    .toLowerCase()
}

// Check if a string value looks like a domain or URL
function looksLikeDomain(value: string): boolean {
  if (!value) return false
  const cleaned = cleanDomain(value)
  // Must have a dot and a valid-looking TLD
  return /^[a-z0-9][a-z0-9\-_.]+\.[a-z]{2,}$/i.test(cleaned)
}

// Check if a string looks like a Salesforce 18-char ID
function looksLikeSalesforceId(value: string): boolean {
  return /^[a-zA-Z0-9]{15,18}$/.test(value.trim())
}

// Content-based fallback: scan actual cell values to find domain/name columns
function detectColumnsByContent(
  data: Record<string, string>[],
  headers: string[]
): { nameCol: string | null; domainCol: string | null; sfdcCol: string | null } {
  const sample = data.slice(0, 10)
  const scores: Record<string, { domain: number; sfdc: number; name: number }> = {}

  for (const h of headers) {
    scores[h] = { domain: 0, sfdc: 0, name: 0 }
    for (const row of sample) {
      const val = (row[h] || '').trim()
      if (!val) continue
      if (looksLikeDomain(val)) scores[h].domain++
      if (looksLikeSalesforceId(val)) scores[h].sfdc++
      // Name heuristic: no dots, not an ID, has letters and spaces
      if (/^[a-zA-ZÀ-ÿ0-9\s&.,'-]{2,60}$/.test(val) && !looksLikeDomain(val) && !looksLikeSalesforceId(val)) {
        scores[h].name++
      }
    }
  }

  // Pick the best column for each role
  let domainCol: string | null = null
  let sfdcCol: string | null = null
  let nameCol: string | null = null

  let maxDomain = 0, maxSfdc = 0, maxName = 0
  for (const h of headers) {
    if (scores[h].domain > maxDomain) { maxDomain = scores[h].domain; domainCol = h }
    if (scores[h].sfdc > maxSfdc) { maxSfdc = scores[h].sfdc; sfdcCol = h }
    if (scores[h].name > maxName) { maxName = scores[h].name; nameCol = h }
  }

  // Require at least 50% of sample rows to match
  const threshold = Math.max(1, Math.floor(sample.length * 0.4))
  if (maxDomain < threshold) domainCol = null
  if (maxSfdc < threshold) sfdcCol = null

  // De-duplicate
  if (nameCol === domainCol) nameCol = null
  if (nameCol === sfdcCol) nameCol = null
  if (domainCol === sfdcCol) sfdcCol = null

  return { nameCol, domainCol, sfdcCol }
}

export function detectColumns(
  headers: string[],
  data?: Record<string, string>[]
): {
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

  // Keep only positive-score columns
  if (bestNameScore < 0) nameCol = null
  if (bestDomainScore < 0) domainCol = null
  if (bestSfdcScore < 0) sfdcCol = null

  // De-duplicate
  if (nameCol && domainCol && nameCol === domainCol) domainCol = null
  if (nameCol && sfdcCol && nameCol === sfdcCol) sfdcCol = null
  if (domainCol && sfdcCol && domainCol === sfdcCol) sfdcCol = null

  // Fallback: if domain still not found, try content-based detection
  if (!domainCol && data && data.length > 0) {
    const contentBased = detectColumnsByContent(data, headers)
    if (!domainCol) domainCol = contentBased.domainCol
    if (!nameCol) nameCol = contentBased.nameCol
    if (!sfdcCol) sfdcCol = contentBased.sfdcCol
  }

  return { nameCol, domainCol, sfdcCol, allCols: headers }
}

export function parseRows(
  data: Record<string, string>[],
  nameCol: string | null,
  domainCol: string | null,
  sfdcCol: string | null
): ParsedRow[] {
  return data
    .map(row => {
      const name = nameCol ? (row[nameCol] || '').trim() || undefined : undefined
      const domain = domainCol ? cleanDomain(row[domainCol] || '') : ''
      const salesforceId = sfdcCol ? (row[sfdcCol] || '').trim() || undefined : undefined
      return { name, domain, salesforceId }
    })
    .filter(r => r.domain.length > 0)
}
