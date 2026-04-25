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
              '.xlsx / .xls / .csv / .svg のいずれかをアップロードしてください',
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
    [setFileData],
  )

  return { status, error, parseFile }
}
