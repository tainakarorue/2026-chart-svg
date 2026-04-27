import * as XLSX from 'xlsx'
import type { Column, Row } from '@/lib/store/dashboard'

export function exportToCsv(
  rows: Row[],
  columns: Column[],
  fileName: string,
): void {
  const header = columns.map((c) => c.label)
  const data = rows.map((row) => columns.map((c) => row[c.key] ?? ''))

  const ws = XLSX.utils.aoa_to_sheet([header, ...data])
  const csv = XLSX.utils.sheet_to_csv(ws)

  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' })
  triggerDownload(blob, `${fileName}.csv`)
}

export function exportToExcel(
  rows: Row[],
  columns: Column[],
  fileName: string,
): void {
  const header = columns.map((c) => c.label)
  const data = rows.map((row) => columns.map((c) => row[c.key] ?? ''))

  const ws = XLSX.utils.aoa_to_sheet([header, ...data])
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1')
  XLSX.writeFile(wb, `${fileName}.xlsx`)
}

function triggerDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = fileName
  a.click()
  URL.revokeObjectURL(url)
}
