# Step 10 — テーブルエクスポート & フィルター連動グラフ

> 作成日: 2026-04-27

---

## 概要

以下の 3 機能を追加する。

| # | 機能 | 補足 |
|---|------|------|
| A | テーブルの全データを CSV / Excel でエクスポート | 元データ（フィルター・ソートなし）|
| B | テーブルのフィルター・ソート済みデータからグラフを生成 | DataTable ↔ ChartGrid を連動 |
| C | フィルター・ソート済みデータを CSV / Excel でエクスポート | A と同じボタンを流用、状態依存 |

---

## 前提

- `xlsx` パッケージは既にインストール済み
- `DataTable` は `components/table/data-table.tsx`（TanStack Table v8）
- `ChartGrid` は `components/charts/chart-grid.tsx`（Recharts）
- `ChartUploadView` が両コンポーネントの親（`components/features/charts/views/chart-upload-view.tsx`）
- `Row` 型は `lib/store/dashboard.ts` で定義済み

---

## Step 1 — エクスポートユーティリティの作成

### ファイル: `lib/export.ts`

```ts
import * as XLSX from 'xlsx'
import type { Column, Row } from '@/lib/store/dashboard'

/**
 * rows を CSV 文字列に変換してダウンロードする。
 * columns の順序でヘッダーを出力する。
 */
export function exportToCsv(
  rows: Row[],
  columns: Column[],
  fileName: string,
): void {
  const header = columns.map((c) => c.label)
  const data = rows.map((row) => columns.map((c) => row[c.key] ?? ''))

  const ws = XLSX.utils.aoa_to_sheet([header, ...data])
  const csv = XLSX.utils.sheet_to_csv(ws)

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `${fileName}.csv`)
}

/**
 * rows を Excel (.xlsx) ファイルに変換してダウンロードする。
 */
export function exportToExcel(
  rows: Row[],
  columns: Column[],
  fileName: string,
): void {
  const header = columns.map((c) => c.label)
  const data = rows.map((row) => columns.map((c) => row[c.key] ?? ''))

  const ws = XLSX.utils.aoa_to_sheet([header, ...data])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
```

**ポイント**
- CSV は BOM (`﻿`) を先頭に付与することで Excel が UTF-8 を正しく認識する
- `aoa_to_sheet`（array of arrays）を使い、`columns` の順序を保証する

---

## Step 2 — DataTable の拡張

### 変更ファイル: `components/table/data-table.tsx`

#### 2-1. Props に 2 つ追加

```ts
interface DataTableProps {
  columns: Column[]
  rows: Row[]
  fileName?: string                               // エクスポート時のファイル名
  onFilteredRowsChange?: (rows: Row[]) => void    // フィルター・ソート済み行を親に通知
}
```

#### 2-2. フィルター・ソート済み行を取得してコールバックを呼ぶ

TanStack Table v8 の行モデルパイプライン:

```
getCoreRowModel → getFilteredRowModel → getSortedRowModel → getPaginationRowModel
```

エクスポートと連動グラフには **ページネーション前の全行** が必要なので
`table.getSortedRowModel().rows` を使う。

```tsx
// DataTable コンポーネント内
const sortedRows = table.getSortedRowModel().rows

// フィルター・ソートが変わるたびに親へ通知
useEffect(() => {
  onFilteredRowsChange?.(sortedRows.map((r) => r.original))
}, [sortedRows, onFilteredRowsChange])
```

#### 2-3. ツールバーにエクスポートボタンを追加

```tsx
import { Download } from 'lucide-react'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { exportToCsv, exportToExcel } from '@/lib/export'

// ツールバー内（検索 Input の右側）
const exportRows = sortedRows.map((r) => r.original)
const baseName = fileName ?? 'export'

<DropdownMenu>
  <DropdownMenuTrigger asChild>
    <Button variant="outline" size="sm" className="gap-1.5">
      <Download className="h-4 w-4" />
      エクスポート
    </Button>
  </DropdownMenuTrigger>
  <DropdownMenuContent align="end">
    <DropdownMenuItem onClick={() => exportToCsv(exportRows, columns, baseName)}>
      CSV でダウンロード
    </DropdownMenuItem>
    <DropdownMenuItem onClick={() => exportToExcel(exportRows, columns, baseName)}>
      Excel でダウンロード
    </DropdownMenuItem>
  </DropdownMenuContent>
</DropdownMenu>
```

**ポイント**
- フィルター・ソートを適用した `sortedRows` を使うため、
  検索や並び替えをした後にエクスポートすれば **フィルター済みデータが出力される**（機能 A と C を同一ボタンで実現）
- フィルターなしで全件欲しい場合は検索をクリアしてからエクスポートする
  → UI を複雑にせず直感的

---

## Step 3 — ChartGrid の拡張

### 変更ファイル: `components/charts/chart-grid.tsx`

#### Props に `rows` を追加

```tsx
interface ChartGridProps {
  rows?: Row[]   // 省略時は Zustand store の rows を使用
}

export function ChartGrid({ rows: rowsProp }: ChartGridProps) {
  const storeRows = useDashboardStore((s) => s.rows)
  const rows = rowsProp ?? storeRows
  // 以降は rows を使ってグラフを描画する（既存ロジックと同じ）
}
```

**ポイント**
- `rowsProp` が `undefined` のときは既存の動作を維持するため後方互換性あり
- ChartRenderer / 集計ロジックには手を加えない

---

## Step 4 — ChartUploadView の更新

### 変更ファイル: `components/features/charts/views/chart-upload-view.tsx`

#### 4-1. ローカル state を追加

```tsx
const [filteredRows, setFilteredRows] = useState<Row[] | null>(null)
const [syncChart, setSyncChart] = useState(false)
```

- `filteredRows`: DataTable から通知された最新のフィルター・ソート済み行
- `syncChart`: グラフ連動トグル（false = 全データ使用）

#### 4-2. DataTable に props を渡す

```tsx
<DataTable
  columns={columns}
  rows={rows}
  fileName={fileName ?? 'export'}
  onFilteredRowsChange={setFilteredRows}
/>
```

#### 4-3. グラフセクションにトグルを追加

```tsx
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'

// グラフセクションのヘッダー
<div className="mb-4 flex items-center gap-2">
  <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
    グラフ
  </h2>
  <Separator className="flex-1" />
  <ToggleGroup
    type="single"
    value={syncChart ? 'filtered' : 'all'}
    onValueChange={(v) => setSyncChart(v === 'filtered')}
    size="sm"
  >
    <ToggleGroupItem value="all">全データ</ToggleGroupItem>
    <ToggleGroupItem value="filtered">フィルター済み</ToggleGroupItem>
  </ToggleGroup>
</div>

<ChartGrid rows={syncChart && filteredRows ? filteredRows : undefined} />
```

**ポイント**
- `syncChart` が false（デフォルト）のときは `ChartGrid` に `rows` を渡さないため既存の動作を維持
- `filteredRows` が null（DataTable 未レンダリング時）は全データにフォールバック

---

## 実装順序

```
Step 1 → lib/export.ts を作成
Step 2 → data-table.tsx を拡張（Props 追加 → useEffect → エクスポートボタン）
Step 3 → chart-grid.tsx を拡張（rows prop 追加）
Step 4 → chart-upload-view.tsx を更新（state 追加 → トグル追加 → props 渡し）
```

各 Step は独立しているため、1 ファイルずつコミットして動作確認しながら進める。

---

## 完成後の動作フロー

```
ユーザーがテーブルで検索・ソート
  └→ DataTable の onFilteredRowsChange が発火
      └→ ChartUploadView の filteredRows state が更新
          ├→ [エクスポート] ドロップダウンを押す
          │    └→ フィルター・ソート済みデータが CSV / Excel で出力される
          └→ [フィルター済み] トグルを ON にする
               └→ ChartGrid にフィルター済み rows が渡され、グラフが即時更新される
```
