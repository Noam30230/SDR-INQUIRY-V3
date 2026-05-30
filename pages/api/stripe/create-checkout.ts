import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { getUserFromToken } from '@/lib/auth-server'
import { STRIPE_PRICE_IDS, type PlanId } from '@/lib/subscription'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' })

  const token = req.headers.authorization?.replace('Bearer ', '')
  if (!token) return res.status(401).json({ error: 'Unauthorized' })

  const user = await getUserFromToken(token)
  if (!user) return res.status(401).json({ error: 'Unauthorized' })

  const { plan } = req.query as { plan: PlanId }
  const priceIds = STRIPE_PRICE_IDS()
  const priceId = priceIds[plan]
  if (!priceId) return res.status(400).json({ error: 'Invalid plan' })

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Get or create Stripe customer
  const { data: profile } = await supabaseAdmin
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', user.id)
    .single()

  let customerId = profile?.stripe_customer_id
  if (!customerId) {
    try {
      const customer = await stripe.customers.create({
        email: user.email || undefined,
        metadata: { userId: user.id },
      })
      customerId = customer.id
      await supabaseAdmin.from('profiles').update({ stripe_customer_id: customerId }).eq('id', user.id)
    } catch (err: any) {
      return res.status(500).json({ error: `Stripe customer error: ${err?.message ?? err}` })
    }
  }

  const PLAN_NAMES: Record<PlanId, string> = {
    solo: 'Solo — 250 analyses/month',
    pro: 'Pro — 750 analyses/month',
    growth: 'Growth — 2,500 analyses/month',
  }

  let session
  try {
    session = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: { userId: user.id, plan },
      subscription_data: {
        metadata: { userId: user.id, plan },
      },
      success_url: `${appUrl}/scoring?upgraded=1`,
      cancel_url: `${appUrl}/scoring`,
      allow_promotion_codes: true,
      locale: 'fr',
      billing_address_collection: 'auto',
      payment_method_types: ['card'],
      custom_text: {
        submit: {
          message: 'Your subscription starts immediately. Cancel anytime from your billing portal.',
        },
        after_submit: {
          message: 'You\'ll be redirected back to Inquiry right after payment.',
        },
      },
    })
  } catch (err: any) {
    return res.status(500).json({ error: err?.message ?? 'Stripe error' })
  }

  return res.status(200).json({ url: session.url })
}
