# Step 01 — ライブラリのインストールと shadcn コンポーネントの追加

## 概要

このステップでは、アプリに必要なすべてのサードパーティライブラリを
インストールし、shadcn/ui のコンポーネントを追加する。

---

## 1. npm パッケージのインストール

以下を一括でインストールする。

```bash
npm install \
  react-dropzone \
  xlsx \
  svgson \
  recharts \
  @dnd-kit/core \
  @dnd-kit/sortable \
  @dnd-kit/utilities \
  zustand \
  @tanstack/react-table
```

### 各パッケージの役割

| パッケージ | 役割 |
|-----------|------|
| `react-dropzone` | ドラッグ＆ドロップ対応のファイルアップロードゾーン |
| `xlsx` | Excel (.xlsx / .xls) および CSV (.csv) ファイルの解析（SheetJS）|
| `svgson` | SVG ファイルを JSON 構造に変換 |
| `recharts` | React 向けチャートライブラリ（shadcn chart が内部で使用）|
| `@dnd-kit/core` | ドラッグ＆ドロップのコア機能 |
| `@dnd-kit/sortable` | 並び替え用のユーティリティ（DndContext と組み合わせて使用）|
| `@dnd-kit/utilities` | CSS トランスフォームなどの DnD ヘルパー |
| `zustand` | 軽量グローバル状態管理 |
| `@tanstack/react-table` | shadcn DataTable が依存するヘッドレステーブルライブラリ |

---

## 2. TypeScript 型定義のインストール

svgson と xlsx はバンドル済みの型定義を持つが、一部のパッケージで
型が不足する場合は以下を追加する。

```bash
npm install --save-dev @types/react-dropzone
```

> react-dropzone v14 以降は型定義がパッケージ本体に含まれているため
> 通常は不要。インストール後にエラーが出た場合のみ追加すること。

---

## 3. shadcn コンポーネントの追加

### 3-1. 基本コンポーネント

```bash
npx shadcn@latest add button
npx shadcn@latest add card
npx shadcn@latest add dialog
npx shadcn@latest add input
npx shadcn@latest add label
npx shadcn@latest add select
npx shadcn@latest add badge
npx shadcn@latest add separator
npx shadcn@latest add table
npx shadcn@latest add scroll-area
```

### 3-2. チャートコンポーネント

```bash
npx shadcn@latest add chart
```

> `chart` コンポーネントは recharts をラップした shadcn 公式 wrapper。
> `ChartContainer`, `ChartTooltip`, `ChartTooltipContent`,
> `ChartLegend`, `ChartLegendContent` が `components/ui/chart.tsx` に生成される。

---

## 4. インストール後のディレクトリ確認

`components/ui/` に以下のファイルが存在することを確認する。

```
components/ui/
├── badge.tsx
├── button.tsx        ← 既存
├── card.tsx
├── chart.tsx         ← recharts wrapper
├── dialog.tsx
├── input.tsx
├── label.tsx
├── scroll-area.tsx
├── select.tsx
├── separator.tsx
└── table.tsx
```

---

## 5. package.json の確認（インストール後の期待値）

```json
{
  "dependencies": {
    "@dnd-kit/core": "^6.x",
    "@dnd-kit/sortable": "^8.x",
    "@dnd-kit/utilities": "^3.x",
    "@tanstack/react-table": "^8.x",
    "class-variance-authority": "^0.7.1",
    "clsx": "^2.1.1",
    "lucide-react": "^1.11.0",
    "next": "16.2.4",
    "radix-ui": "^1.4.3",
    "react": "19.2.4",
    "react-dom": "19.2.4",
    "react-dropzone": "^14.x",
    "recharts": "^2.x",
    "shadcn": "^4.4.0",
    "svgson": "^5.x",
    "tailwind-merge": "^3.5.0",
    "tw-animate-css": "^1.4.0",
    "xlsx": "^0.18.x",
    "zustand": "^5.x"
  }
}
```

---

## 6. 次のステップへ

Step 01 完了後、Step 02 で Zustand ストアの定義に進む。
