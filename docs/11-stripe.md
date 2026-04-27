# Step 11 — Stripe サブスクリプション連携

> 作成日: 2026-04-27

---

## 概要

5件を超えるデータセット保存を有料プラン限定にする。
`subscription` テーブル・無料枠チェック・`FREE_TIER_LIMIT` エラーは実装済みのため、
Stripe との接続部分（Checkout / Webhook / Billing Portal）を追加する。

### 完成後のフロー

```
保存ボタン → saveWithCharts → FREE_TIER_LIMIT エラー
  └→ use-save-dashboard が /api/stripe/checkout を呼ぶ
      └→ Stripe Checkout ページへリダイレクト
          ├→ 支払い成功 → Webhook → subscription テーブル更新 → /dashboard へ
          └→ キャンセル → /dashboard へ（何も変わらない）
```

---

## Step 1 — パッケージのインストールと環境変数

```bash
npm install stripe
```

`.env` に追加:

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_ID=price_...        # 月額プランの Price ID
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

`STRIPE_SECRET_KEY` と `STRIPE_PRICE_ID` の取得手順は以下のとおり。

### STRIPE_SECRET_KEY の取得

1. [Stripe ダッシュボード](https://dashboard.stripe.com/) にログイン
2. 左下の **「開発者」** → **「APIキー」** を開く
3. **「シークレットキー」** の「表示」を押してコピー（`sk_test_...`）
4. 本番環境では `sk_live_...` を使用する

### STRIPE_PRICE_ID の取得（月額商品の作成）

1. 左メニューの **「商品カタログ」** → **「商品を追加」** をクリック
2. 以下を入力する

   | 項目 | 入力例 |
   |------|--------|
   | 商品名 | Pro プラン |
   | 料金モデル | 定額料金 |
   | 価格 | 980（円） |
   | 請求期間 | 毎月 |
   | 通貨 | JPY |

3. **「商品を保存」** をクリック
4. 作成した商品の詳細ページを開き、「料金」セクションにある **Price ID** をコピー（`price_...`）

> テスト中は「テストモード」（ダッシュボード右上のトグル）で作成した Price ID を使う。
> 本番リリース時にライブモードで再作成し、環境変数を差し替える。

### STRIPE_WEBHOOK_SECRET の取得

Webhook Secret はローカル開発と本番デプロイで取得方法が異なる。

#### ローカル開発（Stripe CLI）

1. [Stripe CLI](https://docs.stripe.com/stripe-cli) をインストール
   ```bash
   # macOS
   brew install stripe/stripe-cli/stripe

   # Windows（winget）
   winget install Stripe.StripeCLI
   ```
2. Stripe アカウントにログイン
   ```bash
   stripe login
   ```
3. ローカルへの Webhook 転送を開始する
   ```bash
   stripe listen --forward-to localhost:3000/api/stripe/webhook
   ```
4. 起動時にターミナルに表示される `whsec_...` をコピーして `.env` の `STRIPE_WEBHOOK_SECRET` に設定する
   ```
   > Ready! You are using Stripe API Version [...].
   > Your webhook signing secret is whsec_xxxxxxxxxxxxxxxx (^C to quit)
   ```
5. このプロセスを起動したまま開発する（停止すると Webhook が届かなくなる）

#### 本番デプロイ（Stripe ダッシュボード）

1. 左下の **「開発者」** → **「Webhook」** を開く
2. **「エンドポイントを追加」** をクリック
3. 以下を入力する

   | 項目 | 入力値 |
   |------|--------|
   | エンドポイント URL | `https://your-domain.com/api/stripe/webhook` |
   | リッスンするイベント | `checkout.session.completed` / `customer.subscription.updated` / `customer.subscription.deleted` / `invoice.payment_failed` |

4. **「エンドポイントを追加」** で保存
5. 作成したエンドポイントの詳細ページを開き、**「署名シークレット」** の「表示」を押してコピー（`whsec_...`）
6. 本番環境の環境変数に設定する

---

## Step 2 — Stripe クライアントのシングルトン

### ファイル: `lib/stripe.ts`

```ts
import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2025-03-31.basil',
})
```

---

## Step 3 — Checkout Session エンドポイント

### ファイル: `app/api/stripe/checkout/route.ts`

```ts
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { db } from '@/src/db'
import { subscription } from '@/src/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function POST() {
  const session = await auth.api.getSession({ headers: await headers() })
  if (!session?.user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const user = session.user
  const appUrl = process.env.NEXT_PUBLIC_APP_URL!

  // 既存の Stripe Customer ID を取得（なければ新規作成して保存）
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

    // stripeCustomerId だけ先に保存しておく（webhook 到達前の紐付けのため）
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
    line_items: [
      {
        price: process.env.STRIPE_PRICE_ID!,
        quantity: 1,
      },
    ],
    success_url: `${appUrl}/dashboard?upgraded=1`,
    cancel_url: `${appUrl}/dashboard`,
    metadata: { userId: user.id },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
```

---

## Step 4 — Webhook ハンドラー

### ファイル: `app/api/stripe/webhook/route.ts`

処理するイベント:

| イベント | 処理 |
|---------|------|
| `checkout.session.completed` | subscription を `active` または `trialing` に更新 |
| `customer.subscription.updated` | status / priceId / currentPeriodEnd を更新 |
| `customer.subscription.deleted` | status を `canceled` に更新 |
| `invoice.payment_failed` | status を `past_due` に更新 |

```ts
import { NextRequest, NextResponse } from 'next/server'
import Stripe from 'stripe'
import { stripe } from '@/lib/stripe'
import { db } from '@/src/db'
import { subscription } from '@/src/db/schema'
import { eq } from 'drizzle-orm'
import { nanoid } from 'nanoid'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const sig = req.headers.get('stripe-signature')!

  let event: Stripe.Event
  try {
    event = stripe.webhooks.constructEvent(
      body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET!,
    )
  } catch {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  switch (event.type) {
    case 'checkout.session.completed': {
      const session = event.data.object as Stripe.Checkout.Session
      if (session.mode !== 'subscription') break

      const stripeSubscription = await stripe.subscriptions.retrieve(
        session.subscription as string,
      )
      const userId = session.metadata?.userId
      if (!userId) break

      await db
        .insert(subscription)
        .values({
          id: nanoid(),
          userId,
          stripeCustomerId: session.customer as string,
          stripeSubscriptionId: stripeSubscription.id,
          stripePriceId: stripeSubscription.items.data[0].price.id,
          status: stripeSubscription.status as typeof subscription.$inferInsert['status'],
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        })
        .onConflictDoUpdate({
          target: subscription.userId,
          set: {
            stripeCustomerId: session.customer as string,
            stripeSubscriptionId: stripeSubscription.id,
            stripePriceId: stripeSubscription.items.data[0].price.id,
            status: stripeSubscription.status as typeof subscription.$inferInsert['status'],
            currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
          },
        })
      break
    }

    case 'customer.subscription.updated':
    case 'customer.subscription.deleted': {
      const stripeSubscription = event.data.object as Stripe.Subscription
      await db
        .update(subscription)
        .set({
          status: stripeSubscription.status as typeof subscription.$inferInsert['status'],
          stripePriceId: stripeSubscription.items.data[0].price.id,
          currentPeriodEnd: new Date(stripeSubscription.current_period_end * 1000),
        })
        .where(eq(subscription.stripeSubscriptionId, stripeSubscription.id))
      break
    }

    case 'invoice.payment_failed': {
      const invoice = event.data.object as Stripe.Invoice
      const subId = invoice.subscription as string | null
      if (!subId) break
      await db
        .update(subscription)
        .set({ status: 'past_due' })
        .where(eq(subscription.stripeSubscriptionId, subId))
      break
    }
  }

  return NextResponse.json({ received: true })
}
```

---

## Step 5 — tRPC subscription ルーター

### ファイル: `trpc/routers/subscription.ts`

```ts
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
```

### `trpc/routers/_app.ts` に追加

```ts
import { subscriptionRouter } from './subscription'

export const appRouter = createTRPCRouter({
  datasets: datasetsRouter,
  charts: chartsRouter,
  subscription: subscriptionRouter,   // ← 追加
})
```

---

## Step 6 — Billing Portal エンドポイント（契約管理）

### ファイル: `app/api/stripe/portal/route.ts`

既存サブスクライバーが請求履歴の確認・プラン変更・解約をできるようにする。

```ts
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { db } from '@/src/db'
import { subscription } from '@/src/db/schema'
import { eq } from 'drizzle-orm'

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
```

---

## Step 7 — クライアント側の更新

### 7-1. `hooks/use-checkout.ts` を新規作成

```ts
'use client'

import { useRouter } from 'next/navigation'
import { toast } from 'sonner'

export function useCheckout() {
  const router = useRouter()

  async function redirectToCheckout() {
    const res = await fetch('/api/stripe/checkout', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      router.push(data.url)
    } else {
      toast.error('チェックアウトの開始に失敗しました')
    }
  }

  async function redirectToPortal() {
    const res = await fetch('/api/stripe/portal', { method: 'POST' })
    const data = await res.json()
    if (data.url) {
      router.push(data.url)
    } else {
      toast.error('ポータルの開始に失敗しました')
    }
  }

  return { redirectToCheckout, redirectToPortal }
}
```

### 7-2. `hooks/use-save-dashboard.ts` の `onError` を更新

現在 `toast.error` のみ表示しているのを、Checkout リダイレクトに変更する。

```ts
// use-save-dashboard.ts の onError
import { useCheckout } from '@/hooks/use-checkout'

const { redirectToCheckout } = useCheckout()

onError: (err) => {
  if (err.message === 'FREE_TIER_LIMIT') {
    toast.error('無料プランの上限（5件）に達しています', {
      description: 'プランをアップグレードすると無制限に作成できます。',
      action: {
        label: 'アップグレード',
        onClick: redirectToCheckout,
      },
    })
  } else {
    toast.error('保存に失敗しました')
  }
},
```

### 7-3. サイドバーにサブスクリプション状態を表示（任意）

`main-sidebar.tsx` または `main-user-menu.tsx` で `trpc.subscription.getStatus` を取得し、
未加入の場合に「プランをアップグレード」ボタン、加入済みの場合に「サブスクリプション管理」を表示する。

---

## Step 8 — ローカルテスト（Stripe CLI）

```bash
# Stripe CLI をインストール済みの場合
stripe listen --forward-to localhost:3000/api/stripe/webhook

# 別ターミナルで支払い成功をシミュレート
stripe trigger checkout.session.completed
```

`STRIPE_WEBHOOK_SECRET` は `stripe listen` 実行時にターミナルに表示される値を使う（`whsec_...`）。

---

## 実装順序

```
Step 1  npm install stripe + .env 追加
Step 2  lib/stripe.ts
Step 3  app/api/stripe/checkout/route.ts
Step 4  app/api/stripe/webhook/route.ts
Step 5  trpc/routers/subscription.ts + _app.ts に追加
Step 6  app/api/stripe/portal/route.ts
Step 7  hooks/use-checkout.ts + use-save-dashboard.ts 更新
Step 8  Stripe CLI でローカルテスト
```
