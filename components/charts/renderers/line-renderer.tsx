'use client'

import { LineChart, Line, XAxis, YAxis, CartesianGrid, ReferenceLine } from 'recharts'
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

export function LineRenderer({ chart, rows }: Props) {
  const { xAxisKey, yAxisKeys, aggregation, lineType = 'monotone', showDots = false } = chart
  const shadcnConfig = buildShadcnConfig(yAxisKeys)
  const data = buildChartData(rows, xAxisKey, yAxisKeys, aggregation)
  const xAxisProps = buildXAxisProps(data, xAxisKey)

  return (
    <ChartContainer config={shadcnConfig} className="h-64 w-full">
      <LineChart data={data} margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-border" />
        <XAxis {...xAxisProps} />
        <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} width={40} />
        <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
        <ChartLegend content={<ChartLegendContent />} />
        {yAxisKeys.map((key, index) => (
          <Line
            key={key}
            type={lineType}
            dataKey={key}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            strokeWidth={2}
            dot={showDots ? { r: 3 } : false}
            activeDot={{ r: 4 }}
          />
        ))}
        {yAxisKeys.map((key, index) => (
          <ReferenceLine
            key={`ref-${key}`}
            y={computeAvg(data, key)}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            strokeDasharray="4 2"
            strokeOpacity={0.5}
          />
        ))}
      </LineChart>
    </ChartContainer>
  )
}
