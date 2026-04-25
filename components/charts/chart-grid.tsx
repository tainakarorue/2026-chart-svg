'use client'

import { useState } from 'react'
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
import { cn } from '@/lib/utils'
import { useDashboardStore } from '@/lib/store/dashboard'
import { ChartCard } from './chart-card'
import { AddChartCard } from './add-chart-card'
import { ChartModal } from './chart-modal'

export function ChartGrid() {
  const { charts, chartOrder, reorderCharts } = useDashboardStore()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeId, setActiveId] = useState<string | null>(null)

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

    const oldIndex = chartOrder.indexOf(String(active.id))
    const newIndex = chartOrder.indexOf(String(over.id))

    if (oldIndex === -1 || newIndex === -1) return

    reorderCharts(arrayMove(chartOrder, oldIndex, newIndex))
  }

  function handleDragCancel() {
    setActiveId(null)
  }

  const orderedCharts = chartOrder
    .map((id) => charts.find((c) => c.id === id))
    .filter((c): c is NonNullable<typeof c> => c !== undefined)

  const activeChart = activeId
    ? charts.find((c) => c.id === activeId) ?? null
    : null

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <SortableContext items={chartOrder} strategy={rectSortingStrategy}>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {orderedCharts.map((chart) => (
              <ChartCard
                key={chart.id}
                chart={chart}
                className={cn(
                  chart.colSpan === 2 && 'sm:col-span-2',
                  chart.colSpan === 3 && 'sm:col-span-2 xl:col-span-3',
                )}
              />
            ))}
            <AddChartCard onAdd={() => setIsModalOpen(true)} />
          </div>
        </SortableContext>

        {/* ドラッグ中のカーソル追従クローン。col-span は適用しない（グリッド外）*/}
        <DragOverlay>
          {activeChart ? (
            <ChartCard
              chart={activeChart}
              className="shadow-2xl opacity-95"
            />
          ) : null}
        </DragOverlay>
      </DndContext>

      <ChartModal open={isModalOpen} onOpenChange={setIsModalOpen} />
    </>
  )
}
