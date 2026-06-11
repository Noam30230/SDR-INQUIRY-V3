// ─── Deal tracking (stored in accounts.raw_data.deal) ───────────────────────

export type DealStage =
  | 'cold_call' | 'discovery' | 'demo' | 'pricing'
  | 'trial' | 'negotiation' | 'closed_won' | 'closed_lost'

export const STAGE_LABELS: Record<DealStage, string> = {
  cold_call: 'Cold Call',
  discovery: 'Discovery',
  demo: 'Demo',
  pricing: 'Pricing',
  trial: 'Trial',
  negotiation: 'Negotiation',
  closed_won: 'Closed Won',
  closed_lost: 'Closed Lost',
}

export const STAGE_ORDER: DealStage[] = [
  'cold_call', 'discovery', 'demo', 'pricing', 'trial', 'negotiation', 'closed_won', 'closed_lost',
]

export type ContactRole =
  | 'Economic Buyer' | 'Validated Champion' | 'Potential Champion'
  | 'Coach' | 'Technical Validator' | 'Other'

export const ROLE_OPTIONS: ContactRole[] = [
  'Economic Buyer', 'Validated Champion', 'Potential Champion', 'Coach', 'Technical Validator', 'Other',
]

export interface DealContact {
  id: string
  name: string
  title: string
  role: ContactRole
  email?: string
  linkedin?: string
}

export interface TechCorrection {
  field: string          // TechStack category ('Cloud', 'Monitoring'…) or 'headcount' | 'other'
  new_values: string[]
  evidence: string
  applied: boolean
}

export interface MeetingIntel {
  summary: string
  key_facts: string[]
  corrections: TechCorrection[]
  stakeholders_mentioned: Array<{ name: string; title: string; suggested_role: ContactRole; evidence: string }>
  pains: string[]
  objections: Array<{ objection: string; suggested_response: string }>
  budget_timing: string | null
  competitors: string[]
  champion_updates: Array<{ name: string; suggestion: ContactRole; evidence: string }>
  next_steps: string[]
  risks: string[]
  follow_up_email: { subject: string; body: string } | null
}

export interface DealMeeting {
  id: string
  stage: DealStage
  title: string
  date: string          // ISO date
  kind: 'notes' | 'transcript'
  content: string       // raw notes or extracted transcript text
  intel?: MeetingIntel
  created_at: string
}

export interface StoredBrief {
  step1: Step1Result
  step2: Step2Result
  html: string
  generated_at: string
  version: number
}

export interface DealData {
  stage: DealStage
  contacts: DealContact[]
  meetings: DealMeeting[]
  facts: string[]       // accumulated ground-truth facts from all meetings
  brief?: StoredBrief
}

export function emptyDeal(): DealData {
  return { stage: 'cold_call', contacts: [], meetings: [], facts: [] }
}

// ─── Brief generation (3 Whys framework) ────────────────────────────────────

export interface Enrichment {
  headcount: string
  funding: string
  open_relevant_roles: number
  recent_events: string[]
  key_personnel: Array<{ name: string; title: string; linkedin?: string }>
}

export interface SignalCard {
  tag: string
  title: string
  body: string
}

export interface Step1Result {
  company_summary: string
  how_they_make_money: string
  enrichment: Enrichment
  icp_rationale: SignalCard[]
  motion: 'A' | 'B' | 'C'
  motion_evidence: string
  partner_angle: string | null
  why_anything: SignalCard[]
  why_product: SignalCard[]
  why_now: SignalCard[]
}

export interface PersonRow {
  name: string
  title: string
  role: string
  email: string
}

export interface ChampionProfile {
  name: string
  title: string
  why_champion: string
  entry_angle: string
  likely_objection: string
  how_to_handle: string
}

export interface EconomicBuyerProfile {
  name: string
  title: string
  why_them: string
  what_they_need: string
}

export interface ValueRow {
  persona_name: string
  persona_title: string
  pain: string
  product_mechanism: string
  value_delivered: string
}

export interface OutboundItem {
  name: string
  title: string
  role_in_deal: string
  email?: { subject: string; body: string }
  linkedin?: { body: string }
}

export interface Step2Result {
  people_map: {
    economic_buyers: PersonRow[]
    champions: PersonRow[]
    coaches: PersonRow[]
  }
  champion_shortlist: ChampionProfile[]
  economic_buyers: EconomicBuyerProfile[]
  value_messaging: ValueRow[]
  outbound: OutboundItem[]
  discovery_prep?: {
    call_objective: string
    questions: string[]
    landmines: string[]
  }
}

export interface DealHistoryEntry {
  title: string
  date: string
  stage: string
  summary: string
}

export interface BriefData {
  account_name: string
  vendor_name: string
  month_year: string
  preparer_name: string
  step1: Step1Result
  step2: Step2Result
  deal_history?: {
    meetings: DealHistoryEntry[]
    next_steps: string[]
    risks: string[]
  }
}
