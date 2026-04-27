'use client'

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
} from '@/components/ui/chart'
import type { ChartConfig, Row } from '@/lib/store/dashboard'
import {
  CHART_COLORS,
  buildShadcnConfig,
  buildChartData,
  buildXAxisProps,
  computeAvg,
} from './shared'

interface Props {
  chart: ChartConfig
  rows: Row[]
}

export function BarRenderer({ chart, rows }: Props) {
  const { xAxisKey, yAxisKeys, aggregation, stacked } = chart
  const shadcnConfig = buildShadcnConfig(yAxisKeys)
  const data = buildChartData(rows, xAxisKey, yAxisKeys, aggregation)
  const xAxisProps = buildXAxisProps(data, xAxisKey)
  const stackId = stacked ? 'a' : undefined

  return (
    <ChartContainer config={shadcnConfig} className="h-64 w-full">
      <BarChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <defs>
          {yAxisKeys.map((key, index) => (
            <linearGradient key={key} id={`bar-grad-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={1} />
              <stop offset="100%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.35} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis {...xAxisProps} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {yAxisKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={`url(#bar-grad-${key})`}
            radius={stacked ? undefined : [4, 4, 0, 0]}
            stackId={stackId}
          />
        ))}
        {!stacked &&
          yAxisKeys.map((key, index) => (
            <ReferenceLine
              key={`ref-${key}`}
              y={computeAvg(data, key)}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeDasharray="4 2"
              strokeOpacity={0.5}
            />
          ))}
      </BarChart>
    </ChartContainer>
  )
}
