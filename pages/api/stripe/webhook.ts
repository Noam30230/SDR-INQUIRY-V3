import type { NextApiRequest, NextApiResponse } from 'next'
import Stripe from 'stripe'
import { supabaseAdmin } from '@/lib/supabase-admin'
import { PLAN_LIMITS } from '@/lib/subscription'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!)

export const config = { api: { bodyParser: false } }

async function getRawBody(req: NextApiRequest): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks)))
    req.on('error', reject)
  })
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') return res.status(405).end()

  const sig = req.headers['stripe-signature']
  if (!sig) return res.status(400).json({ error: 'Missing signature' })

  const rawBody = await getRawBody(req)

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(rawBody, sig, process.env.STRIPE_WEBHOOK_SECRET!)
  } catch (err) {
    return res.status(400).json({ error: `Webhook error: ${(err as Error).message}` })
  }

  try {
    switch (event.type) {

      // Checkout completed → activate subscription
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        if (session.mode !== 'subscription') break
        const userId = session.metadata?.userId
        const plan = session.metadata?.plan
        if (!userId || !plan) break

        await supabaseAdmin.from('profiles').update({
          stripe_customer_id: session.customer as string,
          stripe_subscription_id: session.subscription as string,
          subscription_status: 'active',
          subscription_plan: plan,
          analyses_limit: PLAN_LIMITS[plan] ?? 250,
          analyses_used: 0,
          analyses_reset_at: new Date().toISOString(),
        }).eq('id', userId)
        break
      }

      // Subscription updated (plan change, renewal, payment failure...)
      case 'customer.subscription.updated': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (!userId) break
        const plan = sub.metadata?.plan

        const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end
        await supabaseAdmin.from('profiles').update({
          subscription_status: sub.status,
          ...(periodEnd ? { current_period_end: new Date(periodEnd * 1000).toISOString() } : {}),
          ...(plan ? {
            subscription_plan: plan,
            analyses_limit: PLAN_LIMITS[plan] ?? 250,
          } : {}),
        }).eq('id', userId)
        break
      }

      // Subscription canceled
      case 'customer.subscription.deleted': {
        const sub = event.data.object as Stripe.Subscription
        const userId = sub.metadata?.userId
        if (!userId) break

        await supabaseAdmin.from('profiles').update({
          subscription_status: 'canceled',
          subscription_plan: null,
          stripe_subscription_id: null,
          analyses_limit: 0,
        }).eq('id', userId)
        break
      }

      // Monthly renewal → reset usage counter
      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice
        if (invoice.billing_reason !== 'subscription_cycle') break

        // Find user by Stripe customer ID
        const { data: profile } = await supabaseAdmin
          .from('profiles')
          .select('id')
          .eq('stripe_customer_id', invoice.customer as string)
          .single()
        if (!profile) break

        await supabaseAdmin.from('profiles').update({
          analyses_used: 0,
          analyses_reset_at: new Date().toISOString(),
        }).eq('id', profile.id)
        break
      }
    }
  } catch (err) {
    console.error('Webhook processing error:', err)
    // Still return 200 so Stripe doesn't retry indefinitely
  }

  return res.status(200).json({ received: true })
}
