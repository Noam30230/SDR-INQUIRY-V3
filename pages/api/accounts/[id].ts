import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Non authentifié' })

  const { data: { user } } = await supabaseAdmin.auth.getUser(token)
  if (!user) return res.status(401).json({ error: 'Non authentifié' })

  const { id } = req.query as { id: string }

  if (req.method === 'DELETE') {
    const { error } = await supabaseAdmin
      .from('accounts')
      .delete()
      .eq('id', id)
      .eq('user_id', user.id)
    if (error) return res.status(500).json({ error: error.message })
    return res.status(200).json({ success: true })
  }

  if (req.method === 'GET') {
    const { data, error } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('id', id)
      .eq('user_id', user.id)
      .single()
    if (error) return res.status(404).json({ error: 'Compte non trouvé' })
    return res.status(200).json(data)
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
