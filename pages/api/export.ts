import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Account, TechStack } from '@/types'

function flattenTechStack(stack: TechStack): string {
  return Object.entries(stack)
    .filter(([, v]) => v.length > 0)
    .map(([k, v]) => `${k}: ${v.join(', ')}`)
    .join(' | ')
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Non authentifié' })

  const { tier, ids } = req.query
  let query = supabaseAdmin.from('accounts').select('*').eq('user_id', user.id).eq('status', 'done').order('score', { ascending: false })
  if (ids) {
    const idList = (ids as string).split(',').filter(Boolean)
    query = query.in('id', idList)
  } else if (tier && tier !== 'all') {
    query = query.eq('tier', tier)
  }

  const { data: accounts, error } = await query
  if (error) return res.status(500).json({ error: error.message })

  const rows = (accounts as Account[]).map(a => ({
    'Company': a.company_name,
    'Salesforce ID': a.salesforce_id || '',
    'Domain': a.domain || '',
    'Tier': a.tier || '',
    'Score': a.score ?? '',
    'Tech Stack': flattenTechStack(a.tech_stack),
    'Positive signals': (a.signals?.positive || []).join(' | '),
    'Negative signals': (a.signals?.negative || []).join(' | '),
    'Reasoning': a.reasoning || '',
    'Hosting': (a.web_quality as { hosting?: string })?.hosting || '',
    'Scored at': new Date(a.created_at).toLocaleDateString('en-GB'),
  }))

  const headers = Object.keys(rows[0] || {})
  const csv = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => `"${String(row[h as keyof typeof row] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="inquiry-${new Date().toISOString().split('T')[0]}.csv"`)
  return res.status(200).send('\uFEFF' + csv)
}
