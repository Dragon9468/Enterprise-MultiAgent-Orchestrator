import { ResponsiveLayouts, LayoutItem } from 'react-grid-layout'

export interface AvailableWidgetInfo {
  id: string
  name: string
  description: string
  defaultEnabled: boolean
}

export const ALL_AVAILABLE_WIDGETS: AvailableWidgetInfo[] = [
  {
    id: 'widget-tay-nghe',
    name: 'Chất Lượng Tay Nghề NVKT',
    description: 'Đánh giá kỹ năng, bậc nghề & tỷ lệ nghiệm thu chuẩn hóa',
    defaultEnabled: true
  },
  {
    id: 'widget-khu-vuc',
    name: 'Chỉ Số Điều Hành Khu Vực',
    description: 'Sản lượng điều phối ca và tiến độ hoàn tất SLA 4 khu vực',
    defaultEnabled: true
  },
  {
    id: 'widget-ha-tang',
    name: 'Chất Lượng Hạ Tầng OLT/PON',
    description: 'Giám sát cổng OLT và cảnh báo suy hao quang',
    defaultEnabled: true
  },
  {
    id: 'widget-thanh-phan-luong',
    name: 'Thành Phần Lương',
    description: 'Báo cáo chi tiết thành phần lương và điều chỉnh',
    defaultEnabled: true
  },
  {
    id: 'widget-thiet-bi-thu-hoi',
    name: 'Thiết Bị Thu Hồi',
    description: 'Bảng theo dõi thiết bị cho mượn và tỷ lệ thu hồi',
    defaultEnabled: true
  },
  {
    id: 'widget-ty-le-lap',
    name: 'Tỷ Lệ Lặp',
    description: 'Biểu đồ tỷ lệ lặp',
    defaultEnabled: true
  },
  {
    id: 'widget-time-tk-bt',
    name: 'Time TK-BT',
    description: 'Biểu đồ thời gian xử lý TK-BT',
    defaultEnabled: true
  }
]

export const BREAKPOINT_COLS: Record<string, number> = {
  xxl: 60,
  xl: 48,
  lg: 36,
  md: 24,
  sm: 12,
  xs: 6,
  xxs: 4
}

const DEFAULT_ROW_HEIGHT_PX = 30
const PBI_CANVAS_WIDTH = 1600

// Tọa độ thực tế trích xuất từ file Power BI gốc
export const PBI_RAW_VISUALS = [
  { id: 'widget-tay-nghe', x: 0, y: 1.63, width: 290.61, height: 452.24 },
  { id: 'widget-khu-vuc', x: 290.61, y: 1.63, width: 334.69, height: 375.51 },
  { id: 'widget-thanh-phan-luong', x: 638.36, y: 0, width: 479.99, height: 143.67 },
  { id: 'widget-ha-tang', x: 290.44, y: 391.83, width: 335.12, height: 409.02 },
  { id: 'widget-thiet-bi-thu-hoi', x: 754.28, y: 391.83, width: 243.26, height: 408 },
  { id: 'widget-ty-le-lap', x: 998.49, y: 144.36, width: 319.65, height: 400.41 },
  { id: 'widget-time-tk-bt', x: 1304.48, y: 623.67, width: 295.51, height: 176.32 }
]

/**
 * 📐 Quy đổi (Scale) tọa độ Pixel từ Power BI Canvas sang hệ lưới React-Grid-Layout tự động.
 * STRICT CANVAS MODE: Mọi breakpoint đều phải tuân thủ Layout tuyệt đối (X, Y) của PBI. Không tự động xếp hàng dọc (Stack).
 */
export function scalePbiToGridLayout(): ResponsiveLayouts {
  const generated: ResponsiveLayouts = {}

  for (const [bp, totalCols] of Object.entries(BREAKPOINT_COLS)) {
    const items: LayoutItem[] = []

    for (const vc of PBI_RAW_VISUALS) {
      // 100% Strict Aspect Ratio for all devices
      const w = Math.max(1, Math.round((vc.width / PBI_CANVAS_WIDTH) * totalCols))
      const x = Math.max(0, Math.round((vc.x / PBI_CANVAS_WIDTH) * totalCols))
      const h = Math.max(2, Math.round(vc.height / DEFAULT_ROW_HEIGHT_PX))
      const y = Math.max(0, Math.round(vc.y / DEFAULT_ROW_HEIGHT_PX))

      items.push({ i: vc.id, x, y, w, h, minW: 1, minH: 2 })
    }

    generated[bp] = items
  }

  return generated
}

/**
 * 🔄 Logic Ghi đè (Merge Logic):
 * - Ưu tiên userPreferences.layout nếu đã được lưu.
 * - Nếu phát hiện có Widget mới từ pbiDefaultLayout chưa tồn tại trong userPreferences, tự động push xuống cuối lưới.
 */
export function mergeWithPbiLayout(
  userLayout: ResponsiveLayouts | null,
  pbiDefaultLayout: ResponsiveLayouts,
  activeWidgetIds: string[] = ALL_AVAILABLE_WIDGETS.map(w => w.id)
): ResponsiveLayouts {
  if (!userLayout || Object.keys(userLayout).length === 0) {
    return pbiDefaultLayout
  }

  const merged: ResponsiveLayouts = {}

  for (const bp of Object.keys(BREAKPOINT_COLS)) {
    const userItems = userLayout[bp] || []
    const pbiItems = pbiDefaultLayout[bp] || []
    const userItemIds = new Set(userItems.map(it => it.i))

    // Retain existing user layout items
    const bpMerged: LayoutItem[] = [...userItems]

    // Find bottom-most Y coordinate in current layout
    let maxY = userItems.reduce((max, it) => Math.max(max, (it.y || 0) + (it.h || 1)), 0)

    // Check for any new widgets in pbiDefaultLayout not yet in user preferences
    for (const pbiItem of pbiItems) {
      if (!userItemIds.has(pbiItem.i) && activeWidgetIds.includes(pbiItem.i)) {
        bpMerged.push({
          ...pbiItem,
          x: 0,
          y: maxY
        })
        maxY += (pbiItem.h || 4)
      }
    }

    merged[bp] = bpMerged
  }

  return merged
}
