'use client'

import type { ChartConfig, Row } from '@/lib/store/dashboard'
import { BarRenderer } from './renderers/bar-renderer'
import { BarHorizontalRenderer } from './renderers/bar-horizontal-renderer'
import { LineRenderer } from './renderers/line-renderer'
import { AreaRenderer } from './renderers/area-renderer'
import { PieRenderer } from './renderers/pie-renderer'
import { DonutRenderer } from './renderers/donut-renderer'
import { RadarRenderer } from './renderers/radar-renderer'
import { ScatterRenderer } from './renderers/scatter-renderer'
import { FunnelRenderer } from './renderers/funnel-renderer'

interface ChartRendererProps {
  chart: ChartConfig
  rows: Row[]
}

export function ChartRenderer({ chart, rows }: ChartRendererProps) {
  switch (chart.type) {
    case 'bar':           return <BarRenderer chart={chart} rows={rows} />
    case 'barHorizontal': return <BarHorizontalRenderer chart={chart} rows={rows} />
    case 'line':          return <LineRenderer chart={chart} rows={rows} />
    case 'area':          return <AreaRenderer chart={chart} rows={rows} />
    case 'pie':           return <PieRenderer chart={chart} rows={rows} />
    case 'donut':         return <DonutRenderer chart={chart} rows={rows} />
    case 'radar':         return <RadarRenderer chart={chart} rows={rows} />
    case 'scatter':       return <ScatterRenderer chart={chart} rows={rows} />
    case 'funnel':        return <FunnelRenderer chart={chart} rows={rows} />
    default:              return null
  }
}
