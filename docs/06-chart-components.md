# Step 06 — チャートコンポーネント群

## 概要

チャートの表示・並び替え・追加に関わるコンポーネントを実装する。
構成は以下の 5 ファイル。

| ファイル | 役割 |
|---------|------|
| `ChartRenderer.tsx` | recharts + shadcn chart で実際のグラフを描画 |
| `ChartCard.tsx` | dnd-kit の sortable 機能を持つグラフカード |
| `AddChartCard.tsx` | グラフ追加ボタン（カード型） |
| `ChartModal.tsx` | グラフ設定モーダル（shadcn Dialog） |
| `ChartGrid.tsx` | カード一覧を管理する DnD コンテナ |

---

## 1. ディレクトリ構成

```
components/
└── charts/
    ├── ChartRenderer.tsx
    ├── ChartCard.tsx
    ├── AddChartCard.tsx
    ├── ChartModal.tsx
    └── ChartGrid.tsx
```

---

## 2. ChartRenderer — グラフ描画エンジン

### `components/charts/ChartRenderer.tsx`

```tsx
'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig as ShadcnChartConfig,
} from '@/components/ui/chart'
import type { ChartConfig, Row } from '@/lib/store/dashboard'

interface ChartRendererProps {
  chart: ChartConfig
  rows: Row[]
}

/**
 * shadcn chart（recharts）の色変数。
 * globals.css の --chart-1 〜 --chart-5 にマッピングされている。
 */
const CHART_COLORS = [
  'hsl(var(--chart-1))',
  'hsl(var(--chart-2))',
  'hsl(var(--chart-3))',
  'hsl(var(--chart-4))',
  'hsl(var(--chart-5))',
]

/**
 * ChartConfig（ストア定義）と shadcn の ChartConfig（色・ラベル設定）は別物。
 * この関数で shadcn 用の設定オブジェクトを生成する。
 */
function buildShadcnConfig(yAxisKeys: string[]): ShadcnChartConfig {
  return Object.fromEntries(
    yAxisKeys.map((key, index) => [
      key,
      {
        label: key,
        color: CHART_COLORS[index % CHART_COLORS.length],
      },
    ])
  )
}

/**
 * rows から recharts が受け取れる形式のデータ配列を生成する。
 * X軸のキーとY軸のキーのみを含む。
 */
function buildChartData(
  rows: Row[],
  xAxisKey: string,
  yAxisKeys: string[]
): Record<string, unknown>[] {
  return rows.map((row) => {
    const entry: Record<string, unknown> = {
      [xAxisKey]: row[xAxisKey],
    }
    for (const key of yAxisKeys) {
      entry[key] = row[key]
    }
    return entry
  })
}

export function ChartRenderer({ chart, rows }: ChartRendererProps) {
  const { type, xAxisKey, yAxisKeys } = chart
  const shadcnConfig = buildShadcnConfig(yAxisKeys)
  const data = buildChartData(rows, xAxisKey, yAxisKeys)

  // ----------------------------------------
  // 棒グラフ
  // ----------------------------------------
  if (type === 'bar') {
    return (
      <ChartContainer config={shadcnConfig} className="h-64 w-full">
        <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {yAxisKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ChartContainer>
    )
  }

  // ----------------------------------------
  // 折れ線グラフ
  // ----------------------------------------
  if (type === 'line') {
    return (
      <ChartContainer config={shadcnConfig} className="h-64 w-full">
        <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {yAxisKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ChartContainer>
    )
  }

  // ----------------------------------------
  // エリアグラフ
  // ----------------------------------------
  if (type === 'area') {
    return (
      <ChartContainer config={shadcnConfig} className="h-64 w-full">
        <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
          <XAxis
            dataKey={xAxisKey}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {yAxisKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              fillOpacity={0.15}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    )
  }

  // ----------------------------------------
  // 円グラフ（Y軸の先頭キーのみ使用）
  // ----------------------------------------
  if (type === 'pie') {
    const pieData = data.map((row) => ({
      name: String(row[xAxisKey] ?? ''),
      value: Number(row[yAxisKeys[0]] ?? 0),
    }))

    return (
      <ChartContainer config={shadcnConfig} className="h-64 w-full">
        <PieChart margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={80}
            paddingAngle={2}
          >
            {pieData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent />} />
        </PieChart>
      </ChartContainer>
    )
  }

  // ----------------------------------------
  // レーダーチャート
  // ----------------------------------------
  if (type === 'radar') {
    return (
      <ChartContainer config={shadcnConfig} className="h-64 w-full">
        <RadarChart
          data={data}
          cx="50%"
          cy="50%"
          outerRadius="70%"
          margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
        >
          <PolarGrid className="stroke-border" />
          <PolarAngleAxis dataKey={xAxisKey} tick={{ fontSize: 11 }} />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {yAxisKeys.map((key, index) => (
            <Radar
              key={key}
              dataKey={key}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              fill={CHART_COLORS[index % CHART_COLORS.length]}
              fillOpacity={0.25}
            />
          ))}
        </RadarChart>
      </ChartContainer>
    )
  }

  // ----------------------------------------
  // 散布図（X軸と Y軸の先頭キーを使用）
  // ----------------------------------------
  if (type === 'scatter') {
    const scatterData = data.map((row) => ({
      x: Number(row[xAxisKey] ?? 0),
      y: Number(row[yAxisKeys[0]] ?? 0),
    }))

    const scatterConfig: ShadcnChartConfig = {
      scatter: {
        label: `${xAxisKey} / ${yAxisKeys[0]}`,
        color: CHART_COLORS[0],
      },
    }

    return (
      <ChartContainer config={scatterConfig} className="h-64 w-full">
        <ScatterChart margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis
            type="number"
            dataKey="x"
            name={xAxisKey}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            label={{ value: xAxisKey, position: 'insideBottom', offset: -4, fontSize: 11 }}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={yAxisKeys[0]}
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <ChartTooltip
            content={<ChartTooltipContent />}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Scatter data={scatterData} fill={CHART_COLORS[0]} fillOpacity={0.7} />
        </ScatterChart>
      </ChartContainer>
    )
  }

  return null
}
```

---

## 3. ChartCard — ドラッグ可能なグラフカード

### `components/charts/ChartCard.tsx`

```tsx
'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { GripVertical, Trash2 } from 'lucide-react'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/lib/store/dashboard'
import { ChartRenderer } from './ChartRenderer'
import type { ChartConfig } from '@/lib/store/dashboard'

interface ChartCardProps {
  chart: ChartConfig
}

export function ChartCard({ chart }: ChartCardProps) {
  const removeChart = useDashboardStore((state) => state.removeChart)
  const rows = useDashboardStore((state) => state.rows)

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: chart.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        'relative overflow-hidden transition-shadow',
        isDragging && 'shadow-xl ring-2 ring-primary/30 opacity-80',
      )}
    >
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        {/* ドラッグハンドル + タイトル */}
        <div className="flex min-w-0 items-center gap-2">
          <button
            {...attributes}
            {...listeners}
            className={cn(
              'shrink-0 cursor-grab touch-none rounded p-0.5',
              'text-muted-foreground/50 hover:text-muted-foreground',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              'active:cursor-grabbing',
            )}
            aria-label="グラフを移動"
          >
            <GripVertical className="h-4 w-4" />
          </button>
          <CardTitle className="truncate text-sm font-medium">
            {chart.title}
          </CardTitle>
        </div>

        {/* 削除ボタン */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground/50 hover:text-destructive"
          onClick={() => removeChart(chart.id)}
          aria-label={`${chart.title} を削除`}
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </CardHeader>

      <CardContent className="px-4 pb-4 pt-0">
        <ChartRenderer chart={chart} rows={rows} />
      </CardContent>
    </Card>
  )
}
```

---

## 4. AddChartCard — グラフ追加ボタン

### `components/charts/AddChartCard.tsx`

```tsx
'use client'

import { Plus } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface AddChartCardProps {
  onAdd: () => void
}

export function AddChartCard({ onAdd }: AddChartCardProps) {
  return (
    <button
      type="button"
      onClick={onAdd}
      className={cn(
        'group flex min-h-[260px] w-full flex-col items-center justify-center gap-3',
        'rounded-xl border-2 border-dashed border-border',
        'bg-card transition-all duration-200',
        'hover:border-primary/50 hover:bg-primary/5',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
      )}
      aria-label="グラフを追加"
    >
      <div
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-full',
          'border-2 border-dashed border-muted-foreground/30',
          'text-muted-foreground/50 transition-colors',
          'group-hover:border-primary/40 group-hover:text-primary',
        )}
      >
        <Plus className="h-5 w-5" />
      </div>
      <span
        className={cn(
          'text-sm font-medium text-muted-foreground/70 transition-colors',
          'group-hover:text-primary',
        )}
      >
        グラフを追加
      </span>
    </button>
  )
}
```

---

## 5. ChartModal — グラフ作成モーダル

### `components/charts/ChartModal.tsx`

```tsx
'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { X } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/lib/store/dashboard'
import type { ChartType } from '@/lib/store/dashboard'

/** グラフ種別の選択肢 */
const CHART_TYPE_OPTIONS: {
  value: ChartType
  label: string
  description: string
}[] = [
  { value: 'bar', label: '棒グラフ', description: 'カテゴリ間の比較' },
  { value: 'line', label: '折れ線グラフ', description: '時系列の変化' },
  { value: 'area', label: 'エリアグラフ', description: '量の推移・合計' },
  { value: 'pie', label: '円グラフ', description: '割合の比較' },
  { value: 'radar', label: 'レーダー', description: '多変数の比較' },
  { value: 'scatter', label: '散布図', description: '2変数の相関' },
]

interface ChartModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ChartModal({ open, onOpenChange }: ChartModalProps) {
  const { columns, addChart } = useDashboardStore()

  const [title, setTitle] = useState('')
  const [chartType, setChartType] = useState<ChartType>('bar')
  const [xAxisKey, setXAxisKey] = useState<string>('')
  const [yAxisKeys, setYAxisKeys] = useState<string[]>([])

  /** 数値カラムのみ Y 軸候補として使用する */
  const numericColumns = columns.filter((col) => col.type === 'number')

  /** Y 軸に追加する（重複は無視） */
  function handleAddYAxisKey(key: string) {
    if (!yAxisKeys.includes(key)) {
      setYAxisKeys((prev) => [...prev, key])
    }
  }

  /** Y 軸から削除する */
  function handleRemoveYAxisKey(key: string) {
    setYAxisKeys((prev) => prev.filter((k) => k !== key))
  }

  /** グラフを追加してモーダルを閉じる */
  function handleSubmit() {
    if (!isValid) return
    addChart({ title: title.trim(), type: chartType, xAxisKey, yAxisKeys })
    handleClose()
  }

  /** フォームをリセットしてモーダルを閉じる */
  function handleClose() {
    setTitle('')
    setChartType('bar')
    setXAxisKey('')
    setYAxisKeys([])
    onOpenChange(false)
  }

  const isValid =
    title.trim().length > 0 && xAxisKey !== '' && yAxisKeys.length > 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>グラフを追加</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col gap-5 py-1">
          {/* グラフタイトル */}
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="chart-title">グラフタイトル</Label>
            <Input
              id="chart-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="例: 月別売上推移"
              autoComplete="off"
            />
          </div>

          {/* グラフ種別 */}
          <div className="flex flex-col gap-1.5">
            <Label>グラフ種別</Label>
            <div className="grid grid-cols-3 gap-2">
              {CHART_TYPE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setChartType(opt.value)}
                  className={cn(
                    'flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    chartType === opt.value
                      ? 'border-primary bg-primary/8 text-foreground'
                      : 'border-border hover:border-primary/40 hover:bg-muted/30 text-foreground',
                  )}
                >
                  <span className="text-sm font-medium">{opt.label}</span>
                  <span className="text-xs text-muted-foreground">
                    {opt.description}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* X 軸（カテゴリ）*/}
          <div className="flex flex-col gap-1.5">
            <Label>
              X 軸{' '}
              <span className="text-xs text-muted-foreground font-normal">
                （カテゴリ・ラベルとして使用するカラム）
              </span>
            </Label>
            <Select value={xAxisKey} onValueChange={setXAxisKey}>
              <SelectTrigger>
                <SelectValue placeholder="カラムを選択" />
              </SelectTrigger>
              <SelectContent>
                {columns.map((col) => (
                  <SelectItem key={col.key} value={col.key}>
                    <span>{col.label}</span>
                    <span className="ml-2 text-xs text-muted-foreground">
                      {col.type}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Y 軸（値）*/}
          <div className="flex flex-col gap-1.5">
            <Label>
              Y 軸{' '}
              <span className="text-xs text-muted-foreground font-normal">
                （数値カラムを選択・複数可）
              </span>
            </Label>
            <Select
              onValueChange={handleAddYAxisKey}
              value=""
            >
              <SelectTrigger>
                <SelectValue placeholder="カラムを追加" />
              </SelectTrigger>
              <SelectContent>
                {numericColumns.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    数値型のカラムがありません
                  </div>
                ) : (
                  numericColumns.map((col) => (
                    <SelectItem
                      key={col.key}
                      value={col.key}
                      disabled={yAxisKeys.includes(col.key)}
                    >
                      {col.label}
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>

            {/* 選択済み Y 軸のバッジ一覧 */}
            {yAxisKeys.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {yAxisKeys.map((key) => (
                  <Badge
                    key={key}
                    variant="secondary"
                    className="gap-1.5 pl-2.5 pr-1.5"
                  >
                    {key}
                    <button
                      type="button"
                      onClick={() => handleRemoveYAxisKey(key)}
                      className="rounded-sm hover:text-destructive focus-visible:outline-none"
                      aria-label={`${key} を削除`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleClose}>
            キャンセル
          </Button>
          <Button onClick={handleSubmit} disabled={!isValid}>
            グラフを追加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

---

## 6. ChartGrid — DnD コンテナ

### `components/charts/ChartGrid.tsx`

```tsx
'use client'

import { useState } from 'react'
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'
import { useDashboardStore } from '@/lib/store/dashboard'
import { ChartCard } from './ChartCard'
import { AddChartCard } from './AddChartCard'
import { ChartModal } from './ChartModal'

export function ChartGrid() {
  const { charts, chartOrder, reorderCharts } = useDashboardStore()
  const [isModalOpen, setIsModalOpen] = useState(false)

  /**
   * PointerSensor: マウス・タッチでのドラッグを処理する。
   * KeyboardSensor: キーボード（矢印キー）でのドラッグをサポートする。
   */
  const sensors = useSensors(
    useSensor(PointerSensor, {
      // ドラッグ開始の判定距離（px）。
      // 小さすぎるとカードのボタンとのクリック判定が競合する。
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  /**
   * ドラッグ終了時に chartOrder を更新する。
   * active.id と over.id の位置を arrayMove で入れ替える。
   */
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = chartOrder.indexOf(String(active.id))
    const newIndex = chartOrder.indexOf(String(over.id))

    if (oldIndex === -1 || newIndex === -1) return

    reorderCharts(arrayMove(chartOrder, oldIndex, newIndex))
  }

  /**
   * chartOrder の順序に従ってチャートを並び替えて返す。
   * store の charts 配列は追加順のため、表示順は chartOrder で制御する。
   */
  const orderedCharts = chartOrder
    .map((id) => charts.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined)

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={chartOrder} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {orderedCharts.map((chart) => (
              <ChartCard key={chart.id} chart={chart} />
            ))}
            <AddChartCard onAdd={() => setIsModalOpen(true)} />
          </div>
        </SortableContext>
      </DndContext>

      <ChartModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  )
}
```

---

## 7. 実装の解説

### `PointerSensor` の `activationConstraint: { distance: 8 }`

カード内の削除ボタン等をクリックしたとき、わずかな手ブレでドラッグが
起動してしまう問題を防ぐために、8px 以上のドラッグ移動量でドラッグを
開始するよう設定している。

### `rectSortingStrategy` の選択理由

dnd-kit には `verticalListSortingStrategy` / `horizontalListSortingStrategy` /
`rectSortingStrategy` の 3 種類がある。グリッドレイアウトでは
`rectSortingStrategy` を使用する。

### ChartRenderer の `type` ガード

`if (type === 'bar') { ... }` のように型ガードで各チャートを分岐させている。
`switch` 文も使えるが、TypeScript の exhaustive check が機能しやすい
if 連鎖の方が、将来の型追加時に対応漏れを検出しやすい。

### 円グラフと散布図の Y 軸制限

- **円グラフ**: 値は1系列のみ意味を持つ（`yAxisKeys[0]` のみ使用）
- **散布図**: X と Y の2軸で相関を見るため `xAxisKey` を数値として扱う

モーダルで複数の Y 軸を選択しても、これらのチャートでは先頭キーのみ
使用することを UI 上で明示するか、将来的には選択肢を制限する実装を追加する。

---

## 8. 次のステップへ

Step 06 完了後、Step 07 でメインページと Dashboard の統合に進む。
