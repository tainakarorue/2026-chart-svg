import type { ChartConfig as ShadcnChartConfig } from '@/components/ui/chart'
import type { Aggregation, Row } from '@/lib/store/dashboard'

export const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

export function buildShadcnConfig(yAxisKeys: string[]): ShadcnChartConfig {
  return Object.fromEntries(
    yAxisKeys.map((key, index) => [
      key,
      {
        label: key,
        color: CHART_COLORS[index % CHART_COLORS.length],
      },
    ]),
  )
}

export function buildChartData(
  rows: Row[],
  xAxisKey: string,
  yAxisKeys: string[],
  aggregation: Aggregation,
): Record<string, unknown>[] {
  if (aggregation === 'none') {
    return rows.map((row) => {
      const entry: Record<string, unknown> = { [xAxisKey]: row[xAxisKey] }
      for (const key of yAxisKeys) entry[key] = row[key]
      return entry
    })
  }

  const groups = new Map<unknown, Row[]>()
  for (const row of rows) {
    const xVal = row[xAxisKey]
    const bucket = groups.get(xVal)
    if (bucket) {
      bucket.push(row)
    } else {
      groups.set(xVal, [row])
    }
  }

  return Array.from(groups.entries()).map(([xVal, bucket]) => {
    const entry: Record<string, unknown> = { [xAxisKey]: xVal }

    for (const key of yAxisKeys) {
      if (aggregation === 'count') {
        entry[key] = bucket.length
      } else {
        const nums = bucket
          .map((r) => r[key])
          .filter((v): v is number => typeof v === 'number')

        if (aggregation === 'sum') {
          entry[key] = nums.reduce((a, b) => a + b, 0)
        } else if (aggregation === 'avg') {
          entry[key] =
            nums.length > 0
              ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
              : 0
        } else if (aggregation === 'min') {
          entry[key] = nums.length > 0 ? Math.min(...nums) : 0
        } else {
          // max
          entry[key] = nums.length > 0 ? Math.max(...nums) : 0
        }
      }
    }

    return entry
  })
}

export const X_LABEL_ANGLE_THRESHOLD = 8
export const X_LABEL_TRUNCATE_AT = 15
export const X_AXIS_ANGLED_HEIGHT = 64

export function buildXAxisProps(data: Record<string, unknown>[], xAxisKey: string) {
  const maxLen = data.reduce(
    (m, d) => Math.max(m, String(d[xAxisKey] ?? '').length),
    0,
  )
  const isLong = maxLen > X_LABEL_ANGLE_THRESHOLD

  return {
    dataKey: xAxisKey,
    tick: { fontSize: 11 },
    tickLine: false as const,
    axisLine: false as const,
    ...(isLong && {
      angle: -35,
      textAnchor: 'end' as const,
      height: X_AXIS_ANGLED_HEIGHT,
      interval: 0,
    }),
    tickFormatter: (v: unknown) => {
      const s = String(v ?? '')
      return s.length > X_LABEL_TRUNCATE_AT ? `${s.slice(0, X_LABEL_TRUNCATE_AT)}…` : s
    },
  }
}

export function computeAvg(data: Record<string, unknown>[], key: string): number {
  const nums = data
    .map((d) => Number(d[key]))
    .filter((v) => !isNaN(v))
  return nums.length > 0 ? nums.reduce((a, b) => a + b, 0) / nums.length : 0
}
