'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { useTRPC } from '@/trpc/client'
import { useDashboardStore } from '@/lib/store/dashboard'

export function useSaveDashboard() {
  const trpc = useTRPC()
  const router = useRouter()
  const queryClient = useQueryClient()

  const datasetId = useDashboardStore((s) => s.datasetId)
  const fileName = useDashboardStore((s) => s.fileName)
  const fileType = useDashboardStore((s) => s.fileType)
  const columns = useDashboardStore((s) => s.columns)
  const rows = useDashboardStore((s) => s.rows)
  const charts = useDashboardStore((s) => s.charts)
  const chartOrder = useDashboardStore((s) => s.chartOrder)
  const setDatasetId = useDashboardStore((s) => s.setDatasetId)

  const orderedCharts = chartOrder
    .map((id) => charts.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined)

  const mutation = useMutation(trpc.datasets.saveWithCharts.mutationOptions())

  function save() {
    if (!fileName || !fileType) return

    const isNew = !datasetId

    mutation.mutate(
      {
        datasetId: datasetId ?? undefined,
        fileName,
        fileType,
        columns,
        rows,
        charts: orderedCharts,
      },
      {
        onSuccess: ({ datasetId: savedId }) => {
          setDatasetId(savedId)
          queryClient.invalidateQueries({
            queryKey: trpc.datasets.list.queryKey(),
          })
          toast.success('保存しました')
          if (isNew) {
            router.push(`/dashboard/${savedId}`)
          } else {
            queryClient.invalidateQueries({
              queryKey: trpc.datasets.getById.queryKey({ id: savedId }),
            })
          }
        },
        onError: (err) => {
          if (err.message === 'FREE_TIER_LIMIT') {
            toast.error('無料プランの上限（5件）に達しています')
          } else {
            toast.error('保存に失敗しました')
          }
        },
      },
    )
  }

  return {
    save,
    isSaving: mutation.isPending,
    canSave: !!fileName,
  }
}
