import * as cheerio from 'cheerio'
import type { SiteQualityData } from '@/types'

const PAGE_BUILDERS = ['wix.com', 'squarespace.com', 'jimdo.com', 'webflow.io', 'godaddy.com', 'site123.com']
const PAGE_BUILDER_NAMES: Record<string, string> = {
  'wix.com': 'Wix', 'squarespace.com': 'Squarespace', 'jimdo.com': 'Jimdo',
  'webflow.io': 'Webflow', 'godaddy.com': 'GoDaddy', 'site123.com': 'Site123',
}

const HOSTING_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /amazon|amazonaws|aws/i, name: 'AWS' },
  { pattern: /google|gcp|googlecloud/i, name: 'GCP' },
  { pattern: /microsoft|azure/i, name: 'Azure' },
  { pattern: /vercel/i, name: 'Vercel' },
  { pattern: /netlify/i, name: 'Netlify' },
  { pattern: /ovh/i, name: 'OVH' },
  { pattern: /scaleway/i, name: 'Scaleway' },
  { pattern: /hetzner/i, name: 'Hetzner' },
  { pattern: /digitalocean/i, name: 'DigitalOcean' },
  { pattern: /cloudflare/i, name: 'Cloudflare' },
  { pattern: /infomaniak/i, name: 'Infomaniak' },
  { pattern: /1and1|ionos/i, name: 'IONOS' },
  { pattern: /online\.net|iliad/i, name: 'Online.net' },
]

const TECH_JOB_KEYWORDS = [
  'devops', 'sre', 'site reliability', 'platform engineer', 'cloud engineer',
  'software engineer', 'backend', 'frontend', 'full stack', 'fullstack',
  'data engineer', 'ml engineer', 'security engineer', 'infrastructure',
  'kubernetes', 'terraform', 'aws', 'gcp', 'azure',
]

function detectHostingFromText(text: string): string {
  for (const { pattern, name } of HOSTING_PATTERNS) {
    if (pattern.test(text)) return name
  }
  return ''
}

async function fetchPage(url: string): Promise<string | null> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AccountScorer/1.0)' },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return null
    return await res.text()
  } catch {
    return null
  }
}

export async function collectSiteQuality(domain: string): Promise<SiteQualityData> {
  const base = domain.startsWith('http') ? domain : `https://${domain}`
  const result: SiteQualityData = {
    isResponsive: false,
    hasHttps: false,
    hasCareers: false,
    hasBlog: false,
    framework: '',
    isPageBuilder: false,
    pageBuilderName: '',
    hosting: '',
    techJobsFound: [],
    loadable: false,
  }

  // Check HTTPS
  result.hasHttps = base.startsWith('https://')

  // Fetch page principale
  const html = await fetchPage(base)
  if (!html) return result

  result.loadable = true
  const $ = cheerio.load(html)

  // Responsive
  result.isResponsive = !!$('meta[name="viewport"]').length

  // Page builder detection via scripts/links
  const allText = html.toLowerCase()
  for (const builder of PAGE_BUILDERS) {
    if (allText.includes(builder)) {
      result.isPageBuilder = true
      result.pageBuilderName = PAGE_BUILDER_NAMES[builder] || builder
      break
    }
  }

  // Blog / changelog
  const links = $('a[href]').map((_, el) => $(el).attr('href') || '').get()
  result.hasBlog = links.some(href => /\/blog|\/changelog|\/updates|\/news/i.test(href))

  // Framework detection (simple heuristic)
  if (allText.includes('__next') || allText.includes('_next/static')) result.framework = 'Next.js'
  else if (allText.includes('nuxt') || allText.includes('__nuxt')) result.framework = 'Nuxt'
  else if (allText.includes('gatsby')) result.framework = 'Gatsby'
  else if (allText.includes('react')) result.framework = 'React'
  else if (allText.includes('vue')) result.framework = 'Vue'
  else if (allText.includes('angular')) result.framework = 'Angular'
  else if (allText.includes('svelte')) result.framework = 'Svelte'

  // Page mentions légales → hébergeur
  const mentionsHtml = await fetchPage(`${base}/mentions-legales`)
    || await fetchPage(`${base}/legal-notice`)
    || await fetchPage(`${base}/legal`)
  if (mentionsHtml) {
    const mentionsText = cheerio.load(mentionsHtml).text()
    result.hosting = detectHostingFromText(mentionsText)
  }

  // Page carrières / jobs
  const careersUrls = ['/careers', '/jobs', '/recrutement', '/rejoindre', '/offres', '/we-are-hiring']
  for (const path of careersUrls) {
    const careersHtml = await fetchPage(`${base}${path}`)
    if (careersHtml) {
      result.hasCareers = true
      const careersText = careersHtml.toLowerCase()
      const found = TECH_JOB_KEYWORDS.filter(kw => careersText.includes(kw))
      result.techJobsFound = Array.from(new Set(found)).slice(0, 10)
      break
    }
  }

  return result
}
