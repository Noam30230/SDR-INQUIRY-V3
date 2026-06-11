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
    language: deal.language,
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

function formatName(first: string, last: string): string {
  const f = first.trim()
  const l = last.trim().toUpperCase()
  return `${f.charAt(0).toUpperCase()}${f.slice(1)} ${l}`.trim()
}

export async function getPreparer(userId: string, fallbackEmail: string): Promise<{ name: string; website: string | null }> {
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('first_name, last_name, company_website')
    .eq('id', userId)
    .single()

  let first = (profile?.first_name ?? '').trim()
  let last = (profile?.last_name ?? '').trim()

  // Profile row may have NULL names (created by trigger before signup form saved them)
  // → fall back to the auth user_metadata captured at signup
  if (!first && !last) {
    const { data } = await supabaseAdmin.auth.admin.getUserById(userId)
    const meta = data?.user?.user_metadata ?? {}
    first = (meta.first_name ?? '').trim()
    last = (meta.last_name ?? '').trim()
    // Backfill the profile so next time it's there
    if (first || last) {
      await supabaseAdmin.from('profiles').update({ first_name: first, last_name: last }).eq('id', userId)
    }
  }

  const name = (first || last) ? formatName(first, last) : fallbackEmail.split('@')[0]
  return { name, website: profile?.company_website ?? null }
}
