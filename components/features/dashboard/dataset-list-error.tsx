'use client'

import type { FallbackProps } from 'react-error-boundary'
import { AlertCircle, RefreshCw } from 'lucide-react'
import { Button } from '@/components/ui/button'

export function DatasetListError({ error, resetErrorBoundary }: FallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-none border border-destructive/30 bg-destructive/5 p-10 text-center">
      <AlertCircle className="size-8 text-destructive" />
      <div>
        <p className="font-medium text-sm">一覧の取得に失敗しました</p>
        <p className="text-xs text-muted-foreground mt-1">
          {error instanceof Error ? error.message : '不明なエラーが発生しました'}
        </p>
      </div>
      <Button variant="outline" size="sm" onClick={resetErrorBoundary}>
        <RefreshCw className="size-3.5" />
        再試行
      </Button>
    </div>
  )
}
