import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
import { supabaseAdmin } from '@/lib/supabase-admin'

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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const supabaseUser = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )
  const { data: { user } } = await supabaseUser.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  try {
    const accounts = await fetchAllAccounts(user.id)
    const total = accounts.length

    const tiers: Record<string, number> = { T1: 0, T2: 0, T3: 0, DQ: 0 }
    accounts.forEach(a => { if (a.tier) tiers[a.tier as string] = (tiers[a.tier as string] || 0) + 1 })

    const scored = accounts.filter(a => typeof a.score === 'number')
    const avgScore = scored.length
      ? Math.round(scored.reduce((s, a) => s + (a.score as number), 0) / scored.length)
      : 0

    const dqRate = total ? Math.round((tiers.DQ / total) * 100) : 0

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

    const fundingCount: Record<string, number> = {}
    accounts.forEach(a => {
      const f = (a.raw_data as Record<string, unknown>)?.funding as string
      if (f && f !== 'unknown' && f !== 'bootstrapped') {
        const stage = f.includes('·') ? f.split('·')[0].trim() : f
        fundingCount[stage] = (fundingCount[stage] || 0) + 1
      }
    })
    const FUNDING_ORDER = [
      'pre-seed', 'pre seed', 'preseed',
      'seed',
      'series a', 'serie a',
      'series b', 'serie b',
      'series c', 'series c+', 'serie c',
      'series d', 'serie d',
      'series e', 'serie e',
      'series f', 'serie f',
      'series g', 'series h',
      'growth', 'late stage', 'ipo', 'public',
    ]
    const fundingRank = (name: string): number => {
      const n = name.toLowerCase()
      const idx = FUNDING_ORDER.findIndex(s => n.includes(s) || s.includes(n))
      return idx === -1 ? 999 : idx
    }
    const fundingData = Object.entries(fundingCount)
      .sort((a, b) => fundingRank(a[0]) - fundingRank(b[0]))
      .map(([name, count]) => ({ name, count }))

    return res.status(200).json({
      total,
      tiers,
      avgScore,
      dqRate,
      topTechs,
      activityData,
      fundingData,
    })
  } catch (err) {
    console.error('Stats error:', err)
    return res.status(500).json({ error: 'Failed to fetch stats' })
  }
}
