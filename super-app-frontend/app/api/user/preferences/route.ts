import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

/**
 * 🧹 Helper: Clean and minify react-grid-layout responsive object
 * Only keeps essential properties: { i, x, y, w, h } for each breakpoint.
 * Strips all internal library runtime artifacts to keep JSONB lightweight.
 */
function cleanLayoutObject(rawLayout: any): Record<string, any> {
  if (!rawLayout || typeof rawLayout !== 'object') {
    return {}
  }

  const cleaned: Record<string, any> = {}

  for (const [breakpoint, items] of Object.entries(rawLayout)) {
    if (breakpoint === '_visibleWidgets' || breakpoint === 'visibleWidgets') {
      if (Array.isArray(items)) {
        cleaned._visibleWidgets = items.map(String)
      }
      continue
    }

    if (Array.isArray(items)) {
      cleaned[breakpoint] = items.map((item: any) => ({
        i: String(item.i || ''),
        x: Number(item.x ?? 0),
        y: Number(item.y ?? 0),
        w: Number(item.w ?? 1),
        h: Number(item.h ?? 1)
      }))
    }
  }

  return cleaned
}

/**
 * 📥 GET /api/user/preferences
 * Lấy layout grid từ Supabase bảng user_preferences theo email người dùng
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const email = searchParams.get('email') || request.headers.get('x-user-email')

    if (!email) {
      return NextResponse.json(
        { success: false, message: 'Missing email parameter', layout: null },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()

    const { data, error } = await supabase
      .from('user_preferences')
      .select('email, selected_keys, updated_at')
      .eq('email', normalizedEmail)
      .maybeSingle()

    if (error) {
      console.error('[API user/preferences GET] Supabase error:', error)
      return NextResponse.json(
        { success: false, message: error.message, layout: null },
        { status: 500 }
      )
    }

    const selected = data?.selected_keys
    const visibleWidgets = selected?._visibleWidgets || selected?.visibleWidgets || null

    return NextResponse.json({
      success: true,
      email: normalizedEmail,
      layout: selected || null,
      visibleWidgets: visibleWidgets,
      updatedAt: data?.updated_at || null
    })
  } catch (err: any) {
    console.error('[API user/preferences GET] Unexpected error:', err)
    return NextResponse.json(
      { success: false, message: err.message || 'Internal Server Error', layout: null },
      { status: 500 }
    )
  }
}

/**
 * 📤 POST /api/user/preferences
 * Upsert layout grid tinh gọn vào Supabase bảng user_preferences
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { email, layout, visibleWidgets } = body

    if (!email || typeof email !== 'string') {
      return NextResponse.json(
        { success: false, message: 'Email is required' },
        { status: 400 }
      )
    }

    if (!layout || typeof layout !== 'object') {
      return NextResponse.json(
        { success: false, message: 'Layout object is required' },
        { status: 400 }
      )
    }

    const normalizedEmail = email.trim().toLowerCase()
    
    const layoutPayload = { ...layout }
    if (Array.isArray(visibleWidgets)) {
      layoutPayload._visibleWidgets = visibleWidgets
    }

    // [TỐI ƯU DỮ LIỆU] Loại bỏ toàn bộ tham số rác nội bộ, chỉ giữ { i, x, y, w, h }
    const minifiedLayout = cleanLayoutObject(layoutPayload)

    const now = new Date().toISOString()

    const { data, error } = await supabase
      .from('user_preferences')
      .upsert(
        {
          email: normalizedEmail,
          selected_keys: minifiedLayout,
          updated_at: now
        },
        { onConflict: 'email' }
      )
      .select()

    if (error) {
      console.error('[API user/preferences POST] Supabase Upsert error:', error)
      return NextResponse.json(
        { success: false, message: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Layout synced to Supabase successfully',
      email: normalizedEmail,
      updatedAt: now
    })
  } catch (err: any) {
    console.error('[API user/preferences POST] Unexpected error:', err)
    return NextResponse.json(
      { success: false, message: err.message || 'Internal Server Error' },
      { status: 500 }
    )
  }
}
