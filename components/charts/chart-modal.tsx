'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
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
import type { Aggregation, ChartType } from '@/lib/store/dashboard'

/** 集計方法の選択肢 */
const AGGREGATION_OPTIONS: {
  value: Aggregation
  label: string
  description: string
}[] = [
  { value: 'none', label: 'なし', description: 'X軸が一意なとき' },
  { value: 'sum', label: '合計', description: 'カテゴリー別の合計' },
  { value: 'avg', label: '平均', description: 'カテゴリー別の平均' },
  { value: 'count', label: '件数', description: 'レコード数をカウント' },
]

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
  const [aggregation, setAggregation] = useState<Aggregation>('none')

  /** 数値カラムのみ Y 軸・散布図 X 軸の候補として使用する */
  const numericColumns = columns.filter((col) => col.type === 'number')

  /** 散布図では X 軸も数値カラムのみ有効 */
  const xAxisColumns = chartType === 'scatter' ? numericColumns : columns

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
    addChart({ title: title.trim(), type: chartType, xAxisKey, yAxisKeys, aggregation })
    handleClose()
  }

  /** フォームをリセットしてモーダルを閉じる */
  function handleClose() {
    setTitle('')
    setChartType('bar')
    setXAxisKey('')
    setYAxisKeys([])
    setAggregation('none')
    onOpenChange(false)
  }

  const isValid =
    title.trim().length > 0 && xAxisKey !== '' && yAxisKeys.length > 0

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>グラフを追加</DialogTitle>
          <DialogDescription className="sr-only">
            グラフのタイトル・種別・X軸・Y軸を設定して追加します
          </DialogDescription>
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
                  onClick={() => {
                    setChartType(opt.value)
                    // 散布図に切り替えた際、X 軸に非数値カラムが選ばれていたらリセット
                    if (
                      opt.value === 'scatter' &&
                      xAxisKey !== '' &&
                      !numericColumns.some((c) => c.key === xAxisKey)
                    ) {
                      setXAxisKey('')
                    }
                  }}
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

          {/* X 軸 */}
          <div className="flex flex-col gap-1.5">
            <Label>
              X 軸{' '}
              <span className="text-xs text-muted-foreground font-normal">
                {chartType === 'scatter'
                  ? '（数値カラムのみ）'
                  : '（カテゴリ・ラベルとして使用するカラム）'}
              </span>
            </Label>
            <Select value={xAxisKey} onValueChange={setXAxisKey}>
              <SelectTrigger>
                <SelectValue placeholder="カラムを選択" />
              </SelectTrigger>
              <SelectContent>
                {xAxisColumns.length === 0 ? (
                  <div className="px-3 py-2 text-sm text-muted-foreground">
                    数値型のカラムがありません
                  </div>
                ) : (
                  xAxisColumns.map((col) => (
                    <SelectItem key={col.key} value={col.key}>
                      <span>{col.label}</span>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {col.type}
                      </span>
                    </SelectItem>
                  ))
                )}
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
            <Select onValueChange={handleAddYAxisKey} value="">
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

          {/* 集計方法 */}
          <div className="flex flex-col gap-1.5">
            <Label>
              集計方法{' '}
              <span className="text-xs font-normal text-muted-foreground">
                （X軸に重複がある場合の処理）
              </span>
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {AGGREGATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setAggregation(opt.value)}
                  className={cn(
                    'flex flex-col items-start gap-0.5 rounded-lg border p-3 text-left transition-colors',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                    aggregation === opt.value
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
