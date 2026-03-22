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
]

export async function collectSiteQuality(domain: string): Promise<SiteQualityData> {
  const base = domain.startsWith('http') ? domain : `https://${domain}`
  const result: SiteQualityData = {
    isResponsive: false,
    hasHttps: base.startsWith('https://'),
    hasCareers: false,
    hasBlog: false,
    framework: '',
    isPageBuilder: false,
    pageBuilderName: '',
    hosting: '',
    techJobsFound: [],
    loadable: false,
  }

  try {
    const res = await fetch(base, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AccountScorer/1.0)' },
      signal: AbortSignal.timeout(4000),
    })
    if (!res.ok) return result

    // Hosting depuis les headers HTTP (pas besoin de fetcher mentions-légales)
    const server = res.headers.get('server') || ''
    const powered = res.headers.get('x-powered-by') || ''
    const headerStr = [
      server, powered,
      res.headers.get('cf-ray') ? 'cloudflare' : '',
      res.headers.get('x-vercel-id') ? 'vercel' : '',
      res.headers.get('x-amz-cf-id') ? 'aws' : '',
      res.headers.get('x-nf-request-id') ? 'netlify' : '',
    ].join(' ')

    for (const { pattern, name } of HOSTING_PATTERNS) {
      if (pattern.test(headerStr)) { result.hosting = name; break }
    }

    const html = await res.text()
    result.loadable = true
    const $ = cheerio.load(html)
    const allText = html.toLowerCase()

    // Responsive
    result.isResponsive = !!$('meta[name="viewport"]').length

    // Page builder
    for (const builder of PAGE_BUILDERS) {
      if (allText.includes(builder)) {
        result.isPageBuilder = true
        result.pageBuilderName = PAGE_BUILDER_NAMES[builder] || builder
        break
      }
    }

    // Framework
    if (allText.includes('__next') || allText.includes('_next/static')) result.framework = 'Next.js'
    else if (allText.includes('nuxt') || allText.includes('__nuxt')) result.framework = 'Nuxt'
    else if (allText.includes('gatsby')) result.framework = 'Gatsby'
    else if (allText.includes('react')) result.framework = 'React'
    else if (allText.includes('vue')) result.framework = 'Vue'
    else if (allText.includes('angular')) result.framework = 'Angular'
    else if (allText.includes('svelte')) result.framework = 'Svelte'

    // Blog / changelog — depuis les liens de la page principale
    const links = $('a[href]').map((_, el) => $(el).attr('href') || '').get()
    result.hasBlog = links.some(href => /\/blog|\/changelog|\/updates|\/news/i.test(href))

    // Careers — depuis les liens de la page principale (sans fetcher la page)
    result.hasCareers = links.some(href => /\/careers|\/jobs|\/recrutement|\/rejoindre|\/offres|hiring/i.test(href))

  } catch {
    // site inaccessible
  }

  return result
}
