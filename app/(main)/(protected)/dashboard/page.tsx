import { Suspense } from 'react'
import Link from 'next/link'
import { SearchParams } from 'nuqs/server'
import { ErrorBoundary } from 'react-error-boundary'
import { Plus } from 'lucide-react'

import { HydrateClient, prefetch, trpc } from '@/trpc/server'
import { loadSearchParams } from '@/modules/dashboard/params/search-params'

import { DatasetList } from '@/components/features/dashboard/dataset-list'
import { DatasetListSkeleton } from '@/components/features/dashboard/dataset-list-skeleton'
import { DatasetListError } from '@/components/features/dashboard/dataset-list-error'
import { DatasetSearchForm } from '@/components/features/dashboard/dataset-search-form'
import { Button } from '@/components/ui/button'

interface Props {
  searchParams: Promise<SearchParams>
}

export default async function DashboardPage({ searchParams }: Props) {
  const params = await loadSearchParams(searchParams)

  prefetch(
    trpc.datasets.list.queryOptions({
      page: params.page,
      limit: 10,
      q: params.q,
    }),
  )

  return (
    <HydrateClient>
      <div className="flex flex-col gap-6 p-6 max-w-3xl mx-auto w-full">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-heading text-2xl font-semibold tracking-wider uppercase">
              My Datasets
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              アップロードしたデータセットの一覧
            </p>
          </div>
          <Button asChild size="sm">
            <Link href="/">
              <Plus />
              新規作成
            </Link>
          </Button>
        </div>

        <DatasetSearchForm />

        <ErrorBoundary FallbackComponent={DatasetListError}>
          <Suspense fallback={<DatasetListSkeleton />}>
            <DatasetList />
          </Suspense>
        </ErrorBoundary>
      </div>
    </HydrateClient>
  )
}
