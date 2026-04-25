'use client'

import { Plus } from 'lucide-react'
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
