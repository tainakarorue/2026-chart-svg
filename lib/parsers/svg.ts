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
  file: File,
): Promise<{ columns: Column[]; rows: Row[] }> {
  const text = await file.text()

  let root: SvgNode
  try {
    root = (await parseSvgToJson(text)) as SvgNode
  } catch {
    throw new Error(
      'SVG ファイルの解析に失敗しました。正しい SVG 形式か確認してください',
    )
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
