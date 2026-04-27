'use client'

import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { ArrowLeftRight, GripVertical, Trash2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/lib/store/dashboard'
import { ChartRenderer } from './chart-renderer'
import type { ChartConfig, ColSpan, Row } from '@/lib/store/dashboard'

interface ChartCardProps {
  chart: ChartConfig
  className?: string
  rows?: Row[]
}

export function ChartCard({ chart, className, rows: rowsProp }: ChartCardProps) {
  const removeChart = useDashboardStore((state) => state.removeChart)
  const updateChart = useDashboardStore((state) => state.updateChart)
  const storeRows = useDashboardStore((state) => state.rows)
  const rows = rowsProp ?? storeRows

  function cycleColSpan() {
    const next = ((chart.colSpan % 3) + 1) as ColSpan
    updateChart(chart.id, { colSpan: next })
  }

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
        'relative overflow-hidden rounded-xl transition-shadow',
        isDragging && 'opacity-0',
        className,
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

        {/* 幅切り替えボタン */}
        <button
          type="button"
          onClick={cycleColSpan}
          className={cn(
            'flex shrink-0 items-center gap-1 rounded-md border px-2 py-0.5 text-xs tabular-nums',
            'border-border bg-muted/60 text-muted-foreground transition-colors',
            'hover:border-primary/50 hover:bg-primary/10 hover:text-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
          )}
          aria-label={`幅 ${chart.colSpan} 列 — クリックで変更`}
        >
          <ArrowLeftRight className="h-3 w-3" />
          <span>{chart.colSpan}</span>
        </button>

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
