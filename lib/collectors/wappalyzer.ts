import type { WappalyzerData } from '@/types'

const SIGNATURES: Array<{ name: string; categories: string[]; patterns: RegExp[] }> = [
  // JS Frameworks
  { name: 'React', categories: ['JavaScript frameworks'], patterns: [/__REACT_DEVTOOLS|data-reactroot|_reactRootContainer|react\.development|react\.production/i] },
  { name: 'Next.js', categories: ['JavaScript frameworks'], patterns: [/__NEXT_DATA__|"\/_next\/static/i] },
  { name: 'Vue.js', categories: ['JavaScript frameworks'], patterns: [/vue\.min\.js|vue\.js|__vue__|vue@/i] },
  { name: 'Angular', categories: ['JavaScript frameworks'], patterns: [/ng-version|angular\.min\.js|angular\/core/i] },
  { name: 'Nuxt.js', categories: ['JavaScript frameworks'], patterns: [/__NUXT__|nuxt\.js/i] },
  { name: 'Svelte', categories: ['JavaScript frameworks'], patterns: [/svelte/i] },
  { name: 'Gatsby', categories: ['Static site generators'], patterns: [/gatsby-/i] },

  // CMS / Page builders
  { name: 'WordPress', categories: ['CMS'], patterns: [/\/wp-content\/|\/wp-includes\/|wp-json/i] },
  { name: 'Shopify', categories: ['E-commerce'], patterns: [/Shopify\.theme|cdn\.shopify\.com/i] },
  { name: 'Wix', categories: ['CMS'], patterns: [/wix\.com|wixstatic\.com/i] },
  { name: 'Squarespace', categories: ['CMS'], patterns: [/squarespace\.com|squarespace-cdn/i] },
  { name: 'Webflow', categories: ['CMS'], patterns: [/webflow\.com|\.webflow\.io/i] },
  { name: 'Framer', categories: ['CMS'], patterns: [/framer\.com|framerusercontent/i] },

  // Analytics / Tag managers
  { name: 'Google Analytics', categories: ['Analytics'], patterns: [/google-analytics\.com|gtag\(|UA-\d+|G-[A-Z0-9]+/i] },
  { name: 'Segment', categories: ['Analytics'], patterns: [/segment\.com|analytics\.js/i] },
  { name: 'Mixpanel', categories: ['Analytics'], patterns: [/mixpanel/i] },
  { name: 'Amplitude', categories: ['Analytics'], patterns: [/amplitude/i] },

  // Monitoring
  { name: 'Datadog', categories: ['Application performance monitoring'], patterns: [/datadoghq\.com|dd-rum/i] },
  { name: 'Sentry', categories: ['Application performance monitoring'], patterns: [/sentry\.io|@sentry\//i] },

  // Chat / Support
  { name: 'Intercom', categories: ['Live chat'], patterns: [/intercom\.io|intercomSettings/i] },
  { name: 'Zendesk', categories: ['Live chat'], patterns: [/zendesk\.com|zESettings/i] },

  // Payment
  { name: 'Stripe', categories: ['Payment processors'], patterns: [/stripe\.com|Stripe\(/i] },
]

const HEADER_SIGNATURES: Array<{ name: string; categories: string[]; headers: string[]; pattern: RegExp }> = [
  { name: 'Cloudflare', categories: ['CDN'], headers: ['cf-ray', 'cf-cache-status'], pattern: /.*/ },
  { name: 'AWS CloudFront', categories: ['CDN'], headers: ['x-amz-cf-id', 'x-amz-cf-pop'], pattern: /.*/ },
  { name: 'Vercel', categories: ['PaaS'], headers: ['x-vercel-id'], pattern: /.*/ },
  { name: 'Netlify', categories: ['PaaS'], headers: ['x-nf-request-id'], pattern: /.*/ },
  { name: 'Fastly', categories: ['CDN'], headers: ['x-fastly-request-id', 'fastly-restarts'], pattern: /.*/ },
  { name: 'Nginx', categories: ['Web servers'], headers: ['server'], pattern: /nginx/i },
  { name: 'Apache', categories: ['Web servers'], headers: ['server'], pattern: /apache/i },
]

export async function collectWappalyzer(domain: string): Promise<WappalyzerData | null> {
  if (!domain) return null

  const url = domain.startsWith('http') ? domain : `https://${domain}`

  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; TechScanner/1.0)' },
      signal: AbortSignal.timeout(5000),
    })

    const html = await res.text()
    const responseHeaders = Object.fromEntries(res.headers.entries())

    const found: Array<{ name: string; categories: string[]; confidence: number }> = []
    const seen = new Set<string>()

    // Detect from HTML body
    for (const sig of SIGNATURES) {
      if (sig.patterns.some(p => p.test(html))) {
        if (!seen.has(sig.name)) {
          found.push({ name: sig.name, categories: sig.categories, confidence: 90 })
          seen.add(sig.name)
        }
      }
    }

    // Detect from response headers
    for (const sig of HEADER_SIGNATURES) {
      const matched = sig.headers.some(h => {
        const val = responseHeaders[h] || ''
        return val && sig.pattern.test(val)
      })
      if (matched && !seen.has(sig.name)) {
        found.push({ name: sig.name, categories: sig.categories, confidence: 95 })
        seen.add(sig.name)
      }
    }

    return { technologies: found }
  } catch {
    return { technologies: [] }
  }
}
