import * as cheerio from 'cheerio'
import type { SiteQualityData } from '@/types'

const PAGE_BUILDERS = ['wix.com', 'squarespace.com', 'jimdo.com', 'webflow.io', 'godaddy.com', 'site123.com']
const PAGE_BUILDER_NAMES: Record<string, string> = {
  'wix.com': 'Wix', 'squarespace.com': 'Squarespace', 'jimdo.com': 'Jimdo',
  'webflow.io': 'Webflow', 'godaddy.com': 'GoDaddy', 'site123.com': 'Site123',
}

// Patterns pour headers HTTP (Vercel, Netlify, Cloudflare exposent leurs propres headers)
const HEADER_HOSTING_PATTERNS: Array<{ pattern: RegExp; name: string }> = [
  { pattern: /vercel/i, name: 'Vercel' },
  { pattern: /netlify/i, name: 'Netlify' },
  { pattern: /cloudflare/i, name: 'Cloudflare' },
  { pattern: /awselb|aws|amazon/i, name: 'AWS' },
  { pattern: /microsoft|azure/i, name: 'Azure' },
  // Only match actual GCP server headers, not generic "google" (would match Google Analytics)
  { pattern: /google frontend|gws|gfe|google cloud/i, name: 'GCP' },
  { pattern: /ovh/i, name: 'OVH' },
]

// Mapping ASN org → cloud provider (lookup ip-api.com, gratuit, sans clé)
function orgToProvider(org: string): string {
  const o = org.toLowerCase()
  if (o.includes('microsoft')) return 'Azure'
  if (o.includes('amazon') || o.includes('aws')) return 'AWS'
  if (o.includes('google')) return 'GCP'
  if (o.includes('cloudflare')) return 'Cloudflare'
  if (o.includes('ovh')) return 'OVH'
  if (o.includes('hetzner')) return 'Hetzner'
  if (o.includes('digitalocean')) return 'DigitalOcean'
  if (o.includes('scaleway')) return 'Scaleway'
  if (o.includes('fastly')) return 'Fastly'
  if (o.includes('akamai')) return 'Akamai'
  if (o.includes('netlify')) return 'Netlify'
  if (o.includes('vercel')) return 'Vercel'
  return ''
}

// Résolution DNS → IP via Google DoH, puis lookup ASN via ip-api.com
async function detectHostingByDNS(domain: string): Promise<string> {
  try {
    const cleanDomain = domain.replace(/^https?:\/\//, '').replace(/\/.*$/, '')
    const dnsRes = await fetch(
      `https://dns.google/resolve?name=${cleanDomain}&type=A`,
      { signal: AbortSignal.timeout(3000) }
    )
    if (!dnsRes.ok) return ''
    const dnsData = await dnsRes.json()
    const ip: string = dnsData.Answer?.find((r: { type: number }) => r.type === 1)?.data
    if (!ip) return ''

    const ipRes = await fetch(
      `http://ip-api.com/json/${ip}?fields=as,org,isp`,
      { signal: AbortSignal.timeout(2000) }
    )
    if (!ipRes.ok) return ''
    const ipData = await ipRes.json()
    const orgStr = `${ipData.org || ''} ${ipData.isp || ''} ${ipData.as || ''}`
    return orgToProvider(orgStr)
  } catch {
    return ''
  }
}

// Fetch mentions-légales (obligatoire en France, hébergeur toujours mentionné)
async function detectHostingFromLegal(base: string): Promise<string> {
  const legalPaths = ['/mentions-legales', '/mentions-légales', '/legal-notice', '/legal', '/en/legal']
  for (const path of legalPaths) {
    try {
      const res = await fetch(`${base}${path}`, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AccountScorer/1.0)' },
        signal: AbortSignal.timeout(2000),
      })
      if (!res.ok) continue
      const text = (await res.text()).toLowerCase()
      // Cherche des mentions explicites du fournisseur cloud
      if (text.includes('microsoft azure') || text.includes('azure')) return 'Azure'
      if (text.includes('amazon web services') || text.includes('amazonaws')) return 'AWS'
      if (text.includes('google cloud')) return 'GCP'
      if (text.includes('ovhcloud') || text.includes('ovh sas')) return 'OVH'
      if (text.includes('hetzner')) return 'Hetzner'
      if (text.includes('digitalocean')) return 'DigitalOcean'
      if (text.includes('scaleway')) return 'Scaleway'
      if (text.includes('cloudflare')) return 'Cloudflare'
      if (res.ok) break // page trouvée mais provider non identifié, stop
    } catch { /* ignore */ }
  }
  return ''
}

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
    hasPricing: false,
    hasSignup: false,
    hasDemo: false,
    hasDocs: false,
    hasLogin: false,
    hasApi: false,
    hasIntegrations: false,
    saasKeywords: [],
    consultingKeywords: [],
  }

  // Lance le fetch principal + la résolution DNS en parallèle
  const [pageResult, dnsHosting] = await Promise.all([
    (async () => {
      try {
        const res = await fetch(base, {
          headers: { 'User-Agent': 'Mozilla/5.0 (compatible; AccountScorer/1.0)' },
          signal: AbortSignal.timeout(4000),
        })
        if (!res.ok) return null

        // Hosting depuis les headers HTTP
        const headerStr = [
          res.headers.get('server') || '',
          res.headers.get('x-powered-by') || '',
          res.headers.get('cf-ray') ? 'cloudflare' : '',
          res.headers.get('x-vercel-id') ? 'vercel' : '',
          res.headers.get('x-amz-cf-id') ? 'awselb' : '',
          res.headers.get('x-nf-request-id') ? 'netlify' : '',
        ].join(' ')

        let headerHosting = ''
        for (const { pattern, name } of HEADER_HOSTING_PATTERNS) {
          if (pattern.test(headerStr)) { headerHosting = name; break }
        }

        const html = await res.text()
        return { html, headerHosting }
      } catch {
        return null
      }
    })(),
    detectHostingByDNS(domain),
  ])

  if (!pageResult) return result

  const { html, headerHosting } = pageResult
  result.loadable = true

  // Priorité : headers > DNS/ASN
  result.hosting = headerHosting || dnsHosting

  // Si Cloudflare proxy détecté (masque l'origine), essayer les mentions légales
  if (!result.hosting || result.hosting === 'Cloudflare') {
    const legalHosting = await detectHostingFromLegal(base)
    if (legalHosting && legalHosting !== 'Cloudflare') {
      result.hosting = legalHosting
    } else if (!result.hosting) {
      result.hosting = legalHosting
    }
  }

  const $ = cheerio.load(html)
  const allText = html.toLowerCase()

  // Company name
  const ogSiteName = $('meta[property="og:site_name"]').attr('content')?.trim()
  if (ogSiteName && ogSiteName.length < 60) {
    result.detectedName = ogSiteName
  } else {
    const titleRaw = $('title').text()?.trim()
    if (titleRaw) {
      const firstPart = titleRaw.split(/\s*[|·—\-–]\s*/)[0].trim()
      if (firstPart && firstPart.length < 60) result.detectedName = firstPart
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

  // Blog / Careers
  const links = $('a[href]').map((_, el) => $(el).attr('href') || '').get()
  const linkTexts = $('a').map((_, el) => $(el).text().toLowerCase()).get().join(' ')
  const navText = $('nav, header').text().toLowerCase()
  result.hasBlog = links.some(href => /\/blog|\/changelog|\/updates|\/news/i.test(href))
  result.hasCareers = links.some(href => /\/careers|\/jobs|\/recrutement|\/rejoindre|\/offres|hiring/i.test(href))

  // SaaS / product signals from page structure and copy
  result.hasPricing = links.some(href => /\/pricing|\/plans|\/tarif/i.test(href)) ||
    /pricing|plans|tarifs/i.test(navText)
  result.hasSignup = /sign.?up|get.?started|start.?free|essai.?gratuit|s'inscrire|créer.?un.?compte/i.test(linkTexts)
  result.hasDemo = /demo|request.?demo|book.?demo|voir.?une.?démo/i.test(linkTexts)
  result.hasDocs = links.some(href => /\/docs|\/documentation|\/developers|\/api-reference/i.test(href)) ||
    /\bdocs\b|documentation/i.test(navText)
  result.hasLogin = /log.?in|sign.?in|connexion|se.?connecter/i.test(linkTexts)
  result.hasApi = links.some(href => /\/api|\/developers/i.test(href)) || /\bapi\b/i.test(navText)
  result.hasIntegrations = links.some(href => /\/integrations|\/marketplace|\/partners/i.test(href)) ||
    /integrations|marketplace/i.test(navText)

  // SaaS keywords in visible text (strong product signals)
  const bodyText = $('body').text().toLowerCase()
  const SAAS_KEYWORDS = [
    { kw: 'platform', label: 'platform' },
    { kw: 'automate', label: 'automation' },
    { kw: 'dashboard', label: 'dashboard' },
    { kw: 'workflow', label: 'workflow' },
    { kw: 'integration', label: 'integrations' },
    { kw: 'api', label: 'API' },
    { kw: 'saas', label: 'SaaS' },
    { kw: 'free trial', label: 'free trial' },
    { kw: 'essai gratuit', label: 'free trial' },
    { kw: 'scalable', label: 'scalable' },
    { kw: 'real-time', label: 'real-time' },
    { kw: 'time en temps réel', label: 'real-time' },
  ]
  const foundSaas = new Set<string>()
  for (const { kw, label } of SAAS_KEYWORDS) {
    if (bodyText.includes(kw)) foundSaas.add(label)
  }
  result.saasKeywords = Array.from(foundSaas)

  // Consulting / ESN signals — only unambiguous pure-services indicators
  // Excluded: "our services", "nos services", "consulting", "agence", "prestation" — too many false positives
  // (many SaaS companies use these words). Only keep strong ESN/staff-aug signals.
  const CONSULTING_KEYWORDS = [
    { kw: 'régie', label: 'staff augmentation' },
    { kw: 'portage salarial', label: 'staff augmentation' },
    { kw: 'assistance technique', label: 'staff augmentation' },
    { kw: 'mise à disposition', label: 'staff augmentation' },
    { kw: 'forfait et régie', label: 'staff augmentation' },
    { kw: 'cabinet de conseil', label: 'consulting firm' },
    { kw: 'société de conseil', label: 'consulting firm' },
    { kw: 'management consulting', label: 'consulting firm' },
    { kw: 'it staffing', label: 'IT staffing' },
    { kw: 'staff augmentation', label: 'staff augmentation' },
    { kw: 'body shopping', label: 'staff augmentation' },
  ]
  const foundConsulting = new Set<string>()
  for (const { kw, label } of CONSULTING_KEYWORDS) {
    if (bodyText.includes(kw)) foundConsulting.add(label)
  }
  result.consultingKeywords = Array.from(foundConsulting)

  return result
}
