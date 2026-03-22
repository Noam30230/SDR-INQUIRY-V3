import type { NextApiRequest, NextApiResponse } from 'next'
import { createClient } from '@supabase/supabase-js'
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

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  )

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return res.status(401).json({ error: 'Non authentifié' })

  const { tier } = req.query
  let query = supabase.from('accounts').select('*').eq('status', 'done').order('score', { ascending: false })
  if (tier && tier !== 'all') query = query.eq('tier', tier)

  const { data: accounts, error } = await query
  if (error) return res.status(500).json({ error: error.message })

  const rows = (accounts as Account[]).map(a => ({
    'Entreprise': a.company_name,
    'Domaine': a.domain || '',
    'Tier': a.tier || '',
    'Score': a.score ?? '',
    'Stack tech': flattenTechStack(a.tech_stack),
    'Signaux positifs': (a.signals?.positive || []).join(' | '),
    'Signaux négatifs': (a.signals?.negative || []).join(' | '),
    'Raisonnement': a.reasoning || '',
    'Hébergeur': (a.web_quality as { hosting?: string })?.hosting || '',
    'Date scoring': new Date(a.created_at).toLocaleDateString('fr-FR'),
  }))

  const headers = Object.keys(rows[0] || {})
  const csv = [
    headers.join(','),
    ...rows.map(row =>
      headers.map(h => `"${String(row[h as keyof typeof row] ?? '').replace(/"/g, '""')}"`).join(',')
    ),
  ].join('\n')

  res.setHeader('Content-Type', 'text/csv; charset=utf-8')
  res.setHeader('Content-Disposition', `attachment; filename="account-scorer-${new Date().toISOString().split('T')[0]}.csv"`)
  return res.status(200).send('\uFEFF' + csv)
}
