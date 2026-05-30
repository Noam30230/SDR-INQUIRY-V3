import type { NextApiRequest, NextApiResponse } from 'next'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromToken } from '@/lib/auth-server'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  const user = await getUserFromToken(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('company_website, first_name, last_name, subscription_status, subscription_plan')
    .eq('id', user.id)
    .single()

  return res.status(200).json({
    user_id: user.id,
    email: user.email,
    company_website: profile?.company_website ?? 'NULL ← THIS IS THE BUG',
    first_name: profile?.first_name ?? 'NULL',
    subscription_status: profile?.subscription_status ?? 'NULL',
  })
}
