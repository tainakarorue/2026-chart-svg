import { relations } from 'drizzle-orm'
import {
  pgTable,
  text,
  timestamp,
  boolean,
  index,
  jsonb,
  integer,
} from 'drizzle-orm/pg-core'
import type {
  Column,
  Row,
  ChartType,
  ColSpan,
  Aggregation,
  LineType,
} from '@/lib/store/dashboard'

export const user = pgTable('user', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  emailVerified: boolean('email_verified').default(false).notNull(),
  image: text('image'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => /* @__PURE__ */ new Date())
    .notNull(),
})

export const session = pgTable(
  'session',
  {
    id: text('id').primaryKey(),
    expiresAt: timestamp('expires_at').notNull(),
    token: text('token').notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
  },
  (table) => [index('session_userId_idx').on(table.userId)],
)

export const account = pgTable(
  'account',
  {
    id: text('id').primaryKey(),
    accountId: text('account_id').notNull(),
    providerId: text('provider_id').notNull(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    accessToken: text('access_token'),
    refreshToken: text('refresh_token'),
    idToken: text('id_token'),
    accessTokenExpiresAt: timestamp('access_token_expires_at'),
    refreshTokenExpiresAt: timestamp('refresh_token_expires_at'),
    scope: text('scope'),
    password: text('password'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('account_userId_idx').on(table.userId)],
)

export const verification = pgTable(
  'verification',
  {
    id: text('id').primaryKey(),
    identifier: text('identifier').notNull(),
    value: text('value').notNull(),
    expiresAt: timestamp('expires_at').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => /* @__PURE__ */ new Date())
      .notNull(),
  },
  (table) => [index('verification_identifier_idx').on(table.identifier)],
)

// ─── dataset ────────────────────────────────────────────────────────────────

export const dataset = pgTable(
  'dataset',
  {
    id: text('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    fileName: text('file_name').notNull(),
    fileType: text('file_type').$type<'xlsx' | 'xls' | 'csv'>().notNull(),
    columns: jsonb('columns').$type<Column[]>().notNull(),
    rows: jsonb('rows').$type<Row[]>().notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [index('dataset_userId_idx').on(table.userId)],
)

// ─── chart ──────────────────────────────────────────────────────────────────

export const chart = pgTable(
  'chart',
  {
    id: text('id').primaryKey(),
    datasetId: text('dataset_id')
      .notNull()
      .references(() => dataset.id, { onDelete: 'cascade' }),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    title: text('title').notNull(),
    type: text('type').$type<ChartType>().notNull(),
    xAxisKey: text('x_axis_key').notNull(),
    yAxisKeys: jsonb('y_axis_keys').$type<string[]>().notNull(),
    colSpan: integer('col_span').$type<ColSpan>().notNull().default(1),
    aggregation: text('aggregation')
      .$type<Aggregation>()
      .notNull()
      .default('none'),
    stacked: boolean('stacked'),
    lineType: text('line_type').$type<LineType>(),
    showDots: boolean('show_dots'),
    order: integer('order').notNull().default(0),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at')
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index('chart_datasetId_idx').on(table.datasetId),
    index('chart_userId_idx').on(table.userId),
  ],
)

// ─── subscription ────────────────────────────────────────────────────────────

export const subscription = pgTable('subscription', {
  id: text('id').primaryKey(),
  userId: text('user_id')
    .notNull()
    .unique()
    .references(() => user.id, { onDelete: 'cascade' }),
  stripeCustomerId: text('stripe_customer_id').unique(),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripePriceId: text('stripe_price_id'),
  status: text('status')
    .$type<'active' | 'trialing' | 'past_due' | 'canceled' | 'incomplete'>()
    .notNull(),
  currentPeriodEnd: timestamp('current_period_end'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdate(() => new Date())
    .notNull(),
})

// ─── relations ───────────────────────────────────────────────────────────────

export const userRelations = relations(user, ({ many, one }) => ({
  sessions: many(session),
  accounts: many(account),
  datasets: many(dataset),
  subscription: one(subscription, {
    fields: [user.id],
    references: [subscription.userId],
  }),
}))

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, {
    fields: [session.userId],
    references: [user.id],
  }),
}))

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, {
    fields: [account.userId],
    references: [user.id],
  }),
}))

export const datasetRelations = relations(dataset, ({ one, many }) => ({
  user: one(user, {
    fields: [dataset.userId],
    references: [user.id],
  }),
  charts: many(chart),
}))

export const chartRelations = relations(chart, ({ one }) => ({
  dataset: one(dataset, {
    fields: [chart.datasetId],
    references: [dataset.id],
  }),
  user: one(user, {
    fields: [chart.userId],
    references: [user.id],
  }),
}))

export const subscriptionRelations = relations(subscription, ({ one }) => ({
  user: one(user, {
    fields: [subscription.userId],
    references: [user.id],
  }),
}))
