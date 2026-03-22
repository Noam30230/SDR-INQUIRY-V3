import type { WappalyzerData } from '@/types'

// Catégories Wappalyzer qu'on veut remonter
const RELEVANT_CATEGORIES = [
  'Cloud platforms',
  'CDN',
  'Hosting panels',
  'Web servers',
  'PaaS',
  'Database managers',
  'Programming languages',
  'JavaScript frameworks',
  'Web frameworks',
  'Static site generators',
  'Analytics',
  'Tag managers',
  'Log management',
  'Application performance monitoring',
  'Containers',
  'Security',
  'Payment processors',
  'Live chat',
  'CMS',
  'E-commerce',
]

export async function collectWappalyzer(domain: string): Promise<WappalyzerData | null> {
  if (!domain) return null

  const url = domain.startsWith('http') ? domain : `https://${domain}`

  try {
    // Import dynamique pour éviter les problèmes de bundle côté client
    const Wappalyzer = (await import('wappalyzer')).default
    const wappalyzer = new Wappalyzer({
      debug: false,
      delay: 500,
      headers: {},
      maxDepth: 1,
      maxUrls: 1,
      maxWait: 5000,
      recursive: false,
      probe: true,
    })

    await wappalyzer.init()
    const site = await wappalyzer.open(url)
    const results = await site.analyze()
    await wappalyzer.destroy()

    const technologies = (results.technologies || [])
      .filter((t: { categories: Array<{ name: string }> }) =>
        t.categories.some(c => RELEVANT_CATEGORIES.includes(c.name))
      )
      .map((t: { name: string; categories: Array<{ name: string }>; confidence: number }) => ({
        name: t.name,
        categories: t.categories.map((c: { name: string }) => c.name),
        confidence: t.confidence || 100,
      }))

    return { technologies }
  } catch {
    // Wappalyzer peut échouer sur des sites avec protections — on continue sans
    return { technologies: [] }
  }
}
