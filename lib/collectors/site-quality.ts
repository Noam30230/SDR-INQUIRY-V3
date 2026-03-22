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

    // Company name extraction
    const ogSiteName = $('meta[property="og:site_name"]').attr('content')?.trim()
    if (ogSiteName && ogSiteName.length < 60) {
      result.detectedName = ogSiteName
    } else {
      const titleRaw = $('title').text()?.trim()
      if (titleRaw) {
        const firstPart = titleRaw.split(/\s*[|·—\-–]\s*/)[0].trim()
        if (firstPart && firstPart.length > 0 && firstPart.length < 60) {
          result.detectedName = firstPart
        }
      }
    }

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

    // Détection cloud depuis les URLs/scripts embarqués dans le HTML (très fiable)
    if (!result.hosting) {
      const CLOUD_URL_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
        { pattern: /blob\.core\.windows\.net|azurewebsites\.net|azurefd\.net|azure-api\.net|\.azure\b/i, name: 'Azure' },
        { pattern: /\.amazonaws\.com|cloudfront\.net|s3-website|elasticbeanstalk\.com/i, name: 'AWS' },
        { pattern: /googleapis\.com|appspot\.com|\.run\.app|\.cloudfunctions\.net/i, name: 'GCP' },
        { pattern: /\.digitalocean\.com/i, name: 'DigitalOcean' },
        { pattern: /\.ovh\.net|\.ovhcloud\.com/i, name: 'OVH' },
        { pattern: /\.scaleway\.com/i, name: 'Scaleway' },
        { pattern: /\.hetzner\.com|hetzner\.cloud/i, name: 'Hetzner' },
      ]
      for (const { pattern, name } of CLOUD_URL_PATTERNS) {
        if (pattern.test(html)) { result.hosting = name; break }
      }
    }

  } catch {
    // site inaccessible
  }

  // Fetch mentions-légales pour récupérer l'hébergeur (obligatoire en France)
  if (!result.hosting && result.loadable) {
    const legalPaths = ['/mentions-legales', '/mentions-légales', '/legal-notice', '/legal', '/en/legal']
    for (const path of legalPaths) {
      try {
        const legalRes = await fetch(`${base}${path}`, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AccountScorer/1.0)' },
          signal: AbortSignal.timeout(2000),
        })
        if (legalRes.ok) {
          const legalText = await legalRes.text()
          for (const { pattern, name } of HOSTING_PATTERNS) {
            if (pattern.test(legalText)) { result.hosting = name; break }
          }
          if (result.hosting) break
          // Also check cloud URL patterns in legal text
          const CLOUD_URL_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
            { pattern: /blob\.core\.windows\.net|azurewebsites\.net|azure/i, name: 'Azure' },
            { pattern: /amazonaws\.com|cloudfront\.net/i, name: 'AWS' },
            { pattern: /googleapis\.com|google cloud/i, name: 'GCP' },
          ]
          for (const { pattern, name } of CLOUD_URL_PATTERNS) {
            if (pattern.test(legalText)) { result.hosting = name; break }
          }
          if (result.hosting) break
        }
      } catch { /* ignore */ }
    }
  }

  return result
}
