import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
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

  const sub = await db.query.subscription.findFirst({
    where: eq(subscription.userId, session.user.id),
  })
  if (!sub?.stripeCustomerId) {
    return NextResponse.json({ error: 'No subscription' }, { status: 400 })
  }

  const portalSession = await stripe.billingPortal.sessions.create({
    customer: sub.stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard`,
  })

  return NextResponse.json({ url: portalSession.url })
}
