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
export type ChartType = 'bar' | 'line' | 'area' | 'pie' | 'radar' | 'scatter'

/** グリッド内のカラム占有幅 */
export type ColSpan = 1 | 2 | 3

/** X軸が重複するデータの集計方法 */
export type Aggregation = 'none' | 'sum' | 'avg' | 'count'

/** 1つのチャートの設定 */
export interface ChartConfig {
  id: string
  title: string
  type: ChartType
  xAxisKey: string
  yAxisKeys: string[]
  colSpan: ColSpan
  aggregation: Aggregation
}

/** アップロード済みファイルの種別 */
export type FileType = 'xlsx' | 'xls' | 'csv' | 'svg'

// ストアの State 定義
interface DashboardState {
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
   * 新しいチャートを追加する。
   * id / colSpan / aggregation は省略時にデフォルト値が設定される。
   */
  addChart: (
    config: Omit<ChartConfig, 'id' | 'colSpan' | 'aggregation'> & {
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
  setFileData: ({ fileName, fileType, columns, rows }) => {
    set({
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

  addChart: (config) => {
    const id = nanoid()
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
