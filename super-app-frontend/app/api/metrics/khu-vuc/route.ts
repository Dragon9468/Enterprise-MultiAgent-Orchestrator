import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data: rawEntry, error } = await supabase
      .from('raw_metrics')
      .select('*')
      .eq('table_name', 'khu_vuc')
      .maybeSingle()

    if (error) {
      console.warn('[API /api/metrics/khu-vuc] Supabase error:', error.message)
    }

    if (rawEntry && rawEntry.records && rawEntry.records.length > 0) {
      return NextResponse.json({
        success: true,
        source: 'supabase_raw_metrics',
        table_name: rawEntry.table_name,
        display_name: rawEntry.description || 'Chỉ Số Khu Vực Điều Hành',
        fields: rawEntry.fields || [],
        field_count: rawEntry.field_count || 0,
        summary: rawEntry.summary || {
          tong_ca: 4720,
          dung_hen_sla: 96.8,
          nhan_luc_truc_tiep: 842
        },
        records: rawEntry.records,
        updated_at: rawEntry.updated_at
      })
    }

    return NextResponse.json({
      success: true,
      source: 'fallback',
      summary: {
        tong_ca: 4720,
        dung_hen_sla: 96.8,
        nhan_luc_truc_tiep: 842
      },
      records: [
        { "Khu Vực": "Khu vực 1 (Hà Nội)", "Tổng ca": 1240, "Đúng hẹn": 1198, "Tỷ lệ SLA": 96.6, "Nhân lực": 215, "Thời gian TB": "1.85h" },
        { "Khu Vực": "Khu vực 2 (TP.HCM)", "Tổng ca": 1680, "Đúng hẹn": 1625, "Tỷ lệ SLA": 96.7, "Nhân lực": 320, "Thời gian TB": "1.92h" },
        { "Khu Vực": "Khu vực 3 (Miền Trung)", "Tổng ca": 840, "Đúng hẹn": 818, "Tỷ lệ SLA": 97.4, "Nhân lực": 142, "Thời gian TB": "1.65h" },
        { "Khu Vực": "Khu vực 4 (Miền Nam)", "Tổng ca": 960, "Đúng hẹn": 928, "Tỷ lệ SLA": 96.6, "Nhân lực": 165, "Thời gian TB": "1.90h" }
      ]
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
