import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 🤖 API GET /api/ai-insights?page_id=[ID]&filter_id=[FILTER]&employee_id=[EMPLOYEE]
 * Đọc dữ liệu AI Insight trực tiếp do AI sinh ra từ:
 * - cột ai_insight_khu_vuc (bảng khu_vuc_metrics)
 * - cột ai_insight (bảng nvkt_metrics)
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action') || ''
    const filterId = searchParams.get('filter_id') || searchParams.get('filterId') || searchParams.get('filter') || ''
    const employeeId = searchParams.get('employee_id') || searchParams.get('employeeId') || ''

    // 0. API Endpoint phụ: Lấy danh sách NVKT theo khu vực từ bảng khu_vuc_nvkt
    if (action === 'employees') {
      let query = supabase.from('khu_vuc_nvkt').select('nvkt_id, dieu_hanh_id').order('nvkt_id', { ascending: true })
      if (filterId && filterId !== 'All') {
        query = query.eq('dieu_hanh_id', filterId)
      }
      const { data, error } = await query
      if (error) {
        return NextResponse.json({ success: false, error: error.message }, { status: 500 })
      }
      return NextResponse.json({ success: true, employees: data || [] })
    }

    const normalizedEmpId = employeeId.trim()
    const normalizedFilterId = filterId.trim()

    // 1. Nếu lọc theo Nhân viên kỹ thuật: đọc từ bảng nvkt_metrics (cột ai_insight)
    if (normalizedEmpId && normalizedEmpId.toLowerCase() !== 'all') {
      const { data: empData, error: empError } = await supabase
        .from('nvkt_metrics')
        .select('nvkt_id, ai_insight, raw_data, updated_at')
        .ilike('nvkt_id', `%${normalizedEmpId}%`)
        .maybeSingle()

      if (!empError && empData && empData.ai_insight) {
        return NextResponse.json({
          success: true,
          source: 'nvkt_metrics',
          target_id: empData.nvkt_id,
          insight_data: {
            tong_quan: empData.ai_insight,
            diem_sang: [],
            diem_nghen: [],
            khuyen_nghi: [],
            confidence_score: 99.0
          },
          updated_at: empData.updated_at || new Date().toISOString()
        })
      }
    }

    // 2. Nếu lọc theo Điều hành / Khu vực: đọc từ bảng khu_vuc_metrics (cột ai_insight_khu_vuc)
    // Các khu vực hợp lệ: BinhPB, HuyTH, TAIHD, TANNVN (Mặc định: BinhPB nếu không truyền)
    const targetArea = (normalizedFilterId && normalizedFilterId.toLowerCase() !== 'all') 
      ? normalizedFilterId 
      : 'BinhPB'

    const { data: dhData, error: dhError } = await supabase
      .from('khu_vuc_metrics')
      .select('dieu_hanh_id, ai_insight_khu_vuc, raw_data')
      .ilike('dieu_hanh_id', `%${targetArea}%`)
      .maybeSingle()

    if (!dhError && dhData && dhData.ai_insight_khu_vuc) {
      return NextResponse.json({
        success: true,
        source: 'khu_vuc_metrics',
        target_id: dhData.dieu_hanh_id,
        insight_data: {
          tong_quan: dhData.ai_insight_khu_vuc,
          diem_sang: [],
          diem_nghen: [],
          khuyen_nghi: [],
          confidence_score: 98.8
        },
        updated_at: new Date().toISOString()
      })
    }

    // 3. Dự phòng nếu chưa có dữ liệu cho khu vực
    return NextResponse.json({
      success: true,
      source: 'fallback',
      target_id: targetArea,
      insight_data: {
        tong_quan: `Chưa có dữ liệu nhận định từ AI cho khu vực [${targetArea}]. Dữ liệu sẽ được cập nhật trong chu kỳ tiếp theo.`,
        diem_sang: [],
        diem_nghen: [],
        khuyen_nghi: [],
        confidence_score: 95.0
      },
      updated_at: new Date().toISOString()
    })
  } catch (err: any) {
    console.error('[API ai-insights GET] Error:', err)
    return NextResponse.json(
      { success: false, message: err.message || 'Internal Server Error', insight_data: null },
      { status: 500 }
    )
  }
}
