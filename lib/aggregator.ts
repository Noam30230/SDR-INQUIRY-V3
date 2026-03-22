import type { AggregatedData, TechStack } from '@/types'
import type { WappalyzerData } from '@/types'

// Mapping tech name → catégorie
const TECH_CATEGORIES: Record<string, keyof TechStack> = {
  // Cloud
  AWS: 'Cloud', 'Amazon Web Services': 'Cloud', 'AWS CloudFront': 'Cloud',
  GCP: 'Cloud', 'Google Cloud': 'Cloud',
  Azure: 'Cloud', 'Microsoft Azure': 'Cloud',
  Vercel: 'Cloud', Netlify: 'Cloud', Heroku: 'Cloud', DigitalOcean: 'Cloud',
  Cloudflare: 'Cloud', OVH: 'Cloud', Scaleway: 'Cloud', Hetzner: 'Cloud',
  Fastly: 'Cloud', Fly: 'Cloud',
  // Monitoring
  Datadog: 'Monitoring', 'New Relic': 'Monitoring', Dynatrace: 'Monitoring',
  Prometheus: 'Monitoring', Grafana: 'Monitoring', Sentry: 'Monitoring',
  'Elastic APM': 'Monitoring', PagerDuty: 'Monitoring', OpsGenie: 'Monitoring',
  OpenTelemetry: 'Monitoring', ELK: 'Monitoring', Elasticsearch: 'Monitoring',
  Splunk: 'Monitoring', Logstash: 'Monitoring', Kibana: 'Monitoring',
  CloudWatch: 'Monitoring', Jaeger: 'Monitoring',
  // DevOps
  Kubernetes: 'DevOps', Docker: 'DevOps', Terraform: 'DevOps', Ansible: 'DevOps',
  Jenkins: 'DevOps', 'GitHub Actions': 'DevOps', CircleCI: 'DevOps', GitLab: 'DevOps',
  ArgoCD: 'DevOps', Helm: 'DevOps', Pulumi: 'DevOps',
  // Data
  Snowflake: 'Data', Databricks: 'Data', Airflow: 'Data', dbt: 'Data',
  Kafka: 'Data', Spark: 'Data', BigQuery: 'Data', Redshift: 'Data',
  PostgreSQL: 'Data', MySQL: 'Data', MongoDB: 'Data', Redis: 'Data',
  ClickHouse: 'Data', Fivetran: 'Data',
  // AI
  OpenAI: 'AI', 'Hugging Face': 'AI', LangChain: 'AI', TensorFlow: 'AI',
  PyTorch: 'AI', 'Google AI': 'AI', Anthropic: 'AI', Cohere: 'AI',
  // Languages
  Python: 'Languages', Go: 'Languages', TypeScript: 'Languages', JavaScript: 'Languages',
  Rust: 'Languages', Java: 'Languages', Scala: 'Languages', Ruby: 'Languages',
  PHP: 'Languages', 'C#': 'Languages', 'C++': 'Languages', Swift: 'Languages',
  Kotlin: 'Languages', Elixir: 'Languages',
  // Security
  'Cloudflare WAF': 'Security', Snyk: 'Security', CrowdStrike: 'Security',
  'AWS WAF': 'Security', Auth0: 'Security', Okta: 'Security',
}

function categorizeTech(name: string): keyof TechStack {
  return TECH_CATEGORIES[name] || 'Other'
}

function buildTechStack(wappalyzer?: WappalyzerData, githubLanguages?: string[], extraTechs?: string[]): TechStack {
  const stack: TechStack = {
    Cloud: [], Monitoring: [], DevOps: [], Languages: [], Data: [], AI: [], Security: [], Other: [],
  }

  // Depuis Wappalyzer
  if (wappalyzer?.technologies) {
    for (const tech of wappalyzer.technologies) {
      if (tech.confidence < 50) continue
      const cat = categorizeTech(tech.name)
      if (!stack[cat].includes(tech.name)) {
        stack[cat].push(tech.name)
      }
    }
  }

  // Langages depuis GitHub
  if (githubLanguages) {
    for (const lang of githubLanguages) {
      if (!stack.Languages.includes(lang)) {
        stack.Languages.push(lang)
      }
    }
  }

  // Techs supplémentaires détectées par le scraper / Brave
  if (extraTechs) {
    for (const tech of extraTechs) {
      const cat = categorizeTech(tech)
      if (!stack[cat].includes(tech)) stack[cat].push(tech)
    }
  }

  return stack
}

// Détecte le domaine d'une entreprise depuis les données collectées
export function resolveDomain(companyName: string, braveResults?: string[]): string {
  if (!braveResults) return ''
  // Cherche des URLs dans les résultats
  const domainPattern = /(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9-]+\.[a-zA-Z]{2,})/
  for (const result of braveResults) {
    const match = result.match(domainPattern)
    if (match) return match[1]
  }
  return ''
}

export function aggregate(data: AggregatedData): {
  techStack: TechStack
  extraTechs: string[]
} {
  const extraTechs: string[] = []

  // Hébergeur depuis les mentions légales
  if (data.siteQuality?.hosting) extraTechs.push(data.siteQuality.hosting)

  // Signaux cloud depuis Brave
  if (data.brave?.cloudSignals) {
    const cloudMap: Record<string, string> = {
      aws: 'AWS', gcp: 'GCP', azure: 'Azure', kubernetes: 'Kubernetes',
      docker: 'Docker', terraform: 'Terraform', snowflake: 'Snowflake',
      databricks: 'Databricks', kafka: 'Kafka', spark: 'Spark',
      airflow: 'Airflow', dbt: 'dbt', redshift: 'Redshift', bigquery: 'BigQuery',
    }
    for (const signal of data.brave.cloudSignals) {
      const tech = cloudMap[signal.toLowerCase()]
      if (tech && !extraTechs.includes(tech)) extraTechs.push(tech)
    }
  }

  // Signaux monitoring depuis Brave
  if (data.brave?.monitoringSignals) {
    const monitoringMap: Record<string, string> = {
      datadog: 'Datadog', grafana: 'Grafana', prometheus: 'Prometheus',
      elk: 'ELK', elasticsearch: 'Elasticsearch', splunk: 'Splunk',
      'new relic': 'New Relic', pagerduty: 'PagerDuty', opsgenie: 'OpsGenie',
      dynatrace: 'Dynatrace', cloudwatch: 'CloudWatch', opentelemetry: 'OpenTelemetry',
      jaeger: 'Jaeger', sentry: 'Sentry', logstash: 'Logstash', kibana: 'Kibana',
    }
    for (const signal of data.brave.monitoringSignals) {
      const tech = monitoringMap[signal.toLowerCase()]
      if (tech && !extraTechs.includes(tech)) extraTechs.push(tech)
    }
  }

  const techStack = buildTechStack(
    data.wappalyzer,
    data.github?.languages,
    extraTechs
  )

  return { techStack, extraTechs }
}
