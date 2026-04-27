'use client'

import { PieChart, Pie, Cell } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig as ShadcnChartConfig,
} from '@/components/ui/chart'
import type { ChartConfig, Row } from '@/lib/store/dashboard'
import { CHART_COLORS, buildChartData } from './shared'

interface Props {
  chart: ChartConfig
  rows: Row[]
}

export function DonutRenderer({ chart, rows }: Props) {
  const { xAxisKey, yAxisKeys, aggregation } = chart
  const data = buildChartData(rows, xAxisKey, yAxisKeys, aggregation)

  const pieData = data.map((row) => ({
    name: String(row[xAxisKey] ?? ''),
    value: Number(row[yAxisKeys[0]] ?? 0),
  }))

  const donutConfig: ShadcnChartConfig = Object.fromEntries(
    pieData.map((entry, index) => [
      entry.name,
      { label: entry.name, color: CHART_COLORS[index % CHART_COLORS.length] },
    ]),
  )

  return (
    <ChartContainer config={donutConfig} className="h-72 w-full">
      <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
        <Pie
          data={pieData}
          dataKey="value"
          nameKey="name"
          cx="50%"
          cy="50%"
          innerRadius={45}
          outerRadius={75}
          paddingAngle={3}
        >
          {pieData.map((_entry, index) => (
            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
          ))}
        </Pie>
        <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
        <ChartLegend content={<ChartLegendContent />} />
      </PieChart>
    </ChartContainer>
  )
}
