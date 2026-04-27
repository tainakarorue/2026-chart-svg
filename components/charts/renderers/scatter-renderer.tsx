'use client'

import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  type ChartConfig as ShadcnChartConfig,
} from '@/components/ui/chart'
import type { ChartConfig, Row } from '@/lib/store/dashboard'
import { CHART_COLORS, buildChartData } from './shared'

interface Props {
  chart: ChartConfig
  rows: Row[]
}

export function ScatterRenderer({ chart, rows }: Props) {
  const { xAxisKey, yAxisKeys, aggregation } = chart
  const data = buildChartData(rows, xAxisKey, yAxisKeys, aggregation)

  const scatterData = data.map((row) => ({
    x: Number(row[xAxisKey] ?? 0),
    y: Number(row[yAxisKeys[0]] ?? 0),
  }))

  const scatterConfig: ShadcnChartConfig = {
    scatter: {
      label: `${xAxisKey} / ${yAxisKeys[0]}`,
      color: CHART_COLORS[0],
    },
  }

  return (
    <ChartContainer config={scatterConfig} className="h-64 w-full">
      <ScatterChart margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
        <XAxis
          type="number"
          dataKey="x"
          name={xAxisKey}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          label={{ value: xAxisKey, position: 'insideBottom', offset: -4, fontSize: 11 }}
        />
        <YAxis
          type="number"
          dataKey="y"
          name={yAxisKeys[0]}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={40}
        />
        <ChartTooltip content={<ChartTooltipContent />} cursor={{ strokeDasharray: '3 3' }} />
        <Scatter data={scatterData} fill={CHART_COLORS[0]} fillOpacity={0.7} />
      </ScatterChart>
    </ChartContainer>
  )
}
