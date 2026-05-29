import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromToken } from '@/lib/auth-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET' && req.method !== 'DELETE') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const user = await getUserFromToken(token)
  if (!user) return res.status(401).json({ error: 'Non authentifié' })

  if (req.method === 'DELETE') {
    const { tier } = req.query
    let query = supabaseAdmin.from('accounts').delete().eq('user_id', user.id)
    if (tier && tier !== 'all') query = query.eq('tier', tier as string)
    const { error } = await query
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ ok: true })
  }

  const { data, error } = await supabaseAdmin
    .from('accounts')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return res.status(500).json({ error: error.message })
  return res.status(200).json(data)
}
