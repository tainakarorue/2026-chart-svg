import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { nanoid } from 'nanoid'
import { eq } from 'drizzle-orm'
import { stripe } from '@/lib/stripe'
import { db } from '@/src/db'
import { subscription } from '@/src/db/schema'

type SubscriptionStatus = typeof subscription.$inferInsert['status']

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const stripeSub = await stripe.subscriptions.retrieve(
        session.subscription as string,
      )
      const userId = session.metadata?.userId
      if (!userId) break

      const periodEnd = stripeSub.items.data[0].current_period_end

      await db
        .insert(subscription)
        .values({
          id: nanoid(),
          userId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: stripeSub.id,
          stripePriceId: stripeSub.items.data[0].price.id,
          status: stripeSub.status as SubscriptionStatus,
          currentPeriodEnd: new Date(periodEnd * 1000),
        })
        .onConflictDoUpdate({
          target: subscription.userId,
          set: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: stripeSub.id,
            stripePriceId: stripeSub.items.data[0].price.id,
            status: stripeSub.status as SubscriptionStatus,
            currentPeriodEnd: new Date(periodEnd * 1000),
          },
        })
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const stripeSub = event.data.object as Stripe.Subscription
      const periodEnd = stripeSub.items.data[0].current_period_end
      await db
        .update(subscription)
        .set({
          status: stripeSub.status as SubscriptionStatus,
          stripePriceId: stripeSub.items.data[0].price.id,
          currentPeriodEnd: new Date(periodEnd * 1000),
        })
        .where(eq(subscription.stripeSubscriptionId, stripeSub.id))
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subId =
        invoice.parent?.subscription_details?.subscription != null
          ? (invoice.parent.subscription_details.subscription as string)
          : null
      if (!subId) break
      await db
        .update(subscription)
        .set({ status: 'past_due' })
        .where(eq(subscription.stripeSubscriptionId, subId))
      break
    }
  }

  return NextResponse.json({ received: true })
}
