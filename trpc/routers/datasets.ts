import { z } from 'zod'
import { eq, and, sql, desc, ilike } from 'drizzle-orm'
import { TRPCError } from '@trpc/server'
import { nanoid } from 'nanoid'
import { createTRPCRouter, authedProcedure } from '../init'
import { db } from '@/src/db'
import { dataset, chart, subscription } from '@/src/db/schema'

const chartInputSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  type: z.enum(['bar', 'barHorizontal', 'line', 'area', 'pie', 'donut', 'radar', 'scatter', 'funnel']),
  xAxisKey: z.string(),
  yAxisKeys: z.array(z.string()),
  colSpan: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  aggregation: z.enum(['none', 'sum', 'avg', 'count', 'min', 'max']),
  stacked: z.boolean().optional(),
  lineType: z.enum(['monotone', 'linear', 'step', 'basis']).optional(),
  showDots: z.boolean().optional(),
})

const DEFAULT_LIMIT = 10

export const datasetsRouter = createTRPCRouter({
  list: authedProcedure
    .input(
      z.object({
        page: z.number().int().min(1).default(1),
        limit: z.number().int().min(1).max(50).default(DEFAULT_LIMIT),
        q: z.string().optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      const { page, limit, q } = input
      const offset = (page - 1) * limit
      const term = q?.trim()

      const baseWhere = eq(dataset.userId, ctx.user.id)
      const where = term
        ? and(baseWhere, ilike(dataset.fileName, `%${term}%`))
        : baseWhere

      const [items, totals] = await Promise.all([
        db
          .select({
            id: dataset.id,
            fileName: dataset.fileName,
            fileType: dataset.fileType,
            createdAt: dataset.createdAt,
            updatedAt: dataset.updatedAt,
            chartCount: sql<number>`(
              select count(*)::int from ${chart}
              where ${chart.datasetId} = ${dataset.id}
            )`,
          })
          .from(dataset)
          .where(where)
          .orderBy(desc(dataset.createdAt))
          .limit(limit)
          .offset(offset),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(dataset)
          .where(where),
      ])

      const totalCount = Number(totals[0].count)

      return {
        items,
        totalCount,
        totalPages: Math.ceil(totalCount / limit),
        page,
      }
    }),

  getById: authedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const row = await db.query.dataset.findFirst({
        where: and(eq(dataset.id, input.id), eq(dataset.userId, ctx.user.id)),
        with: { charts: { orderBy: (c, { asc }) => [asc(c.order)] } },
      })
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' })
      return row
    }),

  create: authedProcedure
    .input(
      z.object({
        fileName: z.string().min(1),
        fileType: z.enum(['xlsx', 'xls', 'csv']),
        columns: z.array(z.any()),
        rows: z.array(z.any()),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(dataset)
        .where(eq(dataset.userId, ctx.user.id))

      if (Number(count) >= 5) {
        const sub = await db.query.subscription.findFirst({
          where: eq(subscription.userId, ctx.user.id),
        })
        const isSubscribed =
          sub?.status === 'active' || sub?.status === 'trialing'
        if (!isSubscribed) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'FREE_TIER_LIMIT' })
        }
      }

      const id = nanoid()
      await db.insert(dataset).values({
        id,
        userId: ctx.user.id,
        fileName: input.fileName,
        fileType: input.fileType,
        columns: input.columns,
        rows: input.rows,
      })
      return { id }
    }),

  delete: authedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const row = await db.query.dataset.findFirst({
        where: and(eq(dataset.id, input.id), eq(dataset.userId, ctx.user.id)),
        columns: { id: true },
      })
      if (!row) throw new TRPCError({ code: 'NOT_FOUND' })
      await db.delete(dataset).where(eq(dataset.id, input.id))
    }),

  // 作業ページの「保存」ボタンから呼ぶ一括保存。
  // datasetId なし → 新規作成（無料枠チェック付き）
  // datasetId あり → 既存の charts を差し替え
  saveWithCharts: authedProcedure
    .input(
      z.object({
        datasetId: z.string().optional(),
        fileName: z.string().min(1),
        fileType: z.enum(['xlsx', 'xls', 'csv']),
        columns: z.array(z.any()),
        rows: z.array(z.any()),
        charts: z.array(chartInputSchema),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      // ── 既存データセットの更新 ─────────────────────────────────────────
      if (input.datasetId) {
        const existing = await db.query.dataset.findFirst({
          where: and(
            eq(dataset.id, input.datasetId),
            eq(dataset.userId, ctx.user.id),
          ),
          columns: { id: true },
        })
        if (!existing) throw new TRPCError({ code: 'NOT_FOUND' })

        // charts を全削除してから一括 INSERT（最もシンプルな差し替え）
        await db.delete(chart).where(eq(chart.datasetId, input.datasetId))

        if (input.charts.length > 0) {
          await db.insert(chart).values(
            input.charts.map((c, order) => ({
              id: c.id,
              userId: ctx.user.id,
              datasetId: input.datasetId!,
              title: c.title,
              type: c.type,
              xAxisKey: c.xAxisKey,
              yAxisKeys: c.yAxisKeys,
              colSpan: c.colSpan,
              aggregation: c.aggregation,
              stacked: c.stacked ?? null,
              lineType: c.lineType ?? null,
              showDots: c.showDots ?? null,
              order,
            })),
          )
        }

        return { datasetId: input.datasetId }
      }

      // ── 新規データセットの作成 ─────────────────────────────────────────
      const [{ count }] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(dataset)
        .where(eq(dataset.userId, ctx.user.id))

      if (Number(count) >= 5) {
        const sub = await db.query.subscription.findFirst({
          where: eq(subscription.userId, ctx.user.id),
        })
        const isSubscribed =
          sub?.status === 'active' || sub?.status === 'trialing'
        if (!isSubscribed) {
          throw new TRPCError({ code: 'FORBIDDEN', message: 'FREE_TIER_LIMIT' })
        }
      }

      const datasetId = nanoid()
      await db.insert(dataset).values({
        id: datasetId,
        userId: ctx.user.id,
        fileName: input.fileName,
        fileType: input.fileType,
        columns: input.columns,
        rows: input.rows,
      })

      if (input.charts.length > 0) {
        await db.insert(chart).values(
          input.charts.map((c, order) => ({
            id: c.id,
            userId: ctx.user.id,
            datasetId,
            title: c.title,
            type: c.type,
            xAxisKey: c.xAxisKey,
            yAxisKeys: c.yAxisKeys,
            colSpan: c.colSpan,
            aggregation: c.aggregation,
            stacked: c.stacked ?? null,
            lineType: c.lineType ?? null,
            showDots: c.showDots ?? null,
            order,
          })),
        )
      }

      return { datasetId }
    }),
})
