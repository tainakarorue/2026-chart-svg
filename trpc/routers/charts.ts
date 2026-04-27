import { z } from 'zod'
import { eq, and, sql } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { nanoid } from 'nanoid'
import { createTRPCRouter, authedProcedure } from '../init'
import { db } from '@/src/db'
import { chart, dataset } from '@/src/db/schema'

const chartTypeSchema = z.enum([
  'bar', 'barHorizontal', 'line', 'area', 'pie', 'donut', 'radar', 'scatter', 'funnel',
])
const colSpanSchema = z.union([z.literal(1), z.literal(2), z.literal(3)])
const aggregationSchema = z.enum(['none', 'sum', 'avg', 'count', 'min', 'max'])
const lineTypeSchema = z.enum(['monotone', 'linear', 'step', 'basis'])

export const chartsRouter = createTRPCRouter({
  create: authedProcedure
    .input(
      z.object({
        id: z.string().optional(),
        datasetId: z.string(),
        title: z.string().min(1),
        type: chartTypeSchema,
        xAxisKey: z.string(),
        yAxisKeys: z.array(z.string()).min(1),
        colSpan: colSpanSchema.default(1),
        aggregation: aggregationSchema.default('none'),
        stacked: z.boolean().optional(),
        lineType: lineTypeSchema.optional(),
        showDots: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const parent = await db.query.dataset.findFirst({
        where: and(
          eq(dataset.id, input.datasetId),
          eq(dataset.userId, ctx.user.id),
        ),
        columns: { id: true },
      })
      if (!parent) throw new TRPCError({ code: 'NOT_FOUND' })

      const [{ maxOrder }] = await db
        .select({ maxOrder: sql<number>`coalesce(max(${chart.order}), -1)` })
        .from(chart)
        .where(eq(chart.datasetId, input.datasetId))

      const id = input.id ?? nanoid()
      await db.insert(chart).values({
        id,
        userId: ctx.user.id,
        datasetId: input.datasetId,
        title: input.title,
        type: input.type,
        xAxisKey: input.xAxisKey,
        yAxisKeys: input.yAxisKeys,
        colSpan: input.colSpan,
        aggregation: input.aggregation,
        stacked: input.stacked ?? null,
        lineType: input.lineType ?? null,
        showDots: input.showDots ?? null,
        order: Number(maxOrder) + 1,
      })
      return { id }
    }),

  update: authedProcedure
    .input(
      z.object({
        id: z.string(),
        title: z.string().min(1).optional(),
        type: chartTypeSchema.optional(),
        xAxisKey: z.string().optional(),
        yAxisKeys: z.array(z.string()).min(1).optional(),
        colSpan: colSpanSchema.optional(),
        aggregation: aggregationSchema.optional(),
        stacked: z.boolean().optional(),
        lineType: lineTypeSchema.optional(),
        showDots: z.boolean().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input
      const row = await db.query.chart.findFirst({
        where: and(eq(chart.id, id), eq(chart.userId, ctx.user.id)),
        columns: { id: true },
      })
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' })

      const updates = Object.fromEntries(
        Object.entries(fields).filter(([, v]) => v !== undefined),
      )
      if (Object.keys(updates).length === 0) return

      await db.update(chart).set(updates).where(eq(chart.id, id))
    }),

  delete: authedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const row = await db.query.chart.findFirst({
        where: and(eq(chart.id, input.id), eq(chart.userId, ctx.user.id)),
        columns: { id: true },
      })
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' })
      await db.delete(chart).where(eq(chart.id, input.id))
    }),

  reorder: authedProcedure
    .input(
      z.object({
        datasetId: z.string(),
        orderedIds: z.array(z.string()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const parent = await db.query.dataset.findFirst({
        where: and(
          eq(dataset.id, input.datasetId),
          eq(dataset.userId, ctx.user.id),
        ),
        columns: { id: true },
      })
      if (!parent) throw new TRPCError({ code: 'NOT_FOUND' })

      await Promise.all(
        input.orderedIds.map((id, order) =>
          db
            .update(chart)
            .set({ order })
            .where(and(eq(chart.id, id), eq(chart.datasetId, input.datasetId))),
        ),
      )
    }),
})
