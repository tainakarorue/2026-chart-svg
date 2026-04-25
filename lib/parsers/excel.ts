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
 * Excel ファイル（.xlsx / .xls）を解析して Column[] と Row[] を返す。
 * 先頭シートのみを対象とする。
 * セルの値は文字列・数値・null のいずれかに正規化する。
 */

export function parseExcel(
  file: File,
): Promise<{ columns: Column[]; rows: Row[] }> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = (event) => {
      try {
        const arrayBuffer = event.target?.result
        if (!arrayBuffer) {
          throw new Error('ファイルの読み込み結果が空です')
        }

        const workbook = XLSX.read(arrayBuffer, { type: 'array' })
        const sheetName = workbook.SheetNames[0]

        if (!sheetName) {
          resolve({ columns: [], rows: [] })
          return
        }

        const sheet = workbook.Sheets[sheetName]

        // header: 1 を使うと1行目をヘッダーとして扱い、
        // 各行を Record<string, unknown> の配列として返す
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          sheet,
          { defval: null },
        )

        if (jsonData.length === 0) {
          resolve({ columns: [], rows: [] })
          return
        }

        // 1行目からカラムキーを取得
        const keys = Object.keys(jsonData[0])

        // 各カラムのデータ型を推論
        const columns: Column[] = keys.map((key) => ({
          key,
          label: key,
          type: inferColumnType(jsonData.map((row) => row[key])),
        }))

        // 各行のセル値を string | number | null に正規化
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
              // 数値として解釈できる文字列は number に変換する
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
            : new Error('Excel ファイルの解析に失敗しました'),
        )
      }
    }

    reader.onerror = () => {
      reject(new Error('ファイルの読み込みに失敗しました'))
    }

    // ArrayBuffer として読み込む（xlsx の type: 'array' に対応）
    reader.readAsArrayBuffer(file)
  })
}
