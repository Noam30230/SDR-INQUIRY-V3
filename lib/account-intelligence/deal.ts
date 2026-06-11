import { supabaseAdmin } from '@/lib/supabase-admin'
import type { Account } from '@/types'
import type { DealData } from './types'
import { emptyDeal } from './types'

export function getDeal(account: Account): DealData {
  const deal = account.raw_data?.deal as DealData | undefined
  if (!deal) return emptyDeal()
  return {
    stage: deal.stage ?? 'cold_call',
    contacts: deal.contacts ?? [],
    meetings: deal.meetings ?? [],
    facts: deal.facts ?? [],
    brief: deal.brief,
  }
}

export async function saveDeal(account: Account, deal: DealData): Promise<void> {
  await supabaseAdmin
    .from('accounts')
    .update({ raw_data: { ...(account.raw_data as object), deal } })
    .eq('id', account.id)
}

export async function fetchAccountForUser(accountId: string, userId: string): Promise<Account | null> {
  const { data } = await supabaseAdmin
    .from('accounts')
    .select('*')
    .eq('id', accountId)
    .eq('user_id', userId)
    .single()
  return (data as Account) ?? null
}

// "datadog.com" → "Datadog"
export function vendorFromWebsite(website: string | null | undefined): { name: string; domain: string } {
  if (!website) return { name: 'your company', domain: '' }
  const domain = website.trim().replace(/^https?:\/\//i, '').replace(/^www\./i, '').split('/')[0]
  const base = domain.split('.')[0]
  const name = base ? base.charAt(0).toUpperCase() + base.slice(1).toLowerCase() : 'your company'
  return { name, domain }
}

export async function getPreparer(userId: string, fallbackEmail: string): Promise<{ name: string; website: string | null }> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('first_name, last_name, company_website')
    .eq('id', userId)
    .single()

  const first = (profile?.first_name ?? '').trim()
  const last = (profile?.last_name ?? '').trim()
  const name = (first || last) ? `${first} ${last}`.trim() : fallbackEmail.split('@')[0]
  return { name, website: profile?.company_website ?? null }
}
