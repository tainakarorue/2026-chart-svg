import { createTRPCRouter } from '../init'
import { datasetsRouter } from './datasets'
import { chartsRouter } from './charts'

export const appRouter = createTRPCRouter({
  datasets: datasetsRouter,
  charts: chartsRouter,
})

export type AppRouter = typeof appRouter
