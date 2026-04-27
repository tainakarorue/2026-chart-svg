import { createTRPCRouter } from '../init'
import { datasetsRouter } from './datasets'
import { chartsRouter } from './charts'
import { subscriptionRouter } from './subscription'

export const appRouter = createTRPCRouter({
  datasets: datasetsRouter,
  charts: chartsRouter,
  subscription: subscriptionRouter,
})

export type AppRouter = typeof appRouter
