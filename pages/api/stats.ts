import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const { data: accounts, error } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('status', 'done')

    if (error) throw error

    const total = accounts.length

    // T1/T2/T3/DQ counts
    const tiers: Record<string, number> = { T1: 0, T2: 0, T3: 0, DQ: 0 }
    accounts.forEach(a => { if (a.tier) tiers[a.tier] = (tiers[a.tier] || 0) + 1 })

    // Average score
    const scored = accounts.filter(a => typeof a.score === 'number')
    const avgScore = scored.length
      ? Math.round(scored.reduce((s, a) => s + a.score, 0) / scored.length)
      : 0

    // DQ rate
    const dqRate = total ? Math.round((tiers.DQ / total) * 100) : 0

    // Top technos
    const techCount: Record<string, number> = {}
    accounts.forEach(a => {
      if (a.tech_stack && typeof a.tech_stack === 'object') {
        Object.values(a.tech_stack).forEach((arr: unknown) => {
          if (Array.isArray(arr)) {
            arr.forEach((tech: string) => {
              if (tech) techCount[tech] = (techCount[tech] || 0) + 1
            })
          }
        })
      }
    })
    const topTechs = Object.entries(techCount)
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

    // Top users — extract first name from email
    const userCount: Record<string, number> = {}
    accounts.forEach(a => {
      if (a.user_id) userCount[a.user_id] = (userCount[a.user_id] || 0) + 1
    })

    const { data: usersData } = await supabaseAdmin.auth.admin.listUsers()
    const emailMap: Record<string, string> = {}
    usersData?.users?.forEach(u => { if (u.id && u.email) emailMap[u.id] = u.email })

    const getFirstName = (email: string): string => {
      const local = email.split('@')[0]
      const first = local.split('.')[0]
      return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase()
    }

    const topUsers = Object.entries(userCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([userId, count]) => ({
        name: getFirstName(emailMap[userId] || userId),
        count,
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
