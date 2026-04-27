'use client'

import { useState } from 'react'
import { FileX, BarChart2, Save, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { useDashboardStore } from '@/lib/store/dashboard'
import type { Row } from '@/lib/store/dashboard'
import { DropZone } from '@/components/upload/drop-zone'
import { ChartGrid } from '@/components/charts/chart-grid'
import { DataTable } from '@/components/table/data-table'
import { authClient } from '@/lib/auth-client'
import { useSaveDashboard } from '@/hooks/use-save-dashboard'

export function ChartUploadView() {
  const { fileName, fileType, columns, rows, resetFile } = useDashboardStore()
  const { data: session } = authClient.useSession()
  const { save, isSaving, canSave } = useSaveDashboard()
  const [filteredRows, setFilteredRows] = useState<Row[] | null>(null)
  const [syncChart, setSyncChart] = useState(false)

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

        <div className="flex items-center gap-2">
          {/* 保存ボタン（ログイン済みのみ表示） */}
          {session && (
            <Button
              size="sm"
              onClick={save}
              disabled={!canSave || isSaving}
              className="shrink-0 gap-1.5"
            >
              {isSaving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              <span className="hidden sm:inline">
                {isSaving ? '保存中...' : '保存'}
              </span>
            </Button>
          )}

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
        </div>
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
        </section>

        {/* データテーブルセクション */}
        <section>
          <div className="mb-4 flex items-center gap-2">
            <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              データテーブル
            </h2>
            <Separator className="flex-1" />
          </div>
          <DataTable
            columns={columns}
            rows={rows}
            fileName={fileName ?? 'export'}
            onFilteredRowsChange={setFilteredRows}
          />
        </section>
      </main>
    </div>
  )
}
