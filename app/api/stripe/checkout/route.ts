import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { nanoid } from 'nanoid'
import { eq } from 'drizzle-orm'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { db } from '@/src/db'
import { subscription } from '@/src/db/schema'

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  const sub = await db.query.subscription.findFirst({
    where: eq(subscription.userId, user.id),
  })

  let customerId = sub?.stripeCustomerId ?? null

  if (!customerId) {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name ?? undefined,
      metadata: { userId: user.id },
    })
    customerId = customer.id

    await db
      .insert(subscription)
      .values({
        id: nanoid(),
        userId: user.id,
        stripeCustomerId: customerId,
        status: 'incomplete',
      })
      .onConflictDoUpdate({
        target: subscription.userId,
        set: { stripeCustomerId: customerId },
      })
  }

  const checkoutSession = await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: process.env.STRIPE_PRICE_ID!, quantity: 1 }],
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/dashboard`,
    metadata: { userId: user.id },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
