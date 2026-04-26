'use client'

import { useState, useMemo } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Column, Row } from '@/lib/store/dashboard'

interface DataTableProps {
  columns: Column[]
  rows: Row[]
}

/** 1ページあたりの表示行数の選択肢 */
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

export function DataTable({ columns, rows }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')

  /**
   * TanStack Table の ColumnDef を Column[] から動的に生成する。
   * columns が変わるたびに再生成されるため useMemo でメモ化する。
   */
  const tableColumnDefs = useMemo<ColumnDef<Row>[]>(
    () =>
      columns.map((col) => ({
        accessorKey: col.key,
        // ソートボタン付きのヘッダー
        header: ({ column: tableCol }) => (
          <Button
            variant="ghost"
            size="sm"
            className="-ml-3 h-8 gap-1 font-medium"
            onClick={() =>
              tableCol.toggleSorting(tableCol.getIsSorted() === 'asc')
            }
          >
            {col.label}
            {tableCol.getIsSorted() === 'asc' ? (
              <ArrowUp className="h-3 w-3" />
            ) : tableCol.getIsSorted() === 'desc' ? (
              <ArrowDown className="h-3 w-3" />
            ) : (
              <ArrowUpDown className="h-3 w-3 text-muted-foreground/60" />
            )}
          </Button>
        ),
        // セルの値をフォーマットして表示
        cell: ({ getValue }) => {
          const value = getValue()

          // null / undefined はダッシュで表示
          if (value === null || value === undefined) {
            return (
              <span className="select-none text-muted-foreground/40">—</span>
            )
          }

          // 数値は右揃えで表示
          if (typeof value === 'number') {
            return (
              <span className="block text-right tabular-nums">
                {value.toLocaleString()}
              </span>
            )
          }

          // boolean は Yes / No で表示
          if (typeof value === 'boolean') {
            return (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  value
                    ? 'bg-green-50 text-green-700'
                    : 'bg-red-50 text-red-700',
                )}
              >
                {value ? 'Yes' : 'No'}
              </span>
            )
          }

          return <span>{String(value)}</span>
        },
        // ソートは文字列・数値どちらにも対応（TanStack が自動判定）
        sortingFn: 'auto',
      })),
    [columns],
  )

  const table = useReactTable({
    data: rows,
    columns: tableColumnDefs,
    initialState: {
      pagination: { pageIndex: 0, pageSize: 20 },
    },
    state: {
      sorting,
      globalFilter,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: true,
  })

  const filteredCount = table.getFilteredRowModel().rows.length
  const totalCount = rows.length
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()

  return (
    <div className="flex flex-col gap-4">
      {/* ツールバー */}
      <div className="flex flex-wrap items-center gap-3">
        <Input
          placeholder="テーブル全体を検索..."
          value={globalFilter}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="h-9 max-w-xs"
        />
        <span className="ml-auto text-sm text-muted-foreground">
          {filteredCount < totalCount ? (
            <>
              <span className="font-medium text-foreground">
                {filteredCount.toLocaleString()}
              </span>{' '}
              / {totalCount.toLocaleString()} 件
            </>
          ) : (
            <>{totalCount.toLocaleString()} 件</>
          )}
        </span>
      </div>

      {/* テーブル本体 */}
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow
                  key={headerGroup.id}
                  className="bg-muted/40 hover:bg-muted/40"
                >
                  {headerGroup.headers.map((header) => (
                    <TableHead
                      key={header.id}
                      className="whitespace-nowrap py-2"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
                          )}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-32 text-center text-muted-foreground"
                  >
                    {globalFilter
                      ? `"${globalFilter}" に一致するデータがありません`
                      : 'データがありません'}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/20">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="whitespace-nowrap py-2"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* ページネーション */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        {/* 1ページあたりの行数選択 */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>表示件数:</span>
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(val) => table.setPageSize(Number(val))}
          >
            <SelectTrigger className="h-8 w-20">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* ページ情報とナビゲーションボタン */}
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {currentPage} / {totalPages} ページ
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(0)}
              disabled={!table.getCanPreviousPage()}
              aria-label="最初のページへ"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
              aria-label="前のページへ"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
              aria-label="次のページへ"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => table.setPageIndex(table.getPageCount() - 1)}
              disabled={!table.getCanNextPage()}
              aria-label="最後のページへ"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
