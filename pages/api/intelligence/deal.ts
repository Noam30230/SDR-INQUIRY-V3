import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromToken } from '@/lib/auth-server'
import { getDeal, saveDeal, fetchAccountForUser } from '@/lib/account-intelligence/deal'
import type { DealContact, DealStage } from '@/lib/account-intelligence/types'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  const user = await getUserFromToken(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  if (req.method === 'GET') {
    const accountId = req.query.accountId as string
    if (!accountId) return res.status(400).json({ error: 'accountId required' })

    const account = await fetchAccountForUser(accountId, user.id)
    if (!account) return res.status(404).json({ error: 'Account not found' })

    return res.status(200).json({ account, deal: getDeal(account) })
  }

  if (req.method === 'PUT') {
    const { accountId, stage, contacts, language } = req.body as {
      accountId?: string
      stage?: DealStage
      contacts?: DealContact[]
      language?: 'fr' | 'en'
    }
    if (!accountId) return res.status(400).json({ error: 'accountId required' })

    const account = await fetchAccountForUser(accountId, user.id)
    if (!account) return res.status(404).json({ error: 'Account not found' })

    const deal = getDeal(account)
    if (stage) deal.stage = stage
    if (contacts) deal.contacts = contacts
    if (language) deal.language = language
    await saveDeal(account, deal)

    return res.status(200).json({ deal })
  }

  return res.status(405).json({ error: 'Method not allowed' })
}
