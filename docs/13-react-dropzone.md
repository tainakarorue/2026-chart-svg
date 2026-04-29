# 13. react-dropzone

## 概要

`useDropzone` フック 1 つで、ドラッグ&ドロップ領域とファイル選択ダイアログを実装できるライブラリ。

---

## 基本構造

```tsx
import { useDropzone, type FileRejection } from 'react-dropzone'

const {
  getRootProps,   // ドロップゾーン div に spread する props
  getInputProps,  // hidden <input type="file"> に spread する props
  isDragActive,   // カーソルがゾーン上にあるか
  isDragAccept,   // 受理可能なファイルがドラッグ中か
  isDragReject,   // 拒否されるファイルがドラッグ中か
  open,           // プログラムからファイル選択ダイアログを開く関数
} = useDropzone({ ...options })
```

---

## 1. オプション設定

```tsx
// components/upload/drop-zone.tsx
const ACCEPTED_FILE_TYPES = {
  // キー: MIME タイプ、値: 許可する拡張子の配列
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  'application/vnd.ms-excel': ['.xls'],
  'text/csv': ['.csv'],
}

const { getRootProps, getInputProps, isDragActive, isDragAccept, isDragReject, open } =
  useDropzone({
    onDrop,                      // ファイルドロップ/選択時のコールバック
    accept: ACCEPTED_FILE_TYPES, // 受け入れる MIME タイプと拡張子
    maxFiles: 1,                 // 同時に受け付けるファイル数
    maxSize: 50 * 1024 * 1024,   // ファイルサイズ上限（50MB）
    disabled: isParsing,         // true の間はドラッグもクリックも無効
    noClick: true,               // ゾーン全体クリックによるダイアログを無効化
  })
```

### よく使うオプション一覧

| オプション | 型 | 説明 |
|---|---|---|
| `onDrop` | `(accepted, rejected) => void` | ドロップ/選択時のコールバック |
| `accept` | `Record<string, string[]>` | 許可する MIME タイプと拡張子 |
| `maxFiles` | `number` | 同時受付ファイル数（超えると rejected に入る） |
| `maxSize` | `number` | バイト単位のサイズ上限 |
| `disabled` | `boolean` | ゾーン全体を無効化 |
| `noClick` | `boolean` | クリックによるダイアログ開封を無効化 |
| `noDrag` | `boolean` | ドラッグ受付を無効化 |
| `multiple` | `boolean` | 複数ファイルを許可（デフォルト `true`） |

---

## 2. `onDrop` コールバック

```tsx
const onDrop = useCallback(
  (acceptedFiles: File[], rejectedFiles: FileRejection[]) => {
    // 拒否ファイルのみの場合は何もしない（isDragReject で UI フィードバック済み）
    if (rejectedFiles.length > 0 && acceptedFiles.length === 0) return

    if (acceptedFiles.length > 0) {
      parseFile(acceptedFiles[0])  // maxFiles: 1 なので先頭のみ処理
    }
  },
  [parseFile],
)
```

- `acceptedFiles` — `accept` / `maxSize` / `maxFiles` を通過した `File[]`
- `rejectedFiles` — 拒否された `FileRejection[]`（`{ file, errors }` の配列）
- `useCallback` の依存配列を忘れずに指定する

---

## 3. JSX への適用

```tsx
return (
  <div
    {...getRootProps()}   // onDrop, onDragOver など DnD イベントを注入
    className={cn(
      'rounded-2xl border-2 border-dashed p-16 transition-all',
      isDragActive && isDragAccept && 'border-primary bg-primary/5',
      isDragActive && isDragReject && 'border-destructive bg-destructive/5',
    )}
  >
    {/* react-dropzone が管理する hidden input — 必須 */}
    <input {...getInputProps()} />

    {/* ボタンから open() を呼んでダイアログを開く（noClick: true のため） */}
    <Button onClick={open} disabled={isParsing}>
      ファイルを選択
    </Button>
  </div>
)
```

### ポイント

- `<input {...getInputProps()} />` は **必ず** ゾーン内に置く（`display: none` で自動的に隠れる）
- `getRootProps()` を付けた要素がドラッグ検知の対象になる
- `noClick: true` にした場合、ダイアログを開くには `open()` を任意のボタンの `onClick` に渡す

---

## 4. ドラッグ状態フラグの使い分け

| フラグ | `isDragActive` | `isDragAccept` | `isDragReject` |
|---|---|---|---|
| 何もドラッグしていない | `false` | `false` | `false` |
| 対応形式をドラッグ中 | `true` | `true` | `false` |
| 非対応形式をドラッグ中 | `true` | `false` | `true` |

```tsx
// 状態に応じた UI 切り替えの例
const label =
  isParsing                        ? 'ファイルを解析中...'
  : isDragActive && isDragAccept   ? 'ドロップしてアップロード'
  : isDragActive && isDragReject   ? 'このファイル形式には対応していません'
  :                                  'ファイルをドラッグ＆ドロップ'
```

---

## 5. `accept` の MIME タイプ指定

```ts
const ACCEPTED_FILE_TYPES = {
  // Excel 2007+（.xlsx）
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
  // Excel 97-2003（.xls）
  'application/vnd.ms-excel': ['.xls'],
  // CSV
  'text/csv': ['.csv'],
  // 画像なら
  'image/png': ['.png'],
  'image/jpeg': ['.jpg', '.jpeg'],
}
```

- 拡張子だけでなく MIME タイプも一致しないと受理されない
- OS によって MIME タイプが異なる場合があるため、MIME + 拡張子を両方指定するのが安全

---

## 実装チェックリスト

1. `useDropzone` に `accept` / `maxFiles` / `maxSize` を設定する
2. `onDrop` を `useCallback` でメモ化し、`acceptedFiles[0]` を処理する
3. ゾーン div に `{...getRootProps()}` を spread する
4. ゾーン内に `<input {...getInputProps()} />` を置く
5. `noClick: true` にする場合は `open()` をボタンの `onClick` に渡す
6. `isDragAccept` / `isDragReject` で UI フィードバックを出し分ける
7. `disabled` で処理中の二重ドロップを防ぐ
