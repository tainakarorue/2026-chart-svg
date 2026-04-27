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
  X_LABEL_TRUNCATE_AT,
  computeAvg,
} from './shared'

interface Props {
  chart: ChartConfig
  rows: Row[]
}

export function BarHorizontalRenderer({ chart, rows }: Props) {
  const { xAxisKey, yAxisKeys, aggregation, stacked } = chart
  const shadcnConfig = buildShadcnConfig(yAxisKeys)
  const data = buildChartData(rows, xAxisKey, yAxisKeys, aggregation)
  const stackId = stacked ? 'a' : undefined

  const maxLabelLen = data.reduce(
    (m, d) => Math.max(m, String(d[xAxisKey] ?? '').length),
    0,
  )
  const yAxisWidth = Math.min(Math.max(maxLabelLen * 7, 48), 160)

  return (
    <ChartContainer config={shadcnConfig} className="h-64 w-full">
      <BarChart
        layout="vertical"
        data={data}
        margin={{ top: 4, right: 16, left: 4, bottom: 4 }}
      >
        <defs>
          {yAxisKeys.map((key, index) => (
            <linearGradient key={key} id={`barh-grad-${key}`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.35} />
              <stop offset="100%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={1} />
            </linearGradient>
          ))}
        </defs>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} className="stroke-border" />
        <XAxis
          type="number"
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          type="category"
          dataKey={xAxisKey}
          tick={{ fontSize: 11 }}
          tickLine={false}
          axisLine={false}
          width={yAxisWidth}
          tickFormatter={(v: unknown) => {
            const s = String(v ?? '')
            return s.length > X_LABEL_TRUNCATE_AT ? `${s.slice(0, X_LABEL_TRUNCATE_AT)}…` : s
          }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {yAxisKeys.map((key, index) => (
          <Bar
            key={key}
            dataKey={key}
            fill={`url(#barh-grad-${key})`}
            radius={stacked ? undefined : [0, 4, 4, 0]}
            stackId={stackId}
          />
        ))}
        {!stacked &&
          yAxisKeys.map((key, index) => (
            <ReferenceLine
              key={`ref-${key}`}
              x={computeAvg(data, key)}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeDasharray="4 2"
              strokeOpacity={0.5}
            />
          ))}
      </BarChart>
    </ChartContainer>
  )
}
