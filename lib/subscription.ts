export type PlanId = 'solo' | 'pro' | 'growth'
export type SubscriptionStatus = 'trial' | 'active' | 'past_due' | 'canceled' | 'incomplete'

export const PLAN_LIMITS: Record<string, number> = {
  trial: 30,
  solo: 250,
  pro: 750,
  growth: 2500,
}

export const PLAN_LABELS: Record<string, string> = {
  trial: 'Trial',
  solo: 'Solo',
  pro: 'Pro',
  growth: 'Growth',
}

export const STRIPE_PRICE_IDS = (): Record<PlanId, string> => ({
  solo: process.env.STRIPE_PRICE_SOLO!,
  pro: process.env.STRIPE_PRICE_PRO!,
  growth: process.env.STRIPE_PRICE_GROWTH!,
})

export interface UserUsage {
  analysesUsed: number
  analysesLimit: number
  subscriptionStatus: SubscriptionStatus
  subscriptionPlan: string | null
  trialEndsAt: string | null
  currentPeriodEnd: string | null
}
