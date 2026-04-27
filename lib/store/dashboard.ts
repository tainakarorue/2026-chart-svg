import { nanoid } from 'nanoid'
import { create } from 'zustand'

/** テーブルカラムのデータ型 */
export type ColumnType = 'string' | 'number' | 'date' | 'boolean'

/** パース済みカラムのメタ情報 */
export interface Column {
  key: string
  label: string
  type: ColumnType
}

/** パース済みの1行分のデータ */
export type Row = Record<string, string | number | boolean | null>

/** 対応するチャートの種別 */
export type ChartType =
  | 'bar'
  | 'barHorizontal'
  | 'line'
  | 'area'
  | 'pie'
  | 'donut'
  | 'radar'
  | 'scatter'
  | 'funnel'

/** グリッド内のカラム占有幅 */
export type ColSpan = 1 | 2 | 3

/** X軸が重複するデータの集計方法 */
export type Aggregation = 'none' | 'sum' | 'avg' | 'count' | 'min' | 'max'

/** 折れ線・エリアの曲線形状 */
export type LineType = 'monotone' | 'linear' | 'step' | 'basis'

/** 1つのチャートの設定 */
export interface ChartConfig {
  id: string
  title: string
  type: ChartType
  xAxisKey: string
  yAxisKeys: string[]
  colSpan: ColSpan
  aggregation: Aggregation
  /** bar / barHorizontal / area: 積み上げ表示 */
  stacked?: boolean
  /** line / area: 曲線の形状 */
  lineType?: LineType
  /** line: データ点のドット表示 */
  showDots?: boolean
}

/** アップロード済みファイルの種別 */
export type FileType = 'xlsx' | 'xls' | 'csv'

// ストアの State 定義
interface DashboardState {
  /** DB に保存済みのデータセット ID。null の場合は未保存（ローカルのみ） */
  datasetId: string | null
  /** アップロードされたファイル名。null の場合はアップロード画面を表示 */
  fileName: string | null
  /** アップロードされたファイルの種別 */
  fileType: FileType | null
  /** パース済みカラム一覧 */
  columns: Column[]
  /** パース済み行データ一覧 */
  rows: Row[]
  /** 登録済みチャートの設定一覧 */
  charts: ChartConfig[]
  /** dnd-kit で並び替えを管理するための ID 順序リスト */
  chartOrder: string[]
}

// ストアの Actions 定義
interface DashboardActions {
  /** DB 保存後の datasetId をセットする */
  setDatasetId: (id: string | null) => void

  /**
   * ファイルのパース結果をストアに格納する。
   * 既存のチャートはリセットされる。
   */
  setFileData: (params: {
    fileName: string
    fileType: FileType
    columns: Column[]
    rows: Row[]
  }) => void

  /**
   * ストアを初期状態に戻す。
   * アップロード画面に戻す際に使用する。
   */
  resetFile: () => void

  /**
   * DB から取得したデータセットでストアを復元する。
   * ページリロード後に /dashboard/[datasetId] から呼び出す。
   */
  restoreFromDataset: (params: {
    datasetId: string
    fileName: string
    fileType: FileType
    columns: Column[]
    rows: Row[]
    charts: ChartConfig[]
  }) => void

  /**
   * 新しいチャートを追加する。
   * id / colSpan / aggregation は省略時にデフォルト値が設定される。
   * id を指定した場合（DB 保存済み ID と揃える場合）はそちらを使用する。
   */
  addChart: (
    config: Omit<ChartConfig, 'id' | 'colSpan' | 'aggregation'> & {
      id?: string
      colSpan?: ColSpan
      aggregation?: Aggregation
    },
  ) => void

  /**
   * 指定した ID のチャートを削除する。
   */
  removeChart: (id: string) => void

  /**
   * 指定した ID のチャート設定を部分更新する。
   */
  updateChart: (id: string, config: Partial<Omit<ChartConfig, 'id'>>) => void

  /**
   * dnd-kit の dragEnd イベントで取得した新しい ID 順序を反映する。
   */
  reorderCharts: (newOrder: string[]) => void
}

// ストアの型合成
type DashboardStore = DashboardState & DashboardActions

// 初期状態
const initialState: DashboardState = {
  datasetId: null,
  fileName: null,
  fileType: null,
  columns: [],
  rows: [],
  charts: [],
  chartOrder: [],
}

// ストアの作成

export const useDashboardStore = create<DashboardStore>((set) => ({
  ...initialState,

  setDatasetId: (id) => set({ datasetId: id }),

  setFileData: ({ fileName, fileType, columns, rows }) => {
    set({
      datasetId: null,
      fileName,
      fileType,
      columns,
      rows,
      charts: [],
      chartOrder: [],
    })
  },

  resetFile: () => {
    set({ ...initialState })
  },

  restoreFromDataset: ({ datasetId, fileName, fileType, columns, rows, charts }) => {
    set({
      datasetId,
      fileName,
      fileType,
      columns,
      rows,
      charts,
      chartOrder: charts.map((c) => c.id),
    })
  },

  addChart: (config) => {
    const id = config.id ?? nanoid()
    const newChart: ChartConfig = { colSpan: 1, aggregation: 'none', ...config, id }
    set((state) => ({
      charts: [...state.charts, newChart],
      chartOrder: [...state.chartOrder, id],
    }))
  },

  removeChart: (id) => {
    set((state) => ({
      charts: state.charts.filter((c) => c.id !== id),
      chartOrder: state.chartOrder.filter((oid) => oid !== id),
    }))
  },

  updateChart: (id, config) => {
    set((state) => ({
      charts: state.charts.map((c) => (c.id === id ? { ...c, ...config } : c)),
    }))
  },

  reorderCharts: (newOrder) => {
    set({ chartOrder: newOrder })
  },
}))
