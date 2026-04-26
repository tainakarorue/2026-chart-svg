# Phase 9: DB永続化 — データ・グラフ CRUD 実装計画

> 作成日: 2026-04-26

---

## 1. 概要

現在 Zustand のみで管理しているデータセット・チャート設定を Neon (PostgreSQL) + Drizzle ORM に永続化する。
認証は better-auth、API レイヤーは tRPC v11、一覧表示は TanStack Query の Suspense Query + ページネーションで実装する。
5件を超えるデータセット作成は Stripe の月額サブスクリプション加入者のみに制限する。

---

## 2. 追加テーブル設計

### 2-1. `dataset` — アップロード済みファイルデータ

| カラム       | 型                       | 説明                                 |
|------------|--------------------------|--------------------------------------|
| id         | text PK                  | nanoid                               |
| user_id    | text FK → user.id        | オーナー。CASCADE DELETE             |
| file_name  | text                     | 元ファイル名                          |
| file_type  | text                     | `'xlsx' \| 'xls' \| 'csv'`           |
| columns    | jsonb                    | `Column[]`（key / label / type）      |
| rows       | jsonb                    | `Row[]`（全行データ）                 |
| created_at | timestamp                | デフォルト `now()`                    |
| updated_at | timestamp                | `$onUpdate`                          |

インデックス: `dataset_userId_idx` (user_id)

### 2-2. `chart` — チャート設定

| カラム        | 型                        | 説明                                      |
|-------------|---------------------------|-------------------------------------------|
| id          | text PK                   | nanoid                                    |
| dataset_id  | text FK → dataset.id      | 親データセット。CASCADE DELETE            |
| user_id     | text FK → user.id         | ユーザーレベルのクエリ用。CASCADE DELETE  |
| title       | text                      | チャートタイトル                           |
| type        | text                      | `ChartType`（bar / line / area / …）      |
| x_axis_key  | text                      | X 軸カラムキー                            |
| y_axis_keys | jsonb                     | `string[]`（複数 Y 軸対応）               |
| col_span    | integer default 1         | グリッド幅 `1 \| 2 \| 3`                  |
| aggregation | text default 'none'       | `'none' \| 'sum' \| 'avg' \| 'count'`    |
| order       | integer default 0         | dnd-kit の表示順                          |
| created_at  | timestamp                 | デフォルト `now()`                        |
| updated_at  | timestamp                 | `$onUpdate`                               |

インデックス: `chart_datasetId_idx` (dataset_id), `chart_userId_idx` (user_id)

### 2-3. `subscription` — Stripe サブスクリプション

| カラム                   | 型          | 説明                                              |
|------------------------|-------------|---------------------------------------------------|
| id                     | text PK     | nanoid                                            |
| user_id                | text FK UNIQUE → user.id | 1ユーザー 1レコード。CASCADE DELETE |
| stripe_customer_id     | text UNIQUE | Stripe Customer ID                                |
| stripe_subscription_id | text UNIQUE | Stripe Subscription ID                            |
| stripe_price_id        | text        | 契約中のプラン Price ID                            |
| status                 | text        | `'active' \| 'trialing' \| 'past_due' \| 'canceled' \| 'incomplete'` |
| current_period_end     | timestamp   | 現在の契約期間終了日                               |
| created_at             | timestamp   | デフォルト `now()`                                |
| updated_at             | timestamp   | `$onUpdate`                                       |

---

## 3. リレーション

```
user
 ├── sessions      (better-auth 既存)
 ├── accounts      (better-auth 既存)
 ├── datasets      (1:N)
 │    └── charts   (1:N)
 └── subscription  (1:1)
```

---

## 4. tRPC ルーター設計

### ディレクトリ構成（予定）

```
src/
├── trpc/
│   ├── server.ts          # initTRPC + context (better-auth session 取得)
│   ├── router.ts          # appRouter (datasets + charts をマージ)
│   ├── client.ts          # createTRPCProxyClient (Server Components 用)
│   ├── react.tsx          # createTRPCReact (Client Components 用)
│   └── routers/
│       ├── datasets.ts    # データセット CRUD
│       └── charts.ts      # チャート CRUD + 並び替え
└── db/
    ├── index.ts
    └── schema.ts
```

### 4-1. `datasets` ルーター

| プロシージャ       | 種別     | 入力                                      | 説明                                |
|-----------------|----------|-------------------------------------------|-------------------------------------|
| `list`          | query    | `{ limit, cursor }` (カーソルページネーション) | ユーザーのデータセット一覧（チャート数付き） |
| `getById`       | query    | `{ id }`                                  | 1件取得（columns + rows + charts）  |
| `create`        | mutation | `{ fileName, fileType, columns, rows }`   | 作成（無料枠チェック込み）           |
| `delete`        | mutation | `{ id }`                                  | 削除（charts は CASCADE）           |

### 4-2. `charts` ルーター

| プロシージャ    | 種別     | 入力                                                    | 説明               |
|--------------|----------|---------------------------------------------------------|--------------------|
| `create`     | mutation | `{ datasetId, title, type, xAxisKey, yAxisKeys, colSpan, aggregation }` | チャート追加 |
| `update`     | mutation | `{ id, title?, type?, xAxisKey?, yAxisKeys?, colSpan?, aggregation? }` | 部分更新 |
| `delete`     | mutation | `{ id }`                                                | 削除               |
| `reorder`    | mutation | `{ datasetId, orderedIds }`                             | dnd-kit の並び替え反映 |

---

## 5. Suspense Query + ページネーション（一覧画面）

```tsx
// カーソルベースのページネーション
const { data, fetchNextPage, hasNextPage } =
  trpc.datasets.list.useSuspenseInfiniteQuery(
    { limit: 20 },
    { getNextPageParam: (last) => last.nextCursor },
  )
```

- `cursor` は `dataset.createdAt` (ISO string) を使用
- `useSuspenseInfiniteQuery` でサーバー側の初期フェッチを活用
- `<Suspense fallback={<Skeleton />}>` でラップ

---

## 6. 無料枠ゲート（5件制限）

`datasets.create` プロシージャ内で以下をチェック:

```ts
const count = await db
  .select({ count: sql<number>`count(*)` })
  .from(dataset)
  .where(eq(dataset.userId, ctx.user.id))

const sub = await db.query.subscription.findFirst({
  where: eq(subscription.userId, ctx.user.id),
})

const isSubscribed = sub?.status === 'active' || sub?.status === 'trialing'

if (count[0].count >= 5 && !isSubscribed) {
  throw new TRPCError({
    code: 'FORBIDDEN',
    message: 'FREE_TIER_LIMIT', // クライアントでStripe Checkoutにリダイレクト
  })
}
```

---

## 7. 実装ステップ

### Step 1 — スキーマ追加 + マイグレーション ✅（本ドキュメントで実施）

- `src/db/schema.ts` に `dataset` / `chart` / `subscription` テーブルを追加
- `npm run db:generate` → `npm run db:migrate` でマイグレーション適用

```json
// package.json scripts に追加
"db:generate": "drizzle-kit generate",
"db:migrate":  "drizzle-kit migrate"
```

### Step 2 — tRPC サーバー初期化

- `src/trpc/server.ts`: `initTRPC.context<Context>()` + `authedProcedure`
- Context で better-auth の `auth.api.getSession` を呼び出してユーザー取得
- `src/trpc/router.ts`: `appRouter` 作成

### Step 3 — Next.js App Router 連携

- `app/api/trpc/[trpc]/route.ts`: tRPC HTTP ハンドラー
- `src/trpc/client.ts`: `createTRPCClient` (RSC 用)
- `src/trpc/react.tsx`: `createTRPCReact` + `QueryClientProvider` プロバイダー

### Step 4 — `datasets` ルーター実装

- `list`: カーソルページネーション (`createdAt` ベース)、チャート件数を `count()` で付与
- `create`: 無料枠チェック → insert
- `delete`: ownerチェック → delete

### Step 5 — `charts` ルーター実装

- `create` / `update` / `delete`: ownerチェック共通
- `reorder`: `orderedIds` を受け取り、`order` カラムを一括更新

### Step 6 — データセット一覧 UI

- ページ: `app/datasets/page.tsx` (Server Component)
- `HydrateClient` + `prefetch` でサーバーサイドプリフェッチ
- クライアント: `<DatasetList>` で `useSuspenseInfiniteQuery`
- 無限スクロール or「次を読み込む」ボタン

### Step 7 — ダッシュボード保存・復元

- アップロード後: `datasets.create` を呼び出し、返った `datasetId` を Zustand に持たせる
- チャート追加: `charts.create` mutation → Zustand と DB を同期
- ページリロード後: `datasets.getById` で Zustand を復元

### Step 8 — Stripe 連携（将来）

- `stripe` パッケージ + `STRIPE_SECRET_KEY` env
- Checkout Session 作成エンドポイント (`app/api/stripe/checkout/route.ts`)
- Webhook ハンドラー (`app/api/stripe/webhook/route.ts`) で `subscription` テーブルを更新
- better-auth の `subscription` プラグイン採用も検討

---

## 8. 環境変数

```env
DATABASE_URL=          # Neon PostgreSQL 接続文字列
BETTER_AUTH_SECRET=    # better-auth シークレット
BETTER_AUTH_URL=       # アプリの公開 URL
STRIPE_SECRET_KEY=     # Stripe シークレットキー（Step 8 以降）
STRIPE_WEBHOOK_SECRET= # Stripe Webhook シークレット（Step 8 以降）
STRIPE_PRICE_ID=       # 月額プランの Price ID（Step 8 以降）
```
