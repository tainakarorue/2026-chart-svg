'use client'

import {
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
} from 'recharts'
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
} from './shared'

interface Props {
  chart: ChartConfig
  rows: Row[]
}

export function RadarRenderer({ chart, rows }: Props) {
  const { xAxisKey, yAxisKeys, aggregation } = chart
  const shadcnConfig = buildShadcnConfig(yAxisKeys)
  const data = buildChartData(rows, xAxisKey, yAxisKeys, aggregation)

  return (
    <ChartContainer config={shadcnConfig} className="h-64 w-full">
      <RadarChart
        data={data}
        cx="50%"
        cy="50%"
        outerRadius="70%"
        margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
      >
        <defs>
          {yAxisKeys.map((key, index) => (
            <radialGradient key={key} id={`radar-grad-${key}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.05} />
              <stop offset="100%" stopColor={CHART_COLORS[index % CHART_COLORS.length]} stopOpacity={0.45} />
            </radialGradient>
          ))}
        </defs>
        <PolarGrid className="stroke-border" />
        <PolarAngleAxis
          dataKey={xAxisKey}
          tick={{ fontSize: 11 }}
          tickFormatter={(v: unknown) => {
            const s = String(v ?? '')
            return s.length > X_LABEL_TRUNCATE_AT ? `${s.slice(0, X_LABEL_TRUNCATE_AT)}…` : s
          }}
        />
        <ChartTooltip content={<ChartTooltipContent />} />
        <ChartLegend content={<ChartLegendContent />} />
        {yAxisKeys.map((key, index) => (
          <Radar
            key={key}
            dataKey={key}
            stroke={CHART_COLORS[index % CHART_COLORS.length]}
            fill={`url(#radar-grad-${key})`}
            fillOpacity={1}
          />
        ))}
      </RadarChart>
    </ChartContainer>
  )
}
