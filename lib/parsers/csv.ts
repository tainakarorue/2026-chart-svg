import * as XLSX from 'xlsx'
import type { Column, ColumnType, Row } from '@/lib/store/dashboard'

/**
 * セルの値リストからカラムのデータ型を推論する。
 * すべての非null値が数値に変換できる場合は 'number'、それ以外は 'string' とする。
 */
function inferColumnType(values: unknown[]): ColumnType {
  const nonNull = values.filter(
    (v) => v !== null && v !== undefined && v !== '',
  )
  if (nonNull.length === 0) return 'string'
  const allNumeric = nonNull.every(
    (v) =>
      typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v))),
  )
  return allNumeric ? 'number' : 'string'
}

/**
 * CSV ファイルを解析して Column[] と Row[] を返す。
 * SheetJS の type: 'string' を使い、テキストとして読み込む。
 */
export function parseCsv(
  file: File,
): Promise<{ columns: Column[]; rows: Row[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const text = event.target?.result
        if (typeof text !== 'string') {
          throw new Error('ファイルの読み込み結果が空です')
        }

        const workbook = XLSX.read(text, { type: 'string' })
        const sheetName = workbook.SheetNames[0]

        if (!sheetName) {
          resolve({ columns: [], rows: [] })
          return
        }

        const sheet = workbook.Sheets[sheetName]

        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          sheet,
          { defval: null },
        )

        if (jsonData.length === 0) {
          resolve({ columns: [], rows: [] })
          return
        }

        const keys = Object.keys(jsonData[0])

        const columns: Column[] = keys.map((key) => ({
          key,
          label: key,
          type: inferColumnType(jsonData.map((row) => row[key])),
        }))

        const rows: Row[] = jsonData.map((rawRow) => {
          const normalized: Row = {}
          for (const key of keys) {
            const val = rawRow[key]
            if (val === null || val === undefined) {
              normalized[key] = null
            } else if (typeof val === 'number') {
              normalized[key] = val
            } else if (typeof val === 'boolean') {
              normalized[key] = val
            } else {
              const asNumber = Number(val)
              normalized[key] =
                typeof val === 'string' && val.trim() !== '' && !isNaN(asNumber)
                  ? asNumber
                  : String(val)
            }
          }
          return normalized
        })

        resolve({ columns, rows })
      } catch (err) {
        reject(
          err instanceof Error
            ? err
            : new Error('CSV ファイルの解析に失敗しました'),
        )
      }
    }

    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'))
    }

    // CSV はテキストとして読み込む（SheetJS の type: 'string' に対応）
    reader.readAsText(file)
  })
}
