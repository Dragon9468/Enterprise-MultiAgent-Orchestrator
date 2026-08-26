import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data: rawEntry, error } = await supabase
      .from('raw_metrics')
      .select('*')
      .eq('table_name', 'ha_tang')
      .maybeSingle()

    if (error) {
      console.warn('[API /api/metrics/ha-tang] Supabase error:', error.message)
    }

    if (rawEntry && rawEntry.records && rawEntry.records.length > 0) {
      return NextResponse.json({
        success: true,
        source: 'supabase_raw_metrics',
        table_name: rawEntry.table_name,
        display_name: rawEntry.description || 'Chất Lượng Hạ Tầng & Cổng OLT',
        fields: rawEntry.fields || [],
        field_count: rawEntry.field_count || 0,
        summary: rawEntry.summary || {
          cong_olt_online: 16470,
          tin_hieu_suy_hao_tb: '-19.4 dBm',
          canh_bao_dut_cap: '3 sự cố'
        },
        records: rawEntry.records,
        updated_at: rawEntry.updated_at
      })
    }

    return NextResponse.json({
      success: true,
      source: 'fallback',
      summary: {
        cong_olt_online: 16470,
        tin_hieu_suy_hao_tb: '-19.4 dBm',
        canh_bao_dut_cap: '3 sự cố'
      },
      records: [
        { "Trạng Thái Cổng": "Khỏe mạnh (< -24 dBm)", "Số Cổng": 14200, "Tỷ Lệ": 86.2, "Màu Sắc": "#10b981" },
        { "Trạng Thái Cổng": "Cảnh báo (-25 ~ -27 dBm)", "Số Cổng": 1850, "Tỷ Lệ": 11.2, "Màu Sắc": "#f59e0b" },
        { "Trạng Thái Cổng": "Nguy cơ suy hao (> -28 dBm)", "Số Cổng": 420, "Tỷ Lệ": 2.6, "Màu Sắc": "#f43f5e" }
      ]
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
