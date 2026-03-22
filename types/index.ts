export type Tier = 'T1' | 'T2' | 'T3' | 'DQ'
export type AccountStatus = 'pending' | 'scoring' | 'done' | 'error'

export interface TechStack {
  Cloud: string[]
  Monitoring: string[]
  DevOps: string[]
  Languages: string[]
  Data: string[]
  AI: string[]
  Security: string[]
  Other: string[]
}

export interface Signals {
  positive: string[]
  negative: string[]
}

export interface WebQuality {
  score: number
  hosting: string
  isResponsive: boolean
  hasHttps: boolean
  hasCareers: boolean
  hasBlog: boolean
  framework: string
  isPageBuilder: boolean
  pageBuilderName: string
  techJobsCount: number
  // SaaS qualification signals
  hasPricing: boolean
  hasSignup: boolean
  hasDemo: boolean
  hasDocs: boolean
  hasLogin: boolean
  hasApi: boolean
  hasIntegrations: boolean
  saasKeywords: string[]
  consultingKeywords: string[]
}

export interface PressArticle {
  title: string
  url: string
  date: string
  source: string
}

export interface PressSignals {
  articles: PressArticle[]
}

export interface Account {
  id: string
  user_id: string
  company_name: string
  domain: string | null
  country: string | null
  salesforce_id: string | null
  tier: Tier | null
  score: number | null
  signals: Signals
  tech_stack: TechStack
  web_quality: WebQuality | null
  press_signals: PressSignals
  reasoning: string | null
  raw_data: Record<string, unknown>
  status: AccountStatus
  error_message: string | null
  created_at: string
  updated_at: string
}

// Résultat de chaque collecteur
export interface CollectorResult {
  source: string
  success: boolean
  data?: Record<string, unknown>
  error?: string
}

// Payload du collecteur Pappers (France)
export interface PappersData {
  siren: string
  nom: string
  effectif: string | null
  chiffre_affaires: number | null
  naf: string
  nafLabel: string
  formeJuridique: string
  dateCreation: string
  dirigeants: string[]
  isDQCandidate: boolean
}

// Payload du collecteur GitHub
export interface GitHubData {
  orgFound: boolean
  orgName: string
  repoCount: number
  languages: string[]
  techSignals: string[]  // tools detected from repo names/topics/descriptions
  recentActivity: boolean
  stars: number
}

// Payload du collecteur Wappalyzer
export interface WappalyzerData {
  technologies: Array<{
    name: string
    categories: string[]
    confidence: number
  }>
}

// Payload du collecteur site quality
export interface SiteQualityData {
  isResponsive: boolean
  hasHttps: boolean
  hasCareers: boolean
  hasBlog: boolean
  framework: string
  isPageBuilder: boolean
  pageBuilderName: string
  hosting: string
  techJobsFound: string[]
  loadable: boolean
  detectedName?: string
  // SaaS qualification signals
  hasPricing: boolean
  hasSignup: boolean
  hasDemo: boolean
  hasDocs: boolean
  hasLogin: boolean
  hasApi: boolean
  hasIntegrations: boolean
  saasKeywords: string[]     // positive SaaS keywords found in page copy
  consultingKeywords: string[] // ESN/consulting signals found
}

// Payload Brave Search
export interface BraveSearchData {
  isTechHiring: boolean   // is the company actively hiring tech roles?
  techJobRoles: string[]  // which roles (devops, sre, backend...)
  newsHeadlines: string[]
  fundingSignals: string[]
}

// Payload NewsAPI
export interface NewsData {
  articles: PressArticle[]
}

// Données agrégées passées au scorer
export interface AggregatedData {
  companyName: string
  domain: string
  pappers?: PappersData
  github?: GitHubData
  wappalyzer?: WappalyzerData
  siteQuality?: SiteQualityData
  brave?: BraveSearchData
  news?: NewsData
}

// Réponse du scorer GPT-4o
export interface ScorerOutput {
  tier: Tier
  score: number
  tech_stack: TechStack
  signals: Signals
  reasoning: string
}
