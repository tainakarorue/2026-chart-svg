'use client'

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts'
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

export function AreaRenderer({ chart, rows }: Props) {
  const { xAxisKey, yAxisKeys, aggregation, stacked, lineType = 'monotone' } = chart
  const shadcnConfig = buildShadcnConfig(yAxisKeys)
  const data = buildChartData(rows, xAxisKey, yAxisKeys, aggregation)
  const xAxisProps = buildXAxisProps(data, xAxisKey)
  const stackId = stacked ? 'a' : undefined

  return (
    <ChartContainer config={shadcnConfig} className="h-64 w-full">
      <AreaChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <defs>
          {yAxisKeys.map((key, index) => (
            <linearGradient key={key} id={`area-fill-${key}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.35} />
              <stop offset="95%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis {...xAxisProps} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <ChartLegend content={<ChartLegendContent />} />
        {yAxisKeys.map((key, index) => (
          <Area
            key={key}
            type={lineType}
            dataKey={key}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            fill={`url(#area-fill-${key})`}
            strokeWidth={2}
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
      </AreaChart>
    </ChartContainer>
  )
}
