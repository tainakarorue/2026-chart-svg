'use client'

import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts'
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  type ChartConfig as ShadcnChartConfig,
} from '@/components/ui/chart'
import type { Aggregation, ChartConfig, Row } from '@/lib/store/dashboard'

interface ChartRendererProps {
  chart: ChartConfig
  rows: Row[]
}

/**
 * shadcn chart（recharts）の色変数。
 * globals.css の --chart-1 〜 --chart-5 にマッピングされている。
 */
const CHART_COLORS = [
  'var(--chart-1)',
  'var(--chart-2)',
  'var(--chart-3)',
  'var(--chart-4)',
  'var(--chart-5)',
]

/**
 * ChartConfig（ストア定義）と shadcn の ChartConfig（色・ラベル設定）は別物。
 * この関数で shadcn 用の設定オブジェクトを生成する。
 */
function buildShadcnConfig(yAxisKeys: string[]): ShadcnChartConfig {
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

/**
 * rows から recharts が受け取れる形式のデータ配列を生成する。
 * aggregation が 'none' 以外の場合は X 軸キーでグルーピングして集計する。
 */
function buildChartData(
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

  // X 軸の値でグルーピング（挿入順を保持するため Map を使用）
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
        } else {
          // avg
          entry[key] =
            nums.length > 0
              ? Math.round((nums.reduce((a, b) => a + b, 0) / nums.length) * 100) / 100
              : 0
        }
      }
    }

    return entry
  })
}

/** この文字数を超えたら X 軸ラベルを斜め表示に切り替える */
const X_LABEL_ANGLE_THRESHOLD = 8
/** この文字数を超えたラベルは末尾を … で切り捨てる */
const X_LABEL_TRUNCATE_AT = 15
/** 斜め表示時の XAxis 高さ (px) */
const X_AXIS_ANGLED_HEIGHT = 64

/**
 * データの最長 X 軸ラベル長に応じて XAxis props を返す。
 * - 短い: そのまま水平表示
 * - 長い: -35° 回転 + 全件表示 + 高さ拡張
 * - 極端に長い: tickFormatter で 15 文字に切り捨て
 */
function buildXAxisProps(data: Record<string, unknown>[], xAxisKey: string) {
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

export function ChartRenderer({ chart, rows }: ChartRendererProps) {
  const { type, xAxisKey, yAxisKeys, aggregation } = chart
  const shadcnConfig = buildShadcnConfig(yAxisKeys)
  const data = buildChartData(rows, xAxisKey, yAxisKeys, aggregation)
  const xAxisProps = buildXAxisProps(data, xAxisKey)

  // ----------------------------------------
  // 棒グラフ
  // ----------------------------------------
  if (type === 'bar') {
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
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stroke-border"
          />
          <XAxis {...xAxisProps} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <ChartTooltip content={<ChartTooltipContent />} />
          <ChartLegend content={<ChartLegendContent />} />
          {yAxisKeys.map((key, index) => (
            <Bar
              key={key}
              dataKey={key}
              fill={`url(#bar-grad-${key})`}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ChartContainer>
    )
  }

  // ----------------------------------------
  // 折れ線グラフ
  // ----------------------------------------
  if (type === 'line') {
    return (
      <ChartContainer config={shadcnConfig} className="h-64 w-full">
        <LineChart
          data={data}
          margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stroke-border"
          />
          <XAxis {...xAxisProps} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          <ChartLegend content={<ChartLegendContent />} />
          {yAxisKeys.map((key, index) => (
            <Line
              key={key}
              type="monotone"
              dataKey={key}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              strokeWidth={2}
              dot={false}
              activeDot={{ r: 4 }}
            />
          ))}
        </LineChart>
      </ChartContainer>
    )
  }

  // ----------------------------------------
  // エリアグラフ（グラデーション fill）
  // ----------------------------------------
  if (type === 'area') {
    return (
      <ChartContainer config={shadcnConfig} className="h-64 w-full">
        <AreaChart
          data={data}
          margin={{ top: 4, right: 4, left: 4, bottom: 4 }}
        >
          <defs>
            {yAxisKeys.map((key, index) => (
              <linearGradient
                key={key}
                id={`fill-${key}`}
                x1="0"
                y1="0"
                x2="0"
                y2="1"
              >
                <stop
                  offset="5%"
                  stopColor={CHART_COLORS[index % CHART_COLORS.length]}
                  stopOpacity={0.35}
                />
                <stop
                  offset="95%"
                  stopColor={CHART_COLORS[index % CHART_COLORS.length]}
                  stopOpacity={0}
                />
              </linearGradient>
            ))}
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            className="stroke-border"
          />
          <XAxis {...xAxisProps} />
          <YAxis
            tick={{ fontSize: 11 }}
            tickLine={false}
            axisLine={false}
            width={40}
          />
          <ChartTooltip content={<ChartTooltipContent indicator="dot" />} />
          <ChartLegend content={<ChartLegendContent />} />
          {yAxisKeys.map((key, index) => (
            <Area
              key={key}
              type="monotone"
              dataKey={key}
              stroke={CHART_COLORS[index % CHART_COLORS.length]}
              fill={`url(#fill-${key})`}
              strokeWidth={2}
            />
          ))}
        </AreaChart>
      </ChartContainer>
    )
  }

  // ----------------------------------------
  // 円グラフ（Y軸の先頭キーのみ使用）
  // ----------------------------------------
  if (type === 'pie') {
    const pieData = data.map((row) => ({
      name: String(row[xAxisKey] ?? ''),
      value: Number(row[yAxisKeys[0]] ?? 0),
    }))

    // 各スライスのカテゴリー名をキーとした動的 config を組み立てる
    const pieConfig: ShadcnChartConfig = Object.fromEntries(
      pieData.map((entry, index) => [
        entry.name,
        {
          label: entry.name,
          color: CHART_COLORS[index % CHART_COLORS.length],
        },
      ]),
    )

    return (
      <ChartContainer config={pieConfig} className="h-72 w-full">
        <PieChart margin={{ top: 8, right: 8, left: 8, bottom: 8 }}>
          <Pie
            data={pieData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            outerRadius={75}
            paddingAngle={2}
            label={({ percent }) =>
              (percent ?? 0) >= 0.05
                ? `${((percent ?? 0) * 100).toFixed(0)}%`
                : ''
            }
            labelLine
          >
            {pieData.map((_entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={CHART_COLORS[index % CHART_COLORS.length]}
              />
            ))}
          </Pie>
          <ChartTooltip content={<ChartTooltipContent nameKey="name" />} />
        </PieChart>
      </ChartContainer>
    )
  }

  // ----------------------------------------
  // レーダーチャート
  // ----------------------------------------
  if (type === 'radar') {
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
              return s.length > X_LABEL_TRUNCATE_AT
                ? `${s.slice(0, X_LABEL_TRUNCATE_AT)}…`
                : s
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

  // ----------------------------------------
  // 散布図（X軸と Y軸の先頭キーを使用）
  // ----------------------------------------
  if (type === 'scatter') {
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
            label={{
              value: xAxisKey,
              position: 'insideBottom',
              offset: -4,
              fontSize: 11,
            }}
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
          <ChartTooltip
            content={<ChartTooltipContent />}
            cursor={{ strokeDasharray: '3 3' }}
          />
          <Scatter
            data={scatterData}
            fill={CHART_COLORS[0]}
            fillOpacity={0.7}
          />
        </ScatterChart>
      </ChartContainer>
    )
  }

  return null
}
