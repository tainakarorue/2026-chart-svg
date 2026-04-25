# Step 02 — Zustand ストアの定義

## 概要

アプリ全体の状態を管理する Zustand ストアを作成する。
ファイル情報・パース済みデータ・チャート設定を一元管理し、
将来的な tRPC + Neon DB への永続化を見据えた型設計にする。

---

## 1. 型定義

`lib/store/dashboard.ts` にすべての型とストアを定義する。

---

## 2. ファイルの作成

### `lib/store/dashboard.ts`

```typescript
import { create } from 'zustand'

// ---------------------------------------------------------------------------
// 型定義
// ---------------------------------------------------------------------------

/** テーブルカラムのデータ型 */
export type ColumnType = 'string' | 'number' | 'date' | 'boolean'

/** パース済みカラムのメタ情報 */
export interface Column {
  key: string
  label: string
  type: ColumnType
}

/** パース済みの1行分のデータ */
export type Row = Record<string, string | number | boolean | null>

/** 対応するチャートの種別 */
export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'radar' | 'scatter'

/** 1つのチャートの設定 */
export interface ChartConfig {
  id: string
  title: string
  type: ChartType
  xAxisKey: string
  yAxisKeys: string[]
}

/** アップロード済みファイルの種別 */
export type FileType = 'xlsx' | 'xls' | 'svg'

// ---------------------------------------------------------------------------
// ストアの State 定義
// ---------------------------------------------------------------------------

interface DashboardState {
  /** アップロードされたファイル名。null の場合はアップロード画面を表示 */
  fileName: string | null
  /** アップロードされたファイルの種別 */
  fileType: FileType | null
  /** パース済みカラム一覧 */
  columns: Column[]
  /** パース済み行データ一覧 */
  rows: Row[]
  /** 登録済みチャートの設定一覧 */
  charts: ChartConfig[]
  /** dnd-kit で並び替えを管理するための ID 順序リスト */
  chartOrder: string[]
}

// ---------------------------------------------------------------------------
// ストアの Actions 定義
// ---------------------------------------------------------------------------

interface DashboardActions {
  /**
   * ファイルのパース結果をストアに格納する。
   * 既存のチャートはリセットされる。
   */
  setFileData: (params: {
    fileName: string
    fileType: FileType
    columns: Column[]
    rows: Row[]
  }) => void

  /**
   * ストアを初期状態に戻す。
   * アップロード画面に戻す際に使用する。
   */
  resetFile: () => void

  /**
   * 新しいチャートを追加する。
   * id は内部で自動生成する。
   */
  addChart: (config: Omit<ChartConfig, 'id'>) => void

  /**
   * 指定した ID のチャートを削除する。
   */
  removeChart: (id: string) => void

  /**
   * 指定した ID のチャート設定を部分更新する。
   */
  updateChart: (id: string, config: Partial<Omit<ChartConfig, 'id'>>) => void

  /**
   * dnd-kit の dragEnd イベントで取得した新しい ID 順序を反映する。
   */
  reorderCharts: (newOrder: string[]) => void
}

// ---------------------------------------------------------------------------
// ストアの型合成
// ---------------------------------------------------------------------------

type DashboardStore = DashboardState & DashboardActions

// ---------------------------------------------------------------------------
// 初期状態
// ---------------------------------------------------------------------------

const initialState: DashboardState = {
  fileName: null,
  fileType: null,
  columns: [],
  rows: [],
  charts: [],
  chartOrder: [],
}

// ---------------------------------------------------------------------------
// ストアの作成
// ---------------------------------------------------------------------------

export const useDashboardStore = create<DashboardStore>((set) => ({
  ...initialState,

  setFileData: ({ fileName, fileType, columns, rows }) => {
    set({
      fileName,
      fileType,
      columns,
      rows,
      charts: [],
      chartOrder: [],
    })
  },

  resetFile: () => {
    set({ ...initialState })
  },

  addChart: (config) => {
    const id = crypto.randomUUID()
    const newChart: ChartConfig = { ...config, id }
    set((state) => ({
      charts: [...state.charts, newChart],
      chartOrder: [...state.chartOrder, id],
    }))
  },

  removeChart: (id) => {
    set((state) => ({
      charts: state.charts.filter((c) => c.id !== id),
      chartOrder: state.chartOrder.filter((oid) => oid !== id),
    }))
  },

  updateChart: (id, config) => {
    set((state) => ({
      charts: state.charts.map((c) =>
        c.id === id ? { ...c, ...config } : c
      ),
    }))
  },

  reorderCharts: (newOrder) => {
    set({ chartOrder: newOrder })
  },
}))
```

---

## 3. 設計の意図

### `chartOrder` を `charts` と分離している理由

dnd-kit で並び替えを行う場合、`SortableContext` に ID のリストを渡す。
`charts` 配列の順序を直接変更すると ID が変わらないため、
表示順序（`chartOrder`）とデータ（`charts`）を分離している。

実際の並び順でチャートを取得するには以下のようにする。

```typescript
const orderedCharts = chartOrder
  .map((id) => charts.find((c) => c.id === id))
  .filter(Boolean) as ChartConfig[]
```

### `crypto.randomUUID()` を使用している理由

Next.js 16 + React 19 の環境では、外部の UUID ライブラリを使わなくても
ブラウザ組み込みの `crypto.randomUUID()` が利用できる。
`'use client'` コンポーネント内（またはクライアント側のコールバック内）
でのみ実行するため、サーバーサイドとの不整合は発生しない。

### 将来の tRPC 統合

`DashboardState` の型は、将来的に tRPC の入力スキーマ (Zod) に変換しやすい
フラットな構造にしている。DB 保存の際は以下のようなエンドポイントを想定している。

```typescript
// 将来の tRPC ルーター（参考）
dashboardRouter.mutation('save', {
  input: z.object({
    fileName: z.string(),
    fileType: z.enum(['xlsx', 'xls', 'svg']),
    columns: z.array(columnSchema),
    rows: z.array(z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))),
    charts: z.array(chartConfigSchema),
    chartOrder: z.array(z.string()),
  }),
  resolve: async ({ input, ctx }) => {
    // drizzle + Neon への保存処理
  },
})
```

---

## 4. 次のステップへ

Step 02 完了後、Step 03 でファイルパーサーと custom hook の実装に進む。
