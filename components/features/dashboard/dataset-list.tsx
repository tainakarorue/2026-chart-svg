'use client'

import Link from 'next/link'
import { useTRPC } from '@/trpc/client'
import {
  useSuspenseQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { FileSpreadsheet, BarChart2, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'

import { useConfirmDialog } from '@/hooks/use-confirm-dialog'
import { useSearchParams } from '@/modules/dashboard/params/use-search-params'

import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Empty,
  EmptyHeader,
  EmptyTitle,
  EmptyDescription,
  EmptyMedia,
} from '@/components/ui/empty'
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination'

const LIMIT = 10

function buildPageUrl(page: number) {
  if (page <= 1) return '/dashboard'
  return `/dashboard?page=${page}`
}

function buildPageRange(current: number, total: number): (number | '...')[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '...')[] = [1]
  if (current > 3) pages.push('...')
  for (
    let p = Math.max(2, current - 1);
    p <= Math.min(total - 1, current + 1);
    p++
  ) {
    pages.push(p)
  }
  if (current < total - 2) pages.push('...')
  pages.push(total)
  return pages
}

export const DatasetList = () => {
  const [params, setParams] = useSearchParams()
  const trpc = useTRPC()
  const queryClient = useQueryClient()

  const [pendingDelete, setPendingDelete] = useState<{
    id: string
    fileName: string
  } | null>(null)

  const { confirm, ConfirmDialog } = useConfirmDialog({
    title: 'データセットを削除',
    description: pendingDelete
      ? `「${pendingDelete.fileName}」を削除しますか？関連するすべてのチャートも削除されます。`
      : '削除しますか？',
  })

  const { data } = useSuspenseQuery(
    trpc.datasets.list.queryOptions({
      page: params.page,
      limit: LIMIT,
      q: params.q,
    }),
  )

  const deleteMutation = useMutation(
    trpc.datasets.delete.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: trpc.datasets.list.queryKey(),
        })
        toast.success('データセットを削除しました')
        if (data.items.length === 1 && params.page > 1) {
          setParams({ page: params.page - 1, q: params.q })
        }
      },
      onError: () => toast.error('削除に失敗しました'),
      onSettled: () => setPendingDelete(null),
    }),
  )

  const handleDelete = async (id: string, fileName: string) => {
    setPendingDelete({ id, fileName })
    await Promise.resolve()
    const ok = await confirm()
    if (!ok) {
      setPendingDelete(null)
      return
    }
    deleteMutation.mutate({ id })
  }

  if (data.totalCount === 0) {
    return (
      <Empty className="border border-dashed">
        <EmptyMedia variant="icon">
          <FileSpreadsheet />
        </EmptyMedia>
        <EmptyHeader>
          <EmptyTitle>データセットがありません</EmptyTitle>
          <EmptyDescription>
            トップページからファイルをアップロードして、データセットを作成できます。
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const pages = buildPageRange(params.page, data.totalPages)

  return (
    <>
      <ConfirmDialog />
      <div className="flex flex-col gap-3">
        {data.items.map((item) => (
          <Card
            key={item.id}
            size="sm"
            className="hover:ring-foreground/15 transition-shadow"
          >
            <CardContent className="flex items-center justify-between gap-4">
              <Link
                href={`/dashboard/${item.id}`}
                className="flex flex-1 items-center gap-4 min-w-0"
              >
                <FileSpreadsheet className="size-5 shrink-0 text-muted-foreground" />
                <div className="min-w-0">
                  <p className="truncate font-medium text-sm">
                    {item.fileName}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatDistanceToNow(new Date(item.createdAt), {
                      addSuffix: true,
                    })}
                  </p>
                </div>
              </Link>
              <div className="flex items-center gap-3 shrink-0">
                <Badge variant="secondary" className="gap-1">
                  <BarChart2 className="size-3" />
                  {item.chartCount}
                </Badge>
                <Badge variant="secondary">{item.fileType.toUpperCase()}</Badge>
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => handleDelete(item.id, item.fileName)}
                  disabled={deleteMutation.isPending}
                >
                  <Trash2 />
                  <span className="sr-only">削除</span>
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {data.totalPages > 1 && (
        <Pagination className="mt-8">
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                href={buildPageUrl(params.page - 1)}
                aria-disabled={params.page <= 1}
                className={
                  params.page <= 1 ? 'pointer-events-none opacity-50' : ''
                }
                text="前へ"
              />
            </PaginationItem>

            {pages.map((p, i) =>
              p === '...' ? (
                <PaginationItem key={`ellipsis-${i}`}>
                  <PaginationEllipsis />
                </PaginationItem>
              ) : (
                <PaginationItem key={p}>
                  <PaginationLink
                    href={buildPageUrl(p)}
                    isActive={p === params.page}
                  >
                    {p}
                  </PaginationLink>
                </PaginationItem>
              ),
            )}

            <PaginationItem>
              <PaginationNext
                href={buildPageUrl(params.page + 1)}
                aria-disabled={params.page >= data.totalPages}
                className={
                  params.page >= data.totalPages
                    ? 'pointer-events-none opacity-50'
                    : ''
                }
                text="次へ"
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </>
  )
}
