# 技術選定・実装計画書

> 作成日: 2026-04-25  
> プロジェクト: next-chart-svg — SVG / Excel ファイルを読み込み、動的データテーブル・グラフを表示するダッシュボード

---

## 1. 技術スタック

### フレームワーク・基盤（導入済み）

| 用途 | ライブラリ | バージョン | 備考 |
|------|-----------|-----------|------|
| フレームワーク | Next.js (App Router) | 16.x | Server Components 対応 |
| UI コンポーネント | shadcn/ui | 4.x | radix-sera スタイル |
| スタイリング | Tailwind CSS v4 | 4.x | CSS 変数ベース |
| 言語 | TypeScript | 5.x | strict モード推奨 |

### 新規追加ライブラリ

#### ファイルアップロード
| 用途 | ライブラリ | 理由 |
|------|-----------|------|
| ドラッグ＆ドロップ | `react-dropzone` | 実績豊富・hooks ベース・shadcn との相性が良い |

#### データ解析
| 用途 | ライブラリ | 理由 |
|------|-----------|------|
| Excel (.xlsx/.xls) 読み込み | `xlsx` (SheetJS) | 業界標準。ブラウザ完結で動作 |
| SVG 解析 | `svgson` | SVG を JSON に変換。軽量 |

#### グラフ・チャート
| 用途 | ライブラリ | 理由 |
|------|-----------|------|
| チャートレンダリング | `recharts` | shadcn/ui Chart が内部で使用。エコシステム統一 |
| shadcn chart wrapper | shadcn `chart` コンポーネント | Recharts を shadcn デザインシステムでラップ済み |

#### ドラッグ＆ドロップ（チャート並び替え）
| 用途 | ライブラリ | 理由 |
|------|-----------|------|
| チャートの並び替え | `@dnd-kit/core` + `@dnd-kit/sortable` | 軽量・アクセシビリティ対応・React 19 対応 |

#### 状態管理
| 用途 | ライブラリ | 理由 |
|------|-----------|------|
| グローバル状態 | `zustand` | 軽量・シンプル・tRPC / Server Actions との親和性高い |

#### データテーブル
| 用途 | ライブラリ | 理由 |
|------|-----------|------|
| テーブル | shadcn `data-table` (TanStack Table v8) | ソート・フィルター・ページネーション込み |

#### ユーティリティ
| 用途 | ライブラリ | 理由 |
|------|-----------|------|
| 日付処理 | `date-fns` | 軽量。将来の集計機能に備える |

---

### 将来拡張（フェーズ 2 以降）

| 用途 | ライブラリ | 備考 |
|------|-----------|------|
| DB ORM | `drizzle-orm` | 型安全・軽量 |
| DB ホスティング | Neon (PostgreSQL) | サーバーレス PostgreSQL |
| 認証 | `better-auth` | Next.js App Router 対応 |
| API レイヤー | `tRPC` v11 | フルスタック型安全 API |

---

## 2. アーキテクチャ設計

### ディレクトリ構成

```
next-chart-svg/
├── app/
│   ├── layout.tsx           # ルートレイアウト
│   ├── page.tsx             # メインページ（ファイルなし → アップロード画面）
│   └── globals.css
├── components/
│   ├── ui/                  # shadcn コンポーネント（自動生成）
│   ├── upload/
│   │   └── DropZone.tsx     # ファイルアップロードゾーン
│   ├── charts/
│   │   ├── ChartGrid.tsx    # グラフ一覧グリッド（dnd-kit ソート対応）
│   │   ├── ChartCard.tsx    # 個別グラフカード（shadcn Card）
│   │   ├── AddChartCard.tsx # グラフ追加ボタン（Card型）
│   │   └── ChartModal.tsx   # グラフ作成モーダル
│   ├── table/
│   │   └── DataTable.tsx    # データテーブル（shadcn DataTable）
│   └── dashboard/
│       └── Dashboard.tsx    # アップロード後のメインビュー
├── lib/
│   ├── parsers/
│   │   ├── excel.ts         # xlsx 解析ロジック
│   │   └── svg.ts           # SVG 解析ロジック
│   ├── store/
│   │   └── dashboard.ts     # Zustand ストア定義
│   └── utils.ts             # shadcn utils（既存）
├── hooks/
│   └── useFileParser.ts     # ファイル解析 custom hook
└── docs/
    └── tech-stack-and-plan.md
```

### 状態管理（Zustand ストア設計）

```typescript
// lib/store/dashboard.ts の構造イメージ
interface DashboardStore {
  // ファイル情報
  fileName: string | null;
  fileType: 'xlsx' | 'svg' | null;

  // パース済みデータ
  columns: Column[];
  rows: Row[];

  // チャート設定（将来的に DB 保存対象）
  charts: ChartConfig[];
  chartOrder: string[]; // dnd-kit 用 ID リスト

  // アクション
  setFile: (file: File) => void;
  addChart: (config: ChartConfig) => void;
  removeChart: (id: string) => void;
  reorderCharts: (newOrder: string[]) => void;
}
```

---

## 3. 画面設計

### 状態 A: ファイル未アップロード

```
┌─────────────────────────────────────────────────┐
│                                                 │
│           ファイルをドロップ / 選択              │
│         (.xlsx, .xls, .svg に対応)              │
│                                                 │
│         [📁 ファイルを選択] ボタン              │
│                                                 │
└─────────────────────────────────────────────────┘
```

- 画面全体が DropZone
- ドラッグ中はボーダー・背景色を変化させる（react-dropzone の active state）

### 状態 B: ファイルアップロード済み

```
┌──────────────────────────────────────────────────┐
│ ヘッダー: ファイル名 / リセットボタン            │
├──────┬──────┬──────┬──────────────────────────── │
│ 棒グ │ 折れ │ 円グ │ [+ グラフ追加]              │
│ ラフ │ 線   │ ラフ │                             │
│(Card)│(Card)│(Card)│           (Card)            │
├──────┴──────┴──────┴──────────────────────────── │
│                                                  │
│  データテーブル（shadcn DataTable）               │
│  ソート / フィルター / ページネーション対応       │
│                                                  │
└──────────────────────────────────────────────────┘
```

### グラフ追加モーダル

1. X 軸・Y 軸のカラム選択（Select）
2. グラフ種別選択（Bar / Line / Area / Pie / Radar / Scatter）
3. グラフタイトル入力
4. プレビュー（オプション）
5. 追加ボタン

---

## 4. 実装フェーズ

### フェーズ 1: 基盤構築（今回の実装対象）

#### Step 1 — ライブラリインストール

```bash
npm install react-dropzone xlsx svgson recharts @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities zustand
```

shadcn コンポーネント追加:
```bash
npx shadcn@latest add card dialog select table badge button input label separator scroll-area
npx shadcn@latest add chart
```

#### Step 2 — Zustand ストア作成

- `lib/store/dashboard.ts`
- ファイル情報・パース済みデータ・チャート設定を管理

#### Step 3 — ファイルパーサー実装

- `lib/parsers/excel.ts` — SheetJS で .xlsx → `{columns, rows}` 変換
- `lib/parsers/svg.ts` — svgson で SVG → データ抽出
- `hooks/useFileParser.ts` — DropZone からのファイルをパースして store に格納

#### Step 4 — DropZone コンポーネント

- react-dropzone ベース
- shadcn Card / Border スタイリング
- ドラッグ中の視覚フィードバック
- ファイルタイプバリデーション (.xlsx, .xls, .svg)

#### Step 5 — データテーブル

- shadcn DataTable (TanStack Table v8)
- カラム自動生成（パース済みデータから）
- ソート・検索フィルター

#### Step 6 — チャートグリッド + モーダル

- `ChartGrid.tsx` — @dnd-kit/sortable で並び替え対応グリッド
- `ChartCard.tsx` — recharts + shadcn Chart wrapper
- `AddChartCard.tsx` — グラフ追加トリガー
- `ChartModal.tsx` — shadcn Dialog で実装
  - カラム選択（Select）
  - チャート種別選択
  - 追加ロジック

#### Step 7 — メインページ統合

- ファイル未アップロード → DropZone 全画面
- アップロード済み → Dashboard レイアウト

### フェーズ 2: バックエンド統合（将来）

- Neon PostgreSQL セットアップ
- drizzle-orm スキーマ定義（dashboards, charts テーブル）
- better-auth 認証実装
- tRPC ルーター（ダッシュボード保存・取得 API）
- チャート設定の永続化

---

## 5. 対応グラフ種別（フェーズ 1）

| 種別 | recharts コンポーネント | shadcn chart 対応 |
|------|----------------------|------------------|
| 棒グラフ | `BarChart` | ✅ |
| 折れ線グラフ | `LineChart` | ✅ |
| エリアグラフ | `AreaChart` | ✅ |
| 円グラフ | `PieChart` | ✅ |
| レーダーチャート | `RadarChart` | ✅ |
| 散布図 | `ScatterChart` | ✅ |

---

## 6. データフロー

```
ファイル選択 / ドロップ
    ↓
useFileParser (hook)
    ↓
lib/parsers/excel.ts または lib/parsers/svg.ts
    ↓
{ columns: Column[], rows: Row[] }
    ↓
Zustand store (dashboard.ts)
    ↓
┌──────────────────────┬──────────────────────┐
│ ChartGrid            │ DataTable            │
│ (recharts + dnd-kit) │ (TanStack Table)     │
└──────────────────────┴──────────────────────┘
```

---

## 7. 注意事項・制約

- **Next.js 16 / React 19**: Server Components のデフォルト。クライアント処理（DropZone, Zustand, recharts, dnd-kit）は `'use client'` ディレクティブが必須
- **xlsx はブラウザ完結**: ファイル解析はすべてクライアントサイドで実行（サーバーへのアップロード不要）
- **SVG 対応スコープ**: SVG 内の `<rect>`, `<circle>`, `<path>` の属性値をテーブルデータとして抽出する想定。チャートデータとしての活用は SVG の構造に依存
- **型安全**: Column / Row の型定義を `lib/store/dashboard.ts` で厳密に管理し、将来の tRPC スキーマに流用
