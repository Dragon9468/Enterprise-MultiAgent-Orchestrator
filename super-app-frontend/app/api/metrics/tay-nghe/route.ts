import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // 1. Query từ bảng raw_metrics
    const { data: rawEntry, error } = await supabase
      .from('raw_metrics')
      .select('*')
      .eq('table_name', 'tay_nghe')
      .maybeSingle()

    if (error) {
      console.warn('[API /api/metrics/tay-nghe] Supabase error:', error.message)
    }

    if (rawEntry && rawEntry.records && rawEntry.records.length > 0) {
      return NextResponse.json({
        success: true,
        source: 'supabase_raw_metrics',
        table_name: rawEntry.table_name,
        display_name: rawEntry.description || 'Chất Lượng Tay Nghề NVKT',
        fields: rawEntry.fields || [],
        field_count: rawEntry.field_count || 0,
        summary: rawEntry.summary || {
          ty_le_dat_chuan: 96.8,
          lap_su_co_7n: 1.8,
          bac_nghe_tb: 'Bậc 4.2'
        },
        records: rawEntry.records,
        updated_at: rawEntry.updated_at
      })
    }

    // Fallback data nếu Supabase chưa có dữ liệu
    return NextResponse.json({
      success: true,
      source: 'fallback',
      summary: {
        ty_le_dat_chuan: 96.8,
        lap_su_co_7n: 1.8,
        bac_nghe_tb: 'Bậc 4.2'
      },
      records: [
        { "Mã NV": "NV1024", "Nhân Viên": "Nguyễn Văn An", "Vị trí": "Kỹ thuật viên Bậc 4", "Khu Vực": "Khu vực 1 (Hà Nội)", "Đúng hẹn": 97.5, "TG Hoàn Tất": "1.45 giờ", "Lỗi lặp": 1, "Điểm tay nghề": 96.2, "Bậc nghề": "Bậc 4.5" },
        { "Mã NV": "NV1029", "Nhân Viên": "Trần Văn Bình", "Vị trí": "Kỹ thuật viên Bậc 3", "Khu Vực": "Khu vực 2 (TP.HCM)", "Đúng hẹn": 96.8, "TG Hoàn Tất": "1.60 giờ", "Lỗi lặp": 2, "Điểm tay nghề": 94.0, "Bậc nghề": "Bậc 4.0" },
        { "Mã NV": "NV1042", "Nhân Viên": "Lê Hoàng Long", "Vị trí": "Kỹ thuật viên Bậc 5", "Khu Vực": "Khu vực 3 (Miền Trung)", "Đúng hẹn": 98.6, "TG Hoàn Tất": "1.20 giờ", "Lỗi lặp": 0, "Điểm tay nghề": 98.5, "Bậc nghề": "Bậc 5.0" },
        { "Mã NV": "NV1055", "Nhân Viên": "Phạm Quốc Cường", "Vị trí": "Kỹ thuật viên Bậc 3", "Khu Vực": "Khu vực 4 (Miền Nam)", "Đúng hẹn": 95.9, "TG Hoàn Tất": "1.75 giờ", "Lỗi lặp": 1, "Điểm tay nghề": 92.8, "Bậc nghề": "Bậc 3.8" }
      ]
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
