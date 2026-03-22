import type { GitHubData } from '@/types'

const BASE = 'https://api.github.com'

// Tools detected from repo names, descriptions, and topics — reliable because
// if a company has a repo called "datadog-exporter", they actually use Datadog
const REPO_TECH_PATTERNS: Array<{ pattern: RegExp; tech: string }> = [
  // Monitoring
  { pattern: /\bdatadog\b/i, tech: 'Datadog' },
  { pattern: /\bprometheus\b/i, tech: 'Prometheus' },
  { pattern: /\bgrafana\b/i, tech: 'Grafana' },
  { pattern: /\belasticsearch|elastic-stack|elk\b/i, tech: 'Elasticsearch' },
  { pattern: /\bsplunk\b/i, tech: 'Splunk' },
  { pattern: /\bnew.?relic\b/i, tech: 'New Relic' },
  { pattern: /\bdynatrace\b/i, tech: 'Dynatrace' },
  { pattern: /\bpagerduty\b/i, tech: 'PagerDuty' },
  { pattern: /\bopentelemetry|otel\b/i, tech: 'OpenTelemetry' },
  { pattern: /\bsentry\b/i, tech: 'Sentry' },
  // DevOps / Infra
  { pattern: /\bterraform\b/i, tech: 'Terraform' },
  { pattern: /\bkubernetes|helm\b/i, tech: 'Kubernetes' },
  { pattern: /\bdocker\b/i, tech: 'Docker' },
  { pattern: /\bargoci?d?\b/i, tech: 'ArgoCD' },
  { pattern: /\bansible\b/i, tech: 'Ansible' },
  // Data
  { pattern: /\bkafka\b/i, tech: 'Kafka' },
  { pattern: /\bsnowflake\b/i, tech: 'Snowflake' },
  { pattern: /\bdatabricks\b/i, tech: 'Databricks' },
  { pattern: /\bairflow\b/i, tech: 'Airflow' },
  { pattern: /\bspark\b/i, tech: 'Spark' },
  { pattern: /\bdbt\b/i, tech: 'dbt' },
  { pattern: /\bredis\b/i, tech: 'Redis' },
  { pattern: /\bmongodb\b/i, tech: 'MongoDB' },
  { pattern: /\bpostgresql|postgres\b/i, tech: 'PostgreSQL' },
  // AI / ML
  { pattern: /\bmlflow\b/i, tech: 'MLflow' },
  { pattern: /\bhuggingface|hugging.face\b/i, tech: 'Hugging Face' },
  { pattern: /\blangchain\b/i, tech: 'LangChain' },
]

export async function collectGitHub(companyName: string, domain?: string): Promise<GitHubData | null> {
  const token = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    const query = domain
      ? domain.replace(/^www\./, '').split('.')[0]
      : companyName.toLowerCase().replace(/\s+/g, '')

    const searchRes = await fetch(
      `${BASE}/search/users?q=${encodeURIComponent(query)}+type:org&per_page=3`,
      { headers, signal: AbortSignal.timeout(2500) }
    )
    if (!searchRes.ok) return null

    const searchData = await searchRes.json()
    const orgs = searchData.items || []
    if (orgs.length === 0) return { orgFound: false, orgName: '', repoCount: 0, languages: [], techSignals: [], recentActivity: false, stars: 0 }

    const orgLogin = orgs[0].login

    const reposRes = await fetch(
      `${BASE}/orgs/${orgLogin}/repos?per_page=50&sort=updated&type=public`,
      { headers, signal: AbortSignal.timeout(2500) }
    )
    if (!reposRes.ok) return { orgFound: true, orgName: orgLogin, repoCount: 0, languages: [], techSignals: [], recentActivity: false, stars: 0 }

    const repos = await reposRes.json()
    if (!Array.isArray(repos)) return null

    const languageSet = new Set<string>()
    const techSet = new Set<string>()
    let totalStars = 0
    let recentActivity = false
    const sixMonthsAgo = Date.now() - 1000 * 60 * 60 * 24 * 180

    for (const repo of repos) {
      // Languages from primary language field
      if (repo.language) languageSet.add(repo.language)

      // Stars + activity
      totalStars += repo.stargazers_count || 0
      if (new Date(repo.updated_at).getTime() > sixMonthsAgo) recentActivity = true

      // Detect tech tools from repo name + description + topics
      const searchText = [
        repo.name || '',
        repo.description || '',
        ...(Array.isArray(repo.topics) ? repo.topics : []),
      ].join(' ')

      for (const { pattern, tech } of REPO_TECH_PATTERNS) {
        if (pattern.test(searchText)) techSet.add(tech)
      }
    }

    return {
      orgFound: true,
      orgName: orgLogin,
      repoCount: repos.length,
      languages: Array.from(languageSet).slice(0, 15),
      techSignals: Array.from(techSet),
      recentActivity,
      stars: totalStars,
    }
  } catch {
    return null
  }
}
