import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const { data: rawEntry, error } = await supabase
      .from('raw_metrics')
      .select('*')
      .eq('table_name', 'suy_hao')
      .maybeSingle()

    if (error) {
      console.warn('[API /api/metrics/suy-hao] Supabase error:', error.message)
    }

    if (rawEntry && rawEntry.records && rawEntry.records.length > 0) {
      return NextResponse.json({
        success: true,
        source: 'supabase_raw_metrics',
        table_name: rawEntry.table_name,
        display_name: rawEntry.description || 'Suy Hao Tuyến Quang & CSAT Lần 2',
        fields: rawEntry.fields || [],
        field_count: rawEntry.field_count || 0,
        summary: rawEntry.summary || {
          ty_le_suy_hao_cao: 1.8,
          csat_l2: 4.92,
          do_tre_trung_binh: '4.2 ms'
        },
        records: rawEntry.records,
        updated_at: rawEntry.updated_at
      })
    }

    return NextResponse.json({
      success: true,
      source: 'fallback',
      summary: {
        ty_le_suy_hao_cao: 1.8,
        csat_l2: 4.92,
        do_tre_trung_binh: '4.2 ms'
      },
      records: [
        { "Ngày": "01/08", "Suy hao (%)": 2.8, "CSAT": 4.82, "RX TB": "-19.8 dBm", "Số ca đo kiểm": 142 },
        { "Ngày": "04/08", "Suy hao (%)": 2.6, "CSAT": 4.84, "RX TB": "-19.6 dBm", "Số ca đo kiểm": 158 },
        { "Ngày": "07/08", "Suy hao (%)": 2.9, "CSAT": 4.81, "RX TB": "-19.9 dBm", "Số ca đo kiểm": 164 },
        { "Ngày": "10/08", "Suy hao (%)": 2.4, "CSAT": 4.86, "RX TB": "-19.4 dBm", "Số ca đo kiểm": 180 },
        { "Ngày": "13/08", "Suy hao (%)": 2.1, "CSAT": 4.89, "RX TB": "-19.2 dBm", "Số ca đo kiểm": 195 },
        { "Ngày": "16/08", "Suy hao (%)": 1.9, "CSAT": 4.92, "RX TB": "-19.0 dBm", "Số ca đo kiểm": 210 },
        { "Ngày": "18/08", "Suy hao (%)": 1.8, "CSAT": 4.94, "RX TB": "-18.9 dBm", "Số ca đo kiểm": 224 }
      ]
    })
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 })
  }
}
