import { eq } from 'drizzle-orm'
import { createTRPCRouter, authedProcedure } from '../init'
import { db } from '@/src/db'
import { subscription } from '@/src/db/schema'

export const subscriptionRouter = createTRPCRouter({
  getStatus: authedProcedure.query(async ({ ctx }) => {
    const sub = await db.query.subscription.findFirst({
      where: eq(subscription.userId, ctx.user.id),
    })
    const isActive =
      sub?.status === 'active' || sub?.status === 'trialing'
    return {
      isActive,
      status: sub?.status ?? null,
      currentPeriodEnd: sub?.currentPeriodEnd ?? null,
    }
  }),
})
