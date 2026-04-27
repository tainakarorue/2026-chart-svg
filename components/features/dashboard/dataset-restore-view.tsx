'use client'

import { useEffect } from 'react'
import { useSuspenseQuery } from '@tanstack/react-query'
import { useTRPC } from '@/trpc/client'
import { useDashboardStore } from '@/lib/store/dashboard'
import { ChartUploadView } from '@/components/features/charts/views/chart-upload-view'
import type { ChartConfig, FileType } from '@/lib/store/dashboard'

interface Props {
  datasetId: string
}

export function DatasetRestoreView({ datasetId }: Props) {
  const trpc = useTRPC()
  const { data } = useSuspenseQuery(
    trpc.datasets.getById.queryOptions({ id: datasetId }),
  )

  const storeDatasetId = useDashboardStore((s) => s.datasetId)
  const restoreFromDataset = useDashboardStore((s) => s.restoreFromDataset)

  useEffect(() => {
    if (storeDatasetId === datasetId) return

    restoreFromDataset({
      datasetId: data.id,
      fileName: data.fileName,
      fileType: data.fileType as FileType,
      columns: data.columns,
      rows: data.rows,
      charts: data.charts.map(
        (c): ChartConfig => ({
          id: c.id,
          title: c.title,
          type: c.type,
          xAxisKey: c.xAxisKey,
          yAxisKeys: c.yAxisKeys,
          colSpan: c.colSpan as ChartConfig['colSpan'],
          aggregation: c.aggregation as ChartConfig['aggregation'],
          ...(c.stacked   != null && { stacked:  c.stacked }),
          ...(c.lineType  != null && { lineType: c.lineType  as ChartConfig['lineType'] }),
          ...(c.showDots  != null && { showDots: c.showDots }),
        }),
      ),
    })
  }, [data, datasetId, storeDatasetId, restoreFromDataset])

  // Zustand への復元が終わるまでスケルトンを表示
  if (storeDatasetId !== datasetId) {
    return (
      <div className="flex h-screen items-center justify-center text-muted-foreground text-sm">
        読み込み中...
      </div>
    )
  }

  return <ChartUploadView />
}
