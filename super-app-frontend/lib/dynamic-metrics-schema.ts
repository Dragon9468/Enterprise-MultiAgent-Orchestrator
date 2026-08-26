/**
 * 📊 DYNAMIC METRICS CONFIGURATION & HELPER SERVICE (Config-as-Code)
 * 
 * Quản lý toàn bộ cấu hình hiển thị của các nhóm chỉ số cha & con từ file `@/config/metric_dictionary.json`.
 * Phân biệt rõ ràng giữa:
 * 1. `parent_chart_type`: Biểu đồ thu nhỏ hiển thị ngoài Dashboard trên Card.
 * 2. `sub_chart_type`: Biểu đồ chi tiết cho nhóm chỉ số con hiển thị trong Modal khi click.
 */

import metricDictionaryData from '@/config/metric_dictionary.json'

// =========================================================================
// 1. BIẾN CẤU HÌNH LOẠI BIỂU ĐỒ (CHART TYPES SPECIFICATION)
// =========================================================================

// Biểu đồ cho chỉ số cha trên thẻ Dashboard
export type ParentChartType = 'mini_donut' | 'mini_stacked_bar' | 'none'

// Biểu đồ cho nhóm chỉ số con trong Popup/Modal
export type SupportedSubChartType = 
  | 'bar_horizontal'               // Biểu đồ cột ngang (Hiện số trong cột, sát đỉnh cột)
  | 'bar_vertical'                 // Biểu đồ cột dọc (Hiện số trong cột, sát đỉnh cột)
  | 'multi_layer_concentric_donut' // Biểu đồ tròn đa lớp đồng tâm (Hiện nhánh rẽ callout ra từng lớp %)
  | 'area'                         // Biểu đồ miền (Tạm thời không hiện số trên biểu đồ)
  | 'line'                         // Biểu đồ đường (Tạm thời không hiện số trên biểu đồ)
  | 'stacked_bar'                  // Biểu đồ cột chồng (Hiện số trong từng đoạn cột)
  | 'donut'                        // Biểu đồ donut đơn
  | null

export type WidgetType = 'simple_card' | 'chart_widget'

export interface SubMetricConfig {
  key: string
  name: string
  unit: string
  min_val: number | null
  max_val: number | null
  color: string
  polarity?: 'higher_is_better' | 'lower_is_better'
}

export interface SummaryCardConfig {
  key: string
  label: string
  color: string
  sub_label?: string
}

export interface MetricGroupConfig {
  parent_metric_key: string
  parent_metric_name: string
  widget_type: WidgetType
  parent_chart_type?: ParentChartType     // 🌟 Biểu đồ cho chỉ số cha ngoài Card
  sub_chart_type?: SupportedSubChartType   // 🌟 Biểu đồ cho nhóm chỉ số con trong Modal
  unit?: string
  kpi_target?: number
  polarity?: 'higher_is_better' | 'lower_is_better'
  icon?: string
  color_theme?: string
  modal_title: string
  modal_icon?: string
  summary_cards?: SummaryCardConfig[]
  sub_metrics: SubMetricConfig[]
}

// =========================================================================
// 2. HELPER FUNCTIONS
// =========================================================================

/**
 * 🔍 Lấy cấu hình nhóm chỉ số từ file JSON tĩnh theo `parent_metric_key`
 */
export function getMetricConfig(parentKey: string): MetricGroupConfig | null {
  if (!parentKey) return null
  const normalized = parentKey.trim().toUpperCase()

  const list = metricDictionaryData as MetricGroupConfig[]
  const found = list.find(item => {
    const itemKey = item.parent_metric_key.toUpperCase()
    return itemKey === normalized || normalized.includes(itemKey) || itemKey.includes(normalized)
  })

  return found || null
}

/**
 * 📋 Lấy toàn bộ danh sách cấu hình
 */
export function getAllMetricConfigs(): MetricGroupConfig[] {
  return metricDictionaryData as MetricGroupConfig[]
}

/**
 * Interface cấu trúc dữ liệu đã được chuẩn hóa cho Recharts
 */
export interface FormattedChartItem {
  name: string
  rawKey: string
  value: number
  rawDisplay: string
  unit: string
  color: string
  minVal: number | null
  maxVal: number | null
  polarity?: 'higher_is_better' | 'lower_is_better'
}

/**
 * 🔄 Format dữ liệu thô (Supabase raw_data) sang chuẩn Recharts dựa theo cấu hình nhóm chỉ số
 */
export function formatDataForDynamicChart(
  rawData: Record<string, any> = {},
  config: MetricGroupConfig
): FormattedChartItem[] {
  if (!config || !Array.isArray(config.sub_metrics) || config.sub_metrics.length === 0) {
    return []
  }

  return config.sub_metrics.map(sub => {
    const rawVal = rawData?.[sub.key] ?? 
                   rawData?.[sub.key.toLowerCase()] ?? 
                   rawData?.[`RM_${sub.key}`] ?? 
                   rawData?.[`rm_${sub.key.toLowerCase()}`] ?? 0

    let numVal = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).replace(/[^0-9.-]/g, '')) || 0

    // Xử lý đơn vị %: nếu dạng thập phân 0.05 -> 5%
    if (sub.unit === '%' && numVal > 0 && numVal < 1.0) {
      numVal = Math.round(numVal * 10000) / 100
    }

    let rawDisplay = '0'
    if (rawVal !== 0 && rawVal !== '0' && rawVal !== undefined && rawVal !== null) {
      if (sub.unit === '%') {
        rawDisplay = String(rawVal).includes('%') ? String(rawVal) : `${numVal}%`
      } else {
        rawDisplay = `${numVal}${sub.unit ? ' ' + sub.unit : ''}`
      }
    } else if (sub.unit) {
      rawDisplay = `0 ${sub.unit}`
    }

    return {
      name: sub.name,
      rawKey: sub.key,
      value: Math.abs(numVal),
      rawDisplay,
      unit: sub.unit,
      color: sub.color,
      minVal: sub.min_val,
      maxVal: sub.max_val,
      polarity: sub.polarity
    }
  })
}

// =========================================================================
// 3. THIẾT KẾ HIỂN THỊ VALUE TRÊN BIỂU ĐỒ (CHART VALUE DISPLAY RULES)
// =========================================================================
export function getChartValueDisplayConfig(chartType: SupportedSubChartType): {
  showValueOnChart: boolean
  displayPosition: 'inside_bar_edge' | 'callout_radial_lines' | 'tooltip_only'
} {
  switch (chartType) {
    case 'bar_horizontal':
    case 'bar_vertical':
    case 'stacked_bar':
      return {
        showValueOnChart: true,
        displayPosition: 'inside_bar_edge' // Hiện số ở trong cột và sát đỉnh cột
      }
    case 'multi_layer_concentric_donut':
      return {
        showValueOnChart: true,
        displayPosition: 'callout_radial_lines' // Hiện các nhánh rẽ ra từng lớp kèm giá trị %
      }
    case 'area':
    case 'line':
    default:
      return {
        showValueOnChart: false,
        displayPosition: 'tooltip_only' // Tạm thời chưa hiện giá trị cụ thể trên biểu đồ
      }
  }
}
