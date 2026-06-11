import type { NextApiRequest, NextApiResponse } from 'next'
import { getUserFromToken } from '@/lib/auth-server'
import { getDeal, saveDeal, fetchAccountForUser, getPreparer, vendorFromWebsite } from '@/lib/account-intelligence/deal'
import { extractMeetingIntel, applyCorrections } from '@/lib/account-intelligence/extract'
import type { DealMeeting, DealStage } from '@/lib/account-intelligence/types'

export const config = {
  api: { bodyParser: { sizeLimit: '12mb' } },
  maxDuration: 300,
}

async function parsePdf(base64: string): Promise<string> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfParse = (await import('pdf-parse/lib/pdf-parse.js' as any)).default as (b: Buffer) => Promise<{ text: string }>
  const buffer = Buffer.from(base64, 'base64')
  const result = await pdfParse(buffer)
  return result.text
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })
  const user = await getUserFromToken(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  // ── DELETE a meeting ───────────────────────────────────────────────────────
  if (req.method === 'DELETE') {
    const accountId = req.query.accountId as string
    const meetingId = req.query.meetingId as string
    if (!accountId || !meetingId) return res.status(400).json({ error: 'accountId and meetingId required' })

    const account = await fetchAccountForUser(accountId, user.id)
    if (!account) return res.status(404).json({ error: 'Account not found' })

    const deal = getDeal(account)
    deal.meetings = deal.meetings.filter(m => m.id !== meetingId)
    await saveDeal(account, deal)
    return res.status(200).json({ deal })
  }

  // ── POST a new meeting (notes or transcript) ──────────────────────────────
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { accountId, title, stage, date, content, pdfBase64 } = req.body as {
    accountId?: string
    title?: string
    stage?: DealStage
    date?: string
    content?: string
    pdfBase64?: string
  }
  if (!accountId) return res.status(400).json({ error: 'accountId required' })
  if (!content?.trim() && !pdfBase64) return res.status(400).json({ error: 'Notes text or a PDF file is required' })

  const account = await fetchAccountForUser(accountId, user.id)
  if (!account) return res.status(404).json({ error: 'Account not found' })

  // Resolve text content (PDF → text if needed)
  let text = content?.trim() ?? ''
  if (pdfBase64) {
    try {
      const pdfText = await parsePdf(pdfBase64)
      text = [text, pdfText].filter(Boolean).join('\n\n')
    } catch {
      return res.status(400).json({ error: 'Could not read the PDF — try pasting the text instead' })
    }
  }
  if (!text.trim()) return res.status(400).json({ error: 'No readable text found' })

  const deal = getDeal(account)
  const { name: preparerName, website } = await getPreparer(user.id, user.email)
  const vendor = vendorFromWebsite(website)

  const meeting: DealMeeting = {
    id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    stage: stage ?? deal.stage,
    title: title?.trim() || 'Untitled meeting',
    date: date || new Date().toISOString().slice(0, 10),
    kind: pdfBase64 || text.length > 3000 ? 'transcript' : 'notes',
    content: text,
    created_at: new Date().toISOString(),
  }

  // Extract intel + apply corrections (AWS → Azure etc.)
  let stackChanged = false
  try {
    meeting.intel = await extractMeetingIntel(account, meeting, vendor.name, preparerName)
    const applied = await applyCorrections(account, deal, meeting.intel)
    stackChanged = applied.stackChanged
  } catch (err) {
    // Extraction failure shouldn't block saving the meeting itself
    console.error('Intel extraction failed:', err)
  }

  deal.meetings.push(meeting)
  deal.meetings.sort((a, b) => a.date.localeCompare(b.date))
  await saveDeal(account, deal)

  return res.status(200).json({ meeting, deal, stackChanged, tech_stack: account.tech_stack })
}
