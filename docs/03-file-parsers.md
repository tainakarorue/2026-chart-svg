# Step 03 — ファイルパーサーと useFileParser フック

## 概要

Excel (.xlsx / .xls)、CSV (.csv)、SVG ファイルを解析して、
`Column[]` と `Row[]` の形式に変換するロジックを実装する。
パースした結果は Zustand ストアに格納する。

---

## 1. ディレクトリ構成

```
lib/
└── parsers/
    ├── excel.ts     ← xlsx (SheetJS) を使った Excel 解析
    ├── csv.ts       ← xlsx (SheetJS) を使った CSV 解析
    └── svg.ts       ← svgson を使った SVG 解析
hooks/
└── useFileParser.ts ← 上記 3 つのパーサーを呼び分ける custom hook
```

---

## 2. Excel パーサー

### `lib/parsers/excel.ts`

```typescript
import * as XLSX from 'xlsx'
import type { Column, ColumnType, Row } from '@/lib/store/dashboard'

/**
 * セルの値リストからカラムのデータ型を推論する。
 * すべての非null値が数値に変換できる場合は 'number'、それ以外は 'string' とする。
 */
function inferColumnType(values: unknown[]): ColumnType {
  const nonNull = values.filter(
    (v) => v !== null && v !== undefined && v !== ''
  )
  if (nonNull.length === 0) return 'string'
  const allNumeric = nonNull.every(
    (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)))
  )
  return allNumeric ? 'number' : 'string'
}

/**
 * Excel ファイル（.xlsx / .xls）を解析して Column[] と Row[] を返す。
 * 先頭シートのみを対象とする。
 * セルの値は文字列・数値・null のいずれかに正規化する。
 */
export function parseExcel(
  file: File
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
          { defval: null }
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
            : new Error('Excel ファイルの解析に失敗しました')
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
```

---

## 3. CSV パーサー

### `lib/parsers/csv.ts`

```typescript
import * as XLSX from 'xlsx'
import type { Column, ColumnType, Row } from '@/lib/store/dashboard'

/**
 * セルの値リストからカラムのデータ型を推論する。
 * すべての非null値が数値に変換できる場合は 'number'、それ以外は 'string' とする。
 */
function inferColumnType(values: unknown[]): ColumnType {
  const nonNull = values.filter(
    (v) => v !== null && v !== undefined && v !== ''
  )
  if (nonNull.length === 0) return 'string'
  const allNumeric = nonNull.every(
    (v) => typeof v === 'number' || (typeof v === 'string' && !isNaN(Number(v)))
  )
  return allNumeric ? 'number' : 'string'
}

/**
 * CSV ファイルを解析して Column[] と Row[] を返す。
 * SheetJS の type: 'string' を使い、テキストとして読み込む。
 */
export function parseCsv(
  file: File
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
          { defval: null }
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
            : new Error('CSV ファイルの解析に失敗しました')
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
```

---

## 4. SVG パーサー

### `lib/parsers/svg.ts`

```typescript
import { parse as parseSvgToJson } from 'svgson'
import type { Column, ColumnType, Row } from '@/lib/store/dashboard'

/** svgson が返すノードの型 */
interface SvgNode {
  name: string
  type: string
  value: string
  attributes: Record<string, string>
  children: SvgNode[]
}

/** チャートデータとして意味を持つ SVG 描画要素 */
const DRAWABLE_ELEMENTS = new Set([
  'rect',
  'circle',
  'ellipse',
  'line',
  'path',
  'polygon',
  'polyline',
  'text',
])

/**
 * SVG ツリーを深さ優先で走査し、描画要素ノードを収集する。
 */
function collectDrawableNodes(node: SvgNode, result: SvgNode[]): void {
  if (DRAWABLE_ELEMENTS.has(node.name)) {
    result.push(node)
  }
  for (const child of node.children) {
    collectDrawableNodes(child, result)
  }
}

/**
 * 属性キーからデータ型を推論する。
 * 座標・サイズ系の属性は number、それ以外は string とする。
 */
function inferSvgAttributeType(key: string): ColumnType {
  const numericKeys = new Set([
    'x',
    'y',
    'x1',
    'y1',
    'x2',
    'y2',
    'width',
    'height',
    'r',
    'cx',
    'cy',
    'rx',
    'ry',
    'opacity',
    'stroke-width',
    'font-size',
  ])
  return numericKeys.has(key) ? 'number' : 'string'
}

/**
 * SVG ファイルを解析して Column[] と Row[] を返す。
 * 各描画要素の属性をテーブルの1行として扱う。
 * `element` カラムに要素名 (rect, circle など) を格納する。
 */
export async function parseSvgFile(
  file: File
): Promise<{ columns: Column[]; rows: Row[] }> {
  const text = await file.text()

  let root: SvgNode
  try {
    root = (await parseSvgToJson(text)) as SvgNode
  } catch {
    throw new Error('SVG ファイルの解析に失敗しました。正しい SVG 形式か確認してください')
  }

  const nodes: SvgNode[] = []
  collectDrawableNodes(root, nodes)

  if (nodes.length === 0) {
    return { columns: [], rows: [] }
  }

  // すべてのノードが持つ属性キーを収集（element 列を先頭に追加）
  const attributeKeySet = new Set<string>()
  for (const node of nodes) {
    for (const key of Object.keys(node.attributes)) {
      attributeKeySet.add(key)
    }
  }

  const attributeKeys = Array.from(attributeKeySet)
  const allKeys = ['element', ...attributeKeys]

  const columns: Column[] = allKeys.map((key) => ({
    key,
    label: key,
    type: key === 'element' ? 'string' : inferSvgAttributeType(key),
  }))

  const rows: Row[] = nodes.map((node) => {
    const row: Row = { element: node.name }

    for (const key of attributeKeys) {
      const rawValue = node.attributes[key] ?? null
      if (rawValue === null) {
        row[key] = null
        continue
      }
      // 数値として解釈できる属性値は number に変換する
      const asNumber = Number(rawValue)
      row[key] =
        rawValue.trim() !== '' && !isNaN(asNumber) ? asNumber : rawValue
    }

    return row
  })

  return { columns, rows }
}
```

---

## 5. useFileParser フック

### `hooks/useFileParser.ts`

```typescript
'use client'

import { useState, useCallback } from 'react'
import { useDashboardStore } from '@/lib/store/dashboard'
import { parseExcel } from '@/lib/parsers/excel'
import { parseCsv } from '@/lib/parsers/csv'
import { parseSvgFile } from '@/lib/parsers/svg'

/** ファイル解析の状態 */
export type ParseStatus = 'idle' | 'parsing' | 'success' | 'error'

export interface UseFileParserReturn {
  /** 現在の解析状態 */
  status: ParseStatus
  /** エラー発生時のメッセージ。エラーがない場合は null */
  error: string | null
  /**
   * ファイルを受け取り、拡張子に応じたパーサーを呼び出し、
   * 結果を Zustand ストアに格納する。
   */
  parseFile: (file: File) => Promise<void>
}

/**
 * ファイルのアップロードと解析を管理する custom hook。
 * DropZone コンポーネントから使用する。
 */
export function useFileParser(): UseFileParserReturn {
  const [status, setStatus] = useState<ParseStatus>('idle')
  const [error, setError] = useState<string | null>(null)
  const setFileData = useDashboardStore((state) => state.setFileData)

  const parseFile = useCallback(
    async (file: File) => {
      setStatus('parsing')
      setError(null)

      try {
        const extension = file.name.split('.').pop()?.toLowerCase()

        if (extension === 'xlsx' || extension === 'xls') {
          const { columns, rows } = await parseExcel(file)
          setFileData({
            fileName: file.name,
            fileType: extension,
            columns,
            rows,
          })
        } else if (extension === 'csv') {
          const { columns, rows } = await parseCsv(file)
          setFileData({
            fileName: file.name,
            fileType: 'csv',
            columns,
            rows,
          })
        } else if (extension === 'svg') {
          const { columns, rows } = await parseSvgFile(file)
          setFileData({
            fileName: file.name,
            fileType: 'svg',
            columns,
            rows,
          })
        } else {
          throw new Error(
            `非対応のファイル形式です: .${extension ?? '不明'}\n` +
              '.xlsx / .xls / .csv / .svg のいずれかをアップロードしてください'
          )
        }

        setStatus('success')
      } catch (err) {
        const message =
          err instanceof Error ? err.message : '不明なエラーが発生しました'
        setError(message)
        setStatus('error')
      }
    },
    [setFileData]
  )

  return { status, error, parseFile }
}
```

---

## 6. 注意事項

### xlsx の `type` オプションについて

SheetJS の `XLSX.read()` は `type: 'binary'` でも動作するが、
`FileReader.readAsBinaryString()` は非推奨となっているため、
Excel は `type: 'array'` + `FileReader.readAsArrayBuffer()`、
CSV は `type: 'string'` + `FileReader.readAsText()` の組み合わせを使用する。

### SVG データの性質について

SVG は本来グラフィックスのフォーマットであり、
テーブルデータを内包することを目的としていない。
このパーサーは「SVG 内の描画要素の属性値をテーブル化する」
アプローチを採用している。

データとしての SVG（例: D3.js で生成したデータ駆動 SVG）には有効だが、
デザインツールでエクスポートした SVG の場合、
意味のあるデータが得られないことがある。

### クライアントサイド専用

`parseExcel`、`parseCsv`、`parseSvgFile` は `FileReader` と `File.text()` を使用するため、
必ずクライアントサイドで実行される。
Server Component や Server Action から直接呼び出してはならない。
`useFileParser` フックに `'use client'` ディレクティブを付与しているため、
フックを使う側のコンポーネントも自動的にクライアントコンポーネントになる。

---

## 7. 次のステップへ

Step 03 完了後、Step 04 で DropZone コンポーネントの実装に進む。
