'use client'

import { useTransition } from 'react'
import { useQueryStates } from 'nuqs'
import { Search, X, Loader2 } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { dashboardParsers } from '@/modules/dashboard/params'

export function DatasetSearchForm() {
  const [isPending, startTransition] = useTransition()
  const [{ q }, setParams] = useQueryStates(dashboardParsers, {
    startTransition,
    throttleMs: 300,
    shallow: false,
  })

  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-muted-foreground">
        {isPending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Search className="size-4" />
        )}
      </span>
      <Input
        value={q}
        onChange={(e) => setParams({ q: e.target.value, page: 1 })}
        placeholder="ファイル名で検索..."
        className="pl-6 pr-6"
        aria-label="データセットを検索"
      />
      {q && (
        <button
          type="button"
          onClick={() => setParams({ q: '', page: 1 })}
          className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          aria-label="検索をクリア"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  )
}
