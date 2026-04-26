import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { DatasetRestoreView } from '@/components/features/dashboard/dataset-restore-view'

interface Props {
  params: Promise<{ datasetId: string }>
}

export default async function DatasetPage({ params }: Props) {
  const { datasetId } = await params

  if (!datasetId) notFound()

  prefetch(trpc.datasets.getById.queryOptions({ id: datasetId }))

  return (
    <HydrateClient>
      <Suspense
        fallback={
          <div className="flex h-screen items-center justify-center text-muted-foreground text-sm">
            読み込み中...
          </div>
        }
      >
        <DatasetRestoreView datasetId={datasetId} />
      </Suspense>
    </HydrateClient>
  )
}
