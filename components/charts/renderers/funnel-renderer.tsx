'use client'

import { FunnelChart, Funnel, LabelList, Cell } from 'recharts'
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

export function FunnelRenderer({ chart, rows }: Props) {
  const { xAxisKey, yAxisKeys, aggregation } = chart
  const data = buildChartData(rows, xAxisKey, yAxisKeys, aggregation)

  const funnelData = data
    .map((row, index) => ({
      name: String(row[xAxisKey] ?? ''),
      value: Number(row[yAxisKeys[0]] ?? 0),
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }))
    .sort((a, b) => b.value - a.value)

  const funnelConfig: ShadcnChartConfig = Object.fromEntries(
    funnelData.map((entry, index) => [
      entry.name,
      { label: entry.name, color: CHART_COLORS[index % CHART_COLORS.length] },
    ]),
  )

  return (
    <ChartContainer config={funnelConfig} className="h-64 w-full">
      <FunnelChart margin={{ top: 4, right: 4, left: 4, bottom: 4 }}>
        <ChartTooltip content={<ChartTooltipContent />} />
        <Funnel dataKey="value" data={funnelData} isAnimationActive>
          <LabelList
            position="center"
            fill="white"
            stroke="none"
            dataKey="name"
            fontSize={11}
          />
          {funnelData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Funnel>
      </FunnelChart>
    </ChartContainer>
  )
}
