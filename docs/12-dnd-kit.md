# 12. dnd-kit — ドラッグ&ドロップ

## インストール済みパッケージ

| パッケージ | 役割 |
|---|---|
| `@dnd-kit/core` | DnD の核心ロジック（センサー、コンテキスト、オーバーレイ） |
| `@dnd-kit/sortable` | 並び替え専用の高レベル API |
| `@dnd-kit/utilities` | CSS 変換ヘルパー（`CSS.Transform`） |

---

## 概念の全体像

```
DndContext                  ← ドラッグの「場」を定義
  └─ SortableContext        ← 並び替えリストの範囲と順序を渡す
       └─ <各アイテム>      ← useSortable() で個別アイテムを登録
  DragOverlay               ← ドラッグ中にカーソルに追従するクローン
```

---

## 1. 親コンポーネント（`DndContext` + `SortableContext`）

```tsx
// components/charts/chart-grid.tsx
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import {
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  arrayMove,
} from '@dnd-kit/sortable'

export function ChartGrid() {
  const [activeId, setActiveId] = useState<string | null>(null)

  // --- センサー設定 ---
  // PointerSensor: マウス/タッチ。distance:8 で 8px 動いたらドラッグ開始
  // KeyboardSensor: キーボード操作（アクセシビリティ）
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  )

  function handleDragStart(event: DragStartEvent) {
    setActiveId(String(event.active.id))
  }

  function handleDragEnd(event: DragEndEvent) {
    setActiveId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    // arrayMove で新しい順序配列を作り、ストアに反映
    const oldIndex = chartOrder.indexOf(String(active.id))
    const newIndex = chartOrder.indexOf(String(over.id))
    reorderCharts(arrayMove(chartOrder, oldIndex, newIndex))
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}   // 最も近い中心点で衝突判定
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={() => setActiveId(null)}
    >
      {/* items にはアイテム ID の配列を渡す（順序がここで決まる） */}
      <SortableContext items={chartOrder} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-3 gap-4">
          {orderedCharts.map((chart) => (
            <ChartCard key={chart.id} chart={chart} />
          ))}
        </div>
      </SortableContext>

      {/* ドラッグ中だけ表示されるカーソル追従クローン */}
      <DragOverlay>
        {activeChart ? <ChartCard chart={activeChart} /> : null}
      </DragOverlay>
    </DndContext>
  )
}
```

### ポイント

- `collisionDetection={closestCenter}` — グリッドレイアウトに最適な衝突アルゴリズム
- `strategy={rectSortingStrategy}` — 2D グリッド向けの並び替え戦略（`verticalListSortingStrategy` は 1 列リスト用）
- `arrayMove(arr, oldIndex, newIndex)` — イミュータブルに並び替えた新配列を返す

---

## 2. 子コンポーネント（`useSortable`）

```tsx
// components/charts/chart-card.tsx
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

export function ChartCard({ chart }: { chart: ChartConfig }) {
  const {
    attributes,   // aria-* などのアクセシビリティ属性
    listeners,    // onPointerDown, onKeyDown などのイベント
    setNodeRef,   // DOM ノードを dnd-kit に登録する ref
    transform,    // ドラッグ中の移動量 { x, y, scaleX, scaleY }
    transition,   // CSS transition 文字列
    isDragging,   // このアイテムがドラッグ中かどうか
  } = useSortable({ id: chart.id })

  const style = {
    transform: CSS.Transform.toString(transform),  // translate3d(x, y, 0) に変換
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={isDragging ? 'opacity-0' : ''}   // ドラッグ中は元位置を非表示
    >
      {/* ドラッグハンドル: listeners をハンドル要素だけに付ける */}
      <button
        {...attributes}
        {...listeners}
        className="cursor-grab touch-none active:cursor-grabbing"
        aria-label="移動"
      >
        <GripVertical />
      </button>

      {/* カードのコンテンツ */}
    </Card>
  )
}
```

### ポイント

- `setNodeRef` をドラッグ対象の **最外 DOM 要素** に必ず付ける
- `{...attributes}` `{...listeners}` は **ドラッグハンドル** にだけ付けると、カード内のボタンクリックが誤ってドラッグ開始しない
- `isDragging` が `true` の間、元の DOM は `opacity-0` にして **DragOverlay** のクローンだけ見せる

---

## 3. DragOverlay の役割

| | 元のアイテム（`useSortable`） | `DragOverlay` |
|---|---|---|
| ドラッグ中の表示 | `opacity-0`（非表示） | カーソルに追従して表示 |
| CSS 変換 | グリッド内でスムーズに動く | 自由に動く（グリッド制約なし） |
| col-span | 通常通り適用 | 適用しない（グリッド外） |

---

## 4. `CSS.Transform.toString`（`@dnd-kit/utilities`）

```ts
import { CSS } from '@dnd-kit/utilities'

// transform は { x: 10, y: 20, scaleX: 1, scaleY: 1 } のようなオブジェクト
const style = {
  transform: CSS.Transform.toString(transform),
  // → "translate3d(10px, 20px, 0) scaleX(1) scaleY(1)"
}
```

`CSS.Transform.toString` は null セーフ（transform が null のとき `undefined` を返す）。

---

## 実装の流れ（チェックリスト）

1. `DndContext` で全体を囲み、センサーと `onDragEnd` を設定
2. `SortableContext` に ID 配列と strategy を渡す
3. 各アイテムで `useSortable({ id })` を呼び、`ref / style / attributes / listeners` を適用
4. ドラッグ中アイテムを `isDragging` で非表示にし、`DragOverlay` でクローンを表示
5. `onDragEnd` の `arrayMove` 結果を状態（Zustand 等）に反映
