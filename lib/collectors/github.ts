import type { GitHubData } from '@/types'

const BASE = 'https://api.github.com'

export async function collectGitHub(companyName: string, domain?: string): Promise<GitHubData | null> {
  const token = process.env.GITHUB_TOKEN
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  try {
    // Recherche d'une organisation correspondante
    const query = domain
      ? domain.replace(/^www\./, '').split('.')[0]
      : companyName.toLowerCase().replace(/\s+/g, '')

    const searchRes = await fetch(
      `${BASE}/search/users?q=${encodeURIComponent(query)}+type:org&per_page=3`,
      { headers, signal: AbortSignal.timeout(4000) }
    )
    if (!searchRes.ok) return null

    const searchData = await searchRes.json()
    const orgs = searchData.items || []
    if (orgs.length === 0) return { orgFound: false, orgName: '', repoCount: 0, languages: [], recentActivity: false, stars: 0 }

    const org = orgs[0]
    const orgLogin = org.login

    // Repos publics
    const reposRes = await fetch(
      `${BASE}/orgs/${orgLogin}/repos?per_page=30&sort=updated&type=public`,
      { headers, signal: AbortSignal.timeout(4000) }
    )
    if (!reposRes.ok) return { orgFound: true, orgName: orgLogin, repoCount: 0, languages: [], recentActivity: false, stars: 0 }

    const repos = await reposRes.json()
    if (!Array.isArray(repos)) return null

    // Langages des 10 repos les plus récents
    const languageSet = new Set<string>()
    let totalStars = 0
    let recentActivity = false
    const sixMonthsAgo = Date.now() - 1000 * 60 * 60 * 24 * 180

    for (const repo of repos.slice(0, 10)) {
      if (repo.language) languageSet.add(repo.language)
      totalStars += repo.stargazers_count || 0
      if (new Date(repo.updated_at).getTime() > sixMonthsAgo) recentActivity = true
    }

    // Langages supplémentaires via l'API languages des 5 premiers repos
    const topRepos = repos.slice(0, 5)
    await Promise.allSettled(
      topRepos.map(async (repo: { full_name: string }) => {
        const langRes = await fetch(`${BASE}/repos/${repo.full_name}/languages`, {
          headers, signal: AbortSignal.timeout(4000),
        })
        if (langRes.ok) {
          const langs = await langRes.json()
          Object.keys(langs).forEach(l => languageSet.add(l))
        }
      })
    )

    return {
      orgFound: true,
      orgName: orgLogin,
      repoCount: repos.length,
      languages: Array.from(languageSet).slice(0, 15),
      recentActivity,
      stars: totalStars,
    }
  } catch {
    return null
  }
}
