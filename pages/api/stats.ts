import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'

// Fetch all pages from Supabase (default limit is 1000)
async function fetchAllAccounts(userId: string) {
  const PAGE = 1000
  let from = 0
  const all: Record<string, unknown>[] = []
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('status', 'done')
      .eq('user_id', userId)
      .range(from, from + PAGE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

// Fetch all accounts for top users widget (admin, no user filter)
async function fetchAllAccountsAdmin() {
  const PAGE = 1000
  let from = 0
  const all: Record<string, unknown>[] = []
  while (true) {
    const { data, error } = await supabaseAdmin
      .from('accounts')
      .select('user_id')
      .eq('status', 'done')
      .range(from, from + PAGE - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    all.push(...data)
    if (data.length < PAGE) break
    from += PAGE
  }
  return all
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  // Authenticate user from token
  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const { data: { user } } = await supabaseUser.auth.getUser()
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  try {
    // Personal accounts only
    const accounts = await fetchAllAccounts(user.id)
    const total = accounts.length

    // T1/T2/T3/DQ counts
    const tiers: Record<string, number> = { T1: 0, T2: 0, T3: 0, DQ: 0 }
    accounts.forEach(a => { if (a.tier) tiers[a.tier as string] = (tiers[a.tier as string] || 0) + 1 })

    // Average score
    const scored = accounts.filter(a => typeof a.score === 'number')
    const avgScore = scored.length
      ? Math.round(scored.reduce((s, a) => s + (a.score as number), 0) / scored.length)
      : 0

    // DQ rate
    const dqRate = total ? Math.round((tiers.DQ / total) * 100) : 0

    // Top cloud providers only (Cloud category of tech_stack)
    const cloudCount: Record<string, number> = {}
    accounts.forEach(a => {
      if (a.tech_stack && typeof a.tech_stack === 'object') {
        const stack = a.tech_stack as Record<string, string[]>
        const cloudTechs = stack.Cloud || []
        cloudTechs.forEach((tech: string) => {
          if (tech) cloudCount[tech] = (cloudCount[tech] || 0) + 1
        })
      }
    })
    const topTechs = Object.entries(cloudCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8)
      .map(([name, count]) => ({ name, count }))

    // Activity last 14 days
    const activity: Record<string, number> = {}
    for (let i = 13; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      activity[d.toISOString().split('T')[0]] = 0
    }
    accounts.forEach(a => {
      if (a.created_at) {
        const day = (a.created_at as string).split('T')[0]
        if (day in activity) activity[day]++
      }
    })
    const activityData = Object.entries(activity).map(([date, count]) => ({
      date: date.slice(5).replace('-', '/'),
      count,
    }))

    // Top users — all team (admin query, no user filter)
    const allAccounts = await fetchAllAccountsAdmin()
    const userCount: Record<string, number> = {}
    allAccounts.forEach(a => {
      if (a.user_id) userCount[a.user_id as string] = (userCount[a.user_id as string] || 0) + 1
    })

    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
    const emailMap: Record<string, string> = {}
    usersData?.users?.forEach(u => { if (u.id && u.email) emailMap[u.id] = u.email })

    const getFirstName = (email: string): string => {
      const local = email.split('@')[0]
      const first = local.split('.')[0]
      return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
    }

    const maxCount = Math.max(...Object.values(userCount), 1)
    const topUsers = Object.entries(userCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, count]) => ({
        name: getFirstName(emailMap[userId] || userId),
        count,
        pct: Math.round((count / maxCount) * 100),
      }))

    // Funding breakdown
    const fundingCount: Record<string, number> = {}
    accounts.forEach(a => {
      const f = (a.raw_data as Record<string, unknown>)?.funding as string
      if (f && f !== 'unknown' && f !== 'bootstrapped') {
        fundingCount[f] = (fundingCount[f] || 0) + 1
      }
    })
    const fundingData = Object.entries(fundingCount)
      .sort((a, b) => b[1] - a[1])
      .map(([name, count]) => ({ name, count }))

    return res.status(200).json({
      total,
      tiers,
      avgScore,
      dqRate,
      topTechs,
      activityData,
      topUsers,
      fundingData,
    })
  } catch (err) {
    console.error('Stats error:', err)
    return res.status(500).json({ error: 'Failed to fetch stats' })
  }
}
