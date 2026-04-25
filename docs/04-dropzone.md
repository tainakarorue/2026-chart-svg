# Step 04 — DropZone コンポーネント

## 概要

react-dropzone を使ったファイルアップロードゾーンを実装する。
ドラッグ＆ドロップとボタンクリックの両方に対応し、
ファイルタイプのバリデーションと解析中のローディング状態も表示する。

---

## 1. ディレクトリ構成

```
components/
└── upload/
    └── DropZone.tsx
```

---

## 2. DropZone コンポーネント

### `components/upload/DropZone.tsx`

```tsx
'use client'

import { useCallback } from 'react'
import { useDropzone, type FileRejection } from 'react-dropzone'
import { UploadCloud, FileSpreadsheet, FileImage, AlertCircle, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useFileParser } from '@/hooks/useFileParser'

/**
 * react-dropzone の accept オプションに渡す MIME タイプとファイル拡張子の対応。
 * .xlsx: Excel 2007以降のオープン XML 形式
 * .xls:  Excel 97-2003 形式
 * .csv:  カンマ区切りテキスト
 * .svg:  SVG 画像
 */
const ACCEPTED_FILE_TYPES = {
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
  'image/svg+xml': ['.svg'],
}

export function DropZone() {
  const { status, error, parseFile } = useFileParser()
  const isParsing = status === 'parsing'

  /**
   * ドロップまたはファイル選択時のコールバック。
   * 拒否されたファイルがあっても先頭の受理ファイルだけを処理する。
   * maxFiles: 1 を設定しているため、accepted には最大1つのファイルが入る。
   */
  const onDrop = useCallback(
    (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
      // 拒否されたファイルのみの場合は何もしない（エラーは isDragReject で表示）
      if (rejectedFiles.length > 0 && acceptedFiles.length === 0) return
      if (acceptedFiles.length > 0) {
        parseFile(acceptedFiles[0])
      }
    },
    [parseFile]
  )

  const {
    getRootProps,
    getInputProps,
    isDragActive,
    isDragAccept,
    isDragReject,
    open,
  } = useDropzone({
    onDrop,
    accept: ACCEPTED_FILE_TYPES,
    maxFiles: 1,
    // DropZone が disabled の間はクリックもドラッグも受け付けない
    disabled: isParsing,
    // ファイルサイズ上限: 50MB
    maxSize: 50 * 1024 * 1024,
    // ゾーン全体のクリックは無効にして、ボタン経由でのみダイアログを開く
    noClick: true,
  })

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center bg-background p-8">
      {/* ドロップゾーン本体 */}
      <div
        {...getRootProps()}
        className={cn(
          // ベーススタイル
          'relative flex w-full max-w-2xl flex-col items-center justify-center gap-8',
          'rounded-2xl border-2 border-dashed p-16 transition-all duration-200',
          // デフォルト状態
          !isDragActive && !isParsing && 'border-border bg-card',
          // ドラッグオーバー（受理可能）
          isDragActive && isDragAccept && 'border-primary bg-primary/5 scale-[1.01]',
          // ドラッグオーバー（拒否）
          isDragActive && isDragReject && 'border-destructive bg-destructive/5',
          // 解析中
          isParsing && 'border-muted bg-muted/20 cursor-wait',
          // ホバー状態（通常時のみ）
          !isDragActive && !isParsing && 'hover:border-primary/50 hover:bg-muted/20 cursor-default',
        )}
      >
        {/* hidden input（react-dropzone が管理） */}
        <input {...getInputProps()} />

        {/* アイコン */}
        <div className="flex flex-col items-center gap-6 text-center">
          {isParsing ? (
            <Loader2
              className="h-16 w-16 animate-spin text-primary"
              strokeWidth={1.5}
            />
          ) : (
            <UploadCloud
              className={cn(
                'h-16 w-16 transition-colors',
                isDragActive && isDragAccept && 'text-primary',
                isDragActive && isDragReject && 'text-destructive',
                !isDragActive && 'text-muted-foreground',
              )}
              strokeWidth={1.5}
            />
          )}

          {/* メインテキスト */}
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
              {isParsing && 'ファイルを解析中...'}
              {!isParsing && isDragActive && isDragAccept && 'ドロップしてアップロード'}
              {!isParsing && isDragActive && isDragReject && 'このファイル形式には対応していません'}
              {!isParsing && !isDragActive && 'ファイルをドラッグ＆ドロップ'}
            </h1>
            <p className="text-base text-muted-foreground">
              {isParsing
                ? 'しばらくお待ちください'
                : 'または下のボタンからファイルを選択してください'}
            </p>
          </div>

          {/* 対応ファイル形式バッジ */}
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              .xlsx
            </span>
            <span className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              .xls
            </span>
            <span className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1">
              <FileSpreadsheet className="h-3.5 w-3.5" />
              .csv
            </span>
            <span className="flex items-center gap-1.5 rounded-full border bg-muted/40 px-3 py-1">
              <FileImage className="h-3.5 w-3.5" />
              .svg
            </span>
          </div>

          {/* ファイル選択ボタン */}
          <Button
            type="button"
            variant="default"
            size="lg"
            disabled={isParsing}
            onClick={open}
            className="px-8"
          >
            ファイルを選択
          </Button>

          {/* ファイルサイズ上限の案内 */}
          <p className="text-xs text-muted-foreground">
            最大ファイルサイズ: 50 MB
          </p>
        </div>
      </div>

      {/* エラーメッセージ */}
      {error && (
        <div className="mt-6 flex w-full max-w-2xl items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <p className="whitespace-pre-line">{error}</p>
        </div>
      )}
    </div>
  )
}
```

---

## 3. 実装の解説

### `noClick: true` を設定している理由

`useDropzone` のデフォルト設定では、ゾーン全体がクリックでファイルダイアログを
開くトリガーになる。しかしゾーン内に Button を置いた場合、
「ゾーンのクリック」と「ボタンのクリック」が二重に発火する可能性がある。

`noClick: true` でゾーン全体のクリックを無効にし、
`open` 関数を Button の `onClick` に直接渡すことで制御を一元化している。

```tsx
// ゾーン全体のクリックは無効
const { getRootProps, getInputProps, open } = useDropzone({
  noClick: true,
  // ...
})

// ボタンのクリックのみダイアログを開く
<Button onClick={open}>ファイルを選択</Button>
```

### ドラッグ状態の視覚フィードバック

`isDragActive`, `isDragAccept`, `isDragReject` を組み合わせて
3 種類の状態を表現している。

| 状態 | `isDragActive` | `isDragAccept` | `isDragReject` | 表示 |
|------|:---:|:---:|:---:|------|
| 通常 | false | false | false | グレーのボーダー |
| 対応ファイルをドラッグ中 | true | true | false | プライマリカラーのボーダー |
| 非対応ファイルをドラッグ中 | true | false | true | 赤いボーダー |
| 解析中 | - | - | - | ミュートカラー + ローディングアイコン |

### ファイルサイズ制限

`maxSize: 50 * 1024 * 1024`（50MB）を設定している。
クライアントサイドでの Excel 解析はメモリに全データを展開するため、
大きすぎるファイルはブラウザのクラッシュを引き起こす可能性がある。
実際のユースケースに応じて調整すること。

---

## 4. 次のステップへ

Step 04 完了後、Step 05 でデータテーブルの実装に進む。
