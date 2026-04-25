# Step 07 — メインページと Dashboard の統合

## 概要

`app/page.tsx` と `components/dashboard/Dashboard.tsx` を実装し、
すべてのコンポーネントを統合する。

- ファイル未アップロード時 → DropZone を全画面表示
- ファイルアップロード済み → ヘッダー + ChartGrid + DataTable を表示

---

## 1. ディレクトリ構成

```
app/
└── page.tsx                        ← Server Component（薄いラッパー）
components/
└── dashboard/
    └── Dashboard.tsx               ← Client Component（状態管理との橋渡し）
```

---

## 2. page.tsx の変更

`app/page.tsx` は Server Component のままにして、
クライアント処理は `Dashboard` コンポーネントに委譲する。

### `app/page.tsx`

```tsx
import { Dashboard } from '@/components/dashboard/Dashboard'

export default function Home() {
  return <Dashboard />
}
```

---

## 3. Dashboard コンポーネント

### `components/dashboard/Dashboard.tsx`

```tsx
'use client'

import { FileX, BarChart2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { useDashboardStore } from '@/lib/store/dashboard'
import { DropZone } from '@/components/upload/DropZone'
import { ChartGrid } from '@/components/charts/ChartGrid'
import { DataTable } from '@/components/table/DataTable'

export function Dashboard() {
  const { fileName, fileType, columns, rows, resetFile } = useDashboardStore()

  // ファイルが未アップロードの場合はアップロード画面を全画面表示
  if (!fileName) {
    return <DropZone />
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* ヘッダー */}
      <header className="sticky top-0 z-20 flex items-center justify-between border-b bg-background/90 backdrop-blur-sm px-6 py-3">
        <div className="flex min-w-0 items-center gap-4">
          <div className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 shrink-0 text-primary" />
            <h1 className="text-base font-semibold">データダッシュボード</h1>
          </div>

          <Separator orientation="vertical" className="h-4" />

          {/* ファイル名 */}
          <span className="max-w-xs truncate rounded-full bg-muted px-3 py-0.5 text-sm text-muted-foreground">
            {fileName}
          </span>

          {/* ファイル種別バッジ */}
          {fileType && (
            <span className="hidden rounded-md border bg-card px-2 py-0.5 text-xs font-medium uppercase tracking-wide text-muted-foreground sm:inline-block">
              {fileType}
            </span>
          )}

          {/* 行数・列数 */}
          <span className="hidden text-sm text-muted-foreground sm:block">
            {rows.length.toLocaleString()} 行 · {columns.length} 列
          </span>
        </div>

        {/* リセットボタン */}
        <Button
          variant="outline"
          size="sm"
          onClick={resetFile}
          className="shrink-0 gap-1.5"
        >
          <FileX className="h-4 w-4" />
          <span className="hidden sm:inline">ファイルをリセット</span>
          <span className="sm:hidden">リセット</span>
        </Button>
      </header>

      {/* メインコンテンツ */}
      <main className="flex flex-1 flex-col gap-10 px-6 py-8">
        {/* チャートセクション */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              グラフ
            </h2>
            <Separator className="flex-1" />
          </div>
          <ChartGrid />
        </section>

        {/* データテーブルセクション */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              データテーブル
            </h2>
            <Separator className="flex-1" />
          </div>
          <DataTable columns={columns} rows={rows} />
        </section>
      </main>
    </div>
  )
}
```

---

## 4. 実装の解説

### Server Component と Client Component の分離

`app/page.tsx` は Server Component のままにしている。
`Dashboard.tsx` に `'use client'` を付与することで、
Zustand（`useDashboardStore`）などのブラウザ専用 API を使える。

Next.js App Router では、Server Component 内に Client Component を
import してレンダリングできる。逆（Client Component 内に Server Component）
は特定の条件を満たさないと動作しない。

```
app/page.tsx          ← Server Component（シンプルなラッパー）
    └── Dashboard.tsx ← Client Component（状態・インタラクション）
        ├── DropZone.tsx     ← Client Component
        ├── ChartGrid.tsx    ← Client Component
        │   ├── ChartCard.tsx
        │   ├── AddChartCard.tsx
        │   └── ChartModal.tsx
        └── DataTable.tsx    ← Client Component
```

### ヘッダーの `sticky top-0 z-20`

スクロールしてもヘッダーが画面上部に固定されるよう `sticky` を使用している。
`bg-background/90 backdrop-blur-sm` で半透明＋ぼかしエフェクトを適用し、
コンテンツが透けて見えるガラス効果を実現している。

### `resetFile` の実装

`resetFile` は Zustand ストアで `initialState` に戻す処理を定義している。
これを呼び出すことで `fileName` が `null` になり、
Dashboard が再び DropZone を表示する条件分岐に入る。
ページ遷移なしで状態だけを切り替えるシンプルな実装。

### レスポンシブ対応

ヘッダーのファイル種別・行数表示は `sm:` ブレークポイント以上で表示し、
モバイルではヘッダーをコンパクトにしている。
ChartGrid は `grid-cols-1 sm:grid-cols-2 xl:grid-cols-3` で
画面幅に応じて列数が変わる。

---

## 5. 完成後の全体フロー確認

### ファイルアップロードの流れ

```
1. ユーザーが DropZone でファイルをドロップ / ボタンクリック
    ↓
2. useFileParser の parseFile() が呼ばれる
    ↓
3. 拡張子判定 → parseExcel() / parseCsv() / parseSvgFile() を実行
    ↓
4. { columns: Column[], rows: Row[] } が返る
    ↓
5. useDashboardStore.setFileData() でストアに格納
    ↓
6. Dashboard が fileName !== null を検知して Dashboard ビューに切り替え
    ↓
7. ChartGrid と DataTable に columns / rows が流れ込む
```

### グラフ追加の流れ

```
1. AddChartCard の「グラフを追加」ボタンをクリック
    ↓
2. ChartGrid の isModalOpen が true になり ChartModal が開く
    ↓
3. ユーザーがタイトル・種別・X軸・Y軸を選択して「グラフを追加」
    ↓
4. useDashboardStore.addChart() が呼ばれ、
   charts 配列と chartOrder 配列に新しいチャートが追加される
    ↓
5. ChartGrid が re-render され、新しい ChartCard が表示される
```

### グラフの並び替えの流れ

```
1. ユーザーが ChartCard の GripVertical アイコンをドラッグ
    ↓
2. DndContext の onDragEnd が発火
    ↓
3. arrayMove() で chartOrder の配列を並び替える
    ↓
4. useDashboardStore.reorderCharts() で新しい順序をストアに格納
    ↓
5. ChartGrid の orderedCharts が更新され、カードの表示順が変わる
```

---

## 6. 実装完了後の動作確認チェックリスト

- [ ] `npm run dev` でエラーなく起動する
- [ ] `.xlsx` ファイルをドラッグ＆ドロップするとテーブルとグリッドが表示される
- [ ] `.xls` ファイルもアップロード可能
- [ ] `.csv` ファイルをアップロードするとテーブルとグリッドが表示される
- [ ] `.svg` ファイルをアップロードすると SVG 要素の属性がテーブル化される
- [ ] 非対応ファイル（.pdf など）をドロップすると赤いボーダーとエラーが表示される
- [ ] 「グラフを追加」ボタンでモーダルが開く
- [ ] タイトル・種別・X軸・Y軸を設定してグラフが追加される
- [ ] 6 種類のグラフ（棒・折れ線・エリア・円・レーダー・散布図）が正しく描画される
- [ ] ChartCard のドラッグハンドルを掴んで並び替えができる
- [ ] ChartCard の削除ボタンでグラフが削除される
- [ ] データテーブルのソートが正常に動作する
- [ ] データテーブルのグローバル検索が機能する
- [ ] ページネーションが正常に動作する
- [ ] ヘッダーの「ファイルをリセット」でアップロード画面に戻る

---

## 7. 将来の拡張ポイント（フェーズ 2 以降）

### drizzle-orm + Neon でのダッシュボード永続化

```typescript
// drizzle スキーマ（参考）
// db/schema.ts
import { pgTable, text, jsonb, timestamp, uuid } from 'drizzle-orm/pg-core'

export const dashboards = pgTable('dashboards', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: text('user_id').notNull(),
  fileName: text('file_name').notNull(),
  fileType: text('file_type').notNull(),
  columns: jsonb('columns').notNull(),
  charts: jsonb('charts').notNull(),
  chartOrder: jsonb('chart_order').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
})
```

### tRPC でのダッシュボード保存 API

```typescript
// server/routers/dashboard.ts（参考）
import { z } from 'zod'
import { protectedProcedure, createTRPCRouter } from '../trpc'

export const dashboardRouter = createTRPCRouter({
  save: protectedProcedure
    .input(
      z.object({
        fileName: z.string(),
        fileType: z.enum(['xlsx', 'xls', 'csv', 'svg']),
        columns: z.array(
          z.object({
            key: z.string(),
            label: z.string(),
            type: z.enum(['string', 'number', 'date', 'boolean']),
          })
        ),
        charts: z.array(
          z.object({
            id: z.string(),
            title: z.string(),
            type: z.enum(['bar', 'line', 'area', 'pie', 'radar', 'scatter']),
            xAxisKey: z.string(),
            yAxisKeys: z.array(z.string()),
          })
        ),
        chartOrder: z.array(z.string()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      // ctx.db は drizzle クライアント
      // ctx.session.user.id は better-auth が提供するユーザー ID
      return ctx.db.insert(dashboards).values({
        userId: ctx.session.user.id,
        ...input,
      })
    }),
})
```

### Dashboard.tsx への保存ボタン追加

```tsx
// 将来追加する保存ボタンのイメージ
import { trpc } from '@/lib/trpc/client'

function SaveButton() {
  const { fileName, fileType, columns, charts, chartOrder } = useDashboardStore()
  const saveMutation = trpc.dashboard.save.useMutation()

  return (
    <Button
      onClick={() =>
        saveMutation.mutate({ fileName, fileType, columns, charts, chartOrder })
      }
      disabled={saveMutation.isPending}
    >
      {saveMutation.isPending ? '保存中...' : 'ダッシュボードを保存'}
    </Button>
  )
}
```
