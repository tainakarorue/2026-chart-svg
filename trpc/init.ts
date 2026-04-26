import 'server-only'
import { initTRPC, TRPCError } from '@trpc/server'
import { cache } from 'react'
import { headers } from 'next/headers'
import superjson from 'superjson'
import { auth } from '@/lib/auth'

export const createTRPCContext = cache(async () => {
  const session = await auth.api.getSession({ headers: await headers() })
  return { session }
})

type Context = Awaited<ReturnType<typeof createTRPCContext>>

const t = initTRPC.context<Context>().create({
  transformer: superjson,
})

export const createTRPCRouter = t.router
export const createCallerFactory = t.createCallerFactory

export const publicProcedure = t.procedure

export const authedProcedure = t.procedure.use(({ ctx, next }) => {
  if (!ctx.session?.user) {
    throw new TRPCError({ code: 'UNAUTHORIZED' })
  }
  // ctx に db など他のフィールドを追加した場合は
  // { ...ctx, user: ctx.session.user } に変更して型を引き継ぐこと
  return next({
    ctx: { user: ctx.session.user },
  })
})
