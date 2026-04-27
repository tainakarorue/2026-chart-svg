'use client'

import { useState, useMemo, useEffect } from 'react'
import {
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type ColumnFiltersState,
  type FilterFn,
  type Column as TColumn,
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
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover'
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Download,
  Filter,
  X,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import type { Column, Row } from '@/lib/store/dashboard'
import { exportToCsv, exportToExcel } from '@/lib/export'

interface DataTableProps {
  columns: Column[]
  rows: Row[]
  fileName?: string
  onFilteredRowsChange?: (rows: Row[]) => void
}

type NumberRangeFilter = { min: string; max: string }

const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]

// 数値範囲フィルタ関数
const numberRangeFilterFn: FilterFn<Row> = (row, columnId, filterValue: NumberRangeFilter) => {
  const { min, max } = filterValue
  const val = Number(row.getValue(columnId))
  if (min !== '' && !isNaN(Number(min)) && val < Number(min)) return false
  if (max !== '' && !isNaN(Number(max)) && val > Number(max)) return false
  return true
}
numberRangeFilterFn.autoRemove = (val: NumberRangeFilter) => val.min === '' && val.max === ''

// boolean フィルタ関数
const booleanFilterFn: FilterFn<Row> = (row, columnId, filterValue: string) => {
  if (!filterValue) return true
  const val = row.getValue(columnId)
  return filterValue === 'true' ? val === true : val === false
}
booleanFilterFn.autoRemove = (val: string) => !val

// アクティブフィルタのバッジ表示テキストを生成
function formatFilterBadge(type: Column['type'], label: string, value: unknown): string {
  if (type === 'number') {
    const { min, max } = value as NumberRangeFilter
    if (min && max) return `${label}: ${min} 〜 ${max}`
    if (min) return `${label}: ≥ ${min}`
    if (max) return `${label}: ≤ ${max}`
    return ''
  }
  if (type === 'boolean') {
    return `${label}: ${(value as string) === 'true' ? 'Yes' : 'No'}`
  }
  return `${label}: ${String(value)}`
}

// カラム別フィルタ Popover
function ColumnFilterPopover({
  column,
  colType,
  label,
}: {
  column: TColumn<Row>
  colType: Column['type']
  label: string
}) {
  const currentFilter = column.getFilterValue()
  const isActive = currentFilter != null

  if (colType === 'number') {
    const numFilter = (currentFilter as NumberRangeFilter | undefined) ?? { min: '', max: '' }
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-accent',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground',
            )}
            aria-label={`${label} でフィルタ`}
          >
            <Filter className={cn('h-3 w-3', isActive && 'fill-current')} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-52 p-3" align="start">
          <p className="mb-2 text-xs font-medium text-foreground">{label} の範囲</p>
          <div className="flex flex-col gap-2">
            <Input
              placeholder="最小値"
              type="number"
              value={numFilter.min}
              onChange={(e) =>
                column.setFilterValue({ ...numFilter, min: e.target.value })
              }
              className="h-8 text-sm"
            />
            <Input
              placeholder="最大値"
              type="number"
              value={numFilter.max}
              onChange={(e) =>
                column.setFilterValue({ ...numFilter, max: e.target.value })
              }
              className="h-8 text-sm"
            />
            {isActive && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs text-muted-foreground"
                onClick={() => column.setFilterValue(undefined)}
              >
                クリア
              </Button>
            )}
          </div>
        </PopoverContent>
      </Popover>
    )
  }

  if (colType === 'boolean') {
    const boolFilter = (currentFilter as string | undefined) ?? ''
    return (
      <Popover>
        <PopoverTrigger asChild>
          <button
            type="button"
            className={cn(
              'flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-accent',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
              isActive ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground',
            )}
            aria-label={`${label} でフィルタ`}
          >
            <Filter className={cn('h-3 w-3', isActive && 'fill-current')} />
          </button>
        </PopoverTrigger>
        <PopoverContent className="w-40 p-3" align="start">
          <p className="mb-2 text-xs font-medium text-foreground">{label}</p>
          <Select
            value={boolFilter}
            onValueChange={(val) => column.setFilterValue(val || undefined)}
          >
            <SelectTrigger className="h-8 text-sm">
              <SelectValue placeholder="全て" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">全て</SelectItem>
              <SelectItem value="true">Yes</SelectItem>
              <SelectItem value="false">No</SelectItem>
            </SelectContent>
          </Select>
        </PopoverContent>
      </Popover>
    )
  }

  // string / date
  const strFilter = (currentFilter as string | undefined) ?? ''
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex h-6 w-6 shrink-0 items-center justify-center rounded hover:bg-accent',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            isActive ? 'text-primary' : 'text-muted-foreground/40 hover:text-muted-foreground',
          )}
          aria-label={`${label} でフィルタ`}
        >
          <Filter className={cn('h-3 w-3', isActive && 'fill-current')} />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-3" align="start">
        <p className="mb-2 text-xs font-medium text-foreground">{label} で絞り込み</p>
        <Input
          placeholder="含む文字列..."
          value={strFilter}
          onChange={(e) => column.setFilterValue(e.target.value || undefined)}
          className="h-8 text-sm"
          autoFocus
        />
        {isActive && (
          <Button
            variant="ghost"
            size="sm"
            className="mt-2 h-7 w-full text-xs text-muted-foreground"
            onClick={() => column.setFilterValue(undefined)}
          >
            クリア
          </Button>
        )}
      </PopoverContent>
    </Popover>
  )
}

export function DataTable({ columns, rows, fileName, onFilteredRowsChange }: DataTableProps) {
  const [sorting, setSorting] = useState<SortingState>([])
  const [globalFilter, setGlobalFilter] = useState('')
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([])

  const tableColumnDefs = useMemo<ColumnDef<Row>[]>(
    () =>
      columns.map((col) => ({
        accessorKey: col.key,
        filterFn:
          col.type === 'number'
            ? numberRangeFilterFn
            : col.type === 'boolean'
              ? booleanFilterFn
              : 'includesString',
        header: ({ column: tableCol }) => (
          <div className="flex items-center gap-0.5">
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
            <ColumnFilterPopover
              column={tableCol}
              colType={col.type}
              label={col.label}
            />
          </div>
        ),
        cell: ({ getValue }) => {
          const value = getValue()
          if (value === null || value === undefined) {
            return <span className="select-none text-muted-foreground/40">—</span>
          }
          if (typeof value === 'number') {
            return (
              <span className="block text-right tabular-nums">
                {value.toLocaleString()}
              </span>
            )
          }
          if (typeof value === 'boolean') {
            return (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                  value ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700',
                )}
              >
                {value ? 'Yes' : 'No'}
              </span>
            )
          }
          return <span>{String(value)}</span>
        },
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
      columnFilters,
    },
    onSortingChange: setSorting,
    onGlobalFilterChange: setGlobalFilter,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    autoResetPageIndex: true,
  })

  const sortedRows = table.getSortedRowModel().rows

  useEffect(() => {
    onFilteredRowsChange?.(sortedRows.map((r) => r.original))
  }, [sortedRows, onFilteredRowsChange])

  const filteredCount = table.getFilteredRowModel().rows.length
  const totalCount = rows.length
  const currentPage = table.getState().pagination.pageIndex + 1
  const totalPages = table.getPageCount()
  const exportRows = sortedRows.map((r) => r.original)
  const baseName = fileName ?? 'export'

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

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-1.5">
              <Download className="h-4 w-4" />
              エクスポート
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => exportToCsv(exportRows, columns, baseName)}>
              CSV でダウンロード
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => exportToExcel(exportRows, columns, baseName)}>
              Excel でダウンロード
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* アクティブフィルタバッジ */}
      {columnFilters.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-muted-foreground">フィルター中:</span>
          {columnFilters.map((filter) => {
            const col = columns.find((c) => c.key === filter.id)
            if (!col) return null
            const text = formatFilterBadge(col.type, col.label, filter.value)
            if (!text) return null
            return (
              <Badge
                key={filter.id}
                variant="secondary"
                className="gap-1.5 pl-2.5 pr-1.5 text-xs"
              >
                {text}
                <button
                  type="button"
                  onClick={() => table.getColumn(filter.id)?.setFilterValue(undefined)}
                  className="rounded-sm hover:text-destructive focus-visible:outline-none"
                  aria-label={`${col.label} のフィルタを解除`}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )
          })}
          {columnFilters.length > 1 && (
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => setColumnFilters([])}
            >
              すべてクリア
            </Button>
          )}
        </div>
      )}

      {/* テーブル本体 */}
      <div className="overflow-hidden rounded-lg border">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id} className="bg-muted/40 hover:bg-muted/40">
                  {headerGroup.headers.map((header) => (
                    <TableHead key={header.id} className="whitespace-nowrap py-2">
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
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
                    {globalFilter || columnFilters.length > 0
                      ? 'フィルタ条件に一致するデータがありません'
                      : 'データがありません'}
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow key={row.id} className="hover:bg-muted/20">
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="whitespace-nowrap py-2">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
