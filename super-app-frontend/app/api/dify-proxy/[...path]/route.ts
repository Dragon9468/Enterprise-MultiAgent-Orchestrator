/**
 * 🔐 DIFY API PROXY — Server-side Route Handler
 *
 * Mục đích:
 * - Giữ Dify API Key hoàn toàn ở server-side (không expose trong JS bundle)
 * - Validate PocketBase token trước khi forward request đến Dify
 * - Client chỉ gọi /api/dify-proxy/... — không bao giờ biết API Key thực
 *
 * Pattern: /api/dify-proxy/[...path]
 * Ví dụ:
 *   Client → GET /api/dify-proxy/conversations?user=X&limit=20
 *   Proxy  → GET https://dify.../v1/conversations?user=X&limit=20
 */

import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// ────────────────────────────────────────────────────────────
// In-memory RAM Cache cho System Dictionary (TTL = 1 giờ / 3600s)
// ────────────────────────────────────────────────────────────
interface CacheEntry {
  data: string
  expiresAt: number
}

const DICTIONARY_TTL_MS = 3600 * 1000 // 1 giờ

// Global Map tồn tại xuyên suốt các request trên instance server Next.js
const dictionaryCache = new Map<string, CacheEntry>()

// [P1-FIX] In-flight deduplication: ngăn cache stampede khi nhiều request đồng thời
// Nếu đã có fetch đang chạy cho cùng category, tái sử dụng Promise đó thay vì tạo N queries Supabase
const inflightRequests = new Map<string, Promise<string>>()

function normalizeDepartmentCategory(dept?: string | null): string {
  const d = (dept || '').toLowerCase()
  if (d.includes('kỹ') || d.includes('ky') || d.includes('tech')) return 'ky_thuat'
  if (d.includes('cskh') || d.includes('chăm') || d.includes('cham')) return 'cskh'
  if (d.includes('sale') || d.includes('kinh') || d.includes('kinh_doanh')) return 'kinh_doanh'
  return d || 'ky_thuat'
}

async function getSystemDictionary(department?: string | null): Promise<string> {
  const category = normalizeDepartmentCategory(department)
  const now = Date.now()

  // 1. Kiểm tra RAM Cache (O(1) — zero latency khi hit)
  const cached = dictionaryCache.get(category)
  if (cached && cached.expiresAt > now) {
    return cached.data
  }

  // 2. [P1-FIX] Nếu đang có fetch in-flight cho category này, tái sử dụng để tránh stampede
  const existingFlight = inflightRequests.get(category)
  if (existingFlight) {
    return existingFlight
  }

  // 3. Cache miss và không có in-flight → tạo fetch mới
  const fetchPromise = (async (): Promise<string> => {
    let dictStr = ''
    try {
      const { data, error } = await supabase
        .from('sys_dictionary')
        .select('keyword, meaning')
        .contains('category', [category])
        .limit(30) // [P3] Giới hạn 30 entries để kiểm soát payload size

      if (!error && data && data.length > 0) {
        dictStr = data
          .map((item: { keyword: string; meaning: string }) => `${item.keyword}: ${item.meaning}`)
          .join('\n')
      }
    } catch (err) {
      console.error('[Dictionary Cache] Lỗi query sys_dictionary:', err)
      dictStr = ''
    }

    // Lưu kết quả vào Cache (kể cả chuỗi rỗng — tránh query liên tục khi bảng trống)
    dictionaryCache.set(category, {
      data: dictStr,
      expiresAt: Date.now() + DICTIONARY_TTL_MS
    })

    return dictStr
  })()

  // Đăng ký in-flight, cleanup sau khi xong
  inflightRequests.set(category, fetchPromise)
  fetchPromise.finally(() => inflightRequests.delete(category))

  return fetchPromise
}

// ────────────────────────────────────────────────────────────
// Cấu hình Dify base URL (server-side only)
// ────────────────────────────────────────────────────────────
function getDifyBaseUrl(): string {
  if (process.env.DIFY_API_URL) {
    return process.env.DIFY_API_URL.replace(/\/+$/, '').replace(/\/v1$/, '') + '/v1'
  }
  // Mặc định: cùng máy với SuperApp
  return 'http://localhost/v1'
}

// ────────────────────────────────────────────────────────────
// Chọn Dify API Key theo department và mode
// ────────────────────────────────────────────────────────────
function getDifyApiKey(department?: string | null, mode?: string): string {
  const dept = (department || '').toLowerCase()

  if (mode === 'work') {
    // Mỗi phòng ban có Workflow riêng
    if (dept.includes('kỹ') || dept.includes('ky') || dept.includes('tech')) {
      return process.env.DIFY_WORKFLOW_TECH_KEY || process.env.DIFY_WORKFLOW_KEY || ''
    }
    if (dept.includes('sale')) {
      return process.env.DIFY_WORKFLOW_SALES_KEY || process.env.DIFY_WORKFLOW_KEY || ''
    }
    if (dept.includes('cskh') || dept.includes('chăm') || dept.includes('cham')) {
      return process.env.DIFY_WORKFLOW_CSKH_KEY || process.env.DIFY_WORKFLOW_KEY || ''
    }
    if (dept.includes('quản') || dept.includes('quan') || dept.includes('manager')) {
      return process.env.DIFY_WORKFLOW_KEY || ''
    }
    return process.env.DIFY_WORKFLOW_KEY || ''
  }

  // ⚡ Sử dụng 1 Chatflow Tổng duy nhất cho toàn bộ miniapp Trò chuyện
  return (
    process.env.DIFY_CHATFLOW_API_KEY ||
    process.env.DIFY_TECH_CHAT_KEY ||
    process.env.DIFY_API_KEY ||
    ''
  )
}

interface AuthResult {
  isAuthenticated: boolean
  user?: {
    id?: string
    email?: string
    username?: string
    emp_id?: string
    role_level?: number
    department?: string
    department_id?: string
  }
}

// ────────────────────────────────────────────────────────────
// In-memory Rate Limiting (Chống DoS Prompt Bombing & Cạn kiệt API Budget)
// Giới hạn: Tối đa 40 requests/phút cho mỗi IP
// ────────────────────────────────────────────────────────────
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function checkRateLimit(ip: string, limit = 40, windowMs = 60 * 1000): boolean {
  const now = Date.now()
  const entry = rateLimitMap.get(ip)

  if (!entry || entry.resetAt < now) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + windowMs })
    return true
  }

  if (entry.count >= limit) {
    return false
  }

  entry.count++
  return true
}

// ────────────────────────────────────────────────────────────
// Validate PocketBase token để đảm bảo request đến từ user đã xác thực
// ────────────────────────────────────────────────────────────
async function validatePocketBaseToken(token: string | null): Promise<AuthResult> {
  if (!token) return { isAuthenticated: false }

  try {
    const pbUrl = process.env.POCKETBASE_URL || process.env.NEXT_PUBLIC_POCKETBASE_URL || 'http://127.0.0.1:8090'
    const res = await fetch(`${pbUrl}/api/collections/users/auth-refresh`, {
      method: 'POST',
      headers: {
        Authorization: token,
        'Content-Type': 'application/json'
      },
      signal: AbortSignal.timeout(3000) // Timeout 3s — không block vô thời hạn
    })
    if (!res.ok) return { isAuthenticated: false }
    const data = await res.json()
    return {
      isAuthenticated: true,
      user: data?.record || {}
    }
  } catch (err) {
    // Fail-closed: từ chối request nếu PocketBase không thể kết nối
    console.error('[Auth] PocketBase unreachable — denying request:', (err as Error).message)
    return { isAuthenticated: false }
  }
}

// ────────────────────────────────────────────────────────────
// Shared handler cho GET, POST, DELETE, PUT, PATCH
// ────────────────────────────────────────────────────────────
async function handler(
  req: NextRequest,
  context: { params: Promise<{ path: string[] }> }
) {
  // 1. Rate Limiting Check
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'anonymous-client'
  if (!checkRateLimit(clientIp, 40, 60 * 1000)) {
    return NextResponse.json(
      { error: 'Too Many Requests', message: 'Tần suất gửi yêu cầu vượt quá giới hạn cho phép. Vui lòng thử lại sau 1 phút.' },
      { status: 429, headers: { 'Retry-After': '60' } }
    )
  }

  const { path } = await context.params
  const difyPath = path.join('/')

  // 2. Lấy PocketBase token từ header Authorization hoặc cookie
  const pbToken =
    req.headers.get('x-pb-token') ||
    req.cookies.get('pb_auth_token')?.value ||
    null

  // 3. Validate token
  const auth = await validatePocketBaseToken(pbToken)
  if (!auth.isAuthenticated) {
    return NextResponse.json(
      { error: 'Unauthorized', message: 'Phiên làm việc không hợp lệ hoặc đã hết hạn.' },
      { status: 401 }
    )
  }

  // 3. Lấy department & mode từ header (client gửi, không nhạy cảm)
  const rawDept = req.headers.get('x-department') || null
  const department = rawDept ? decodeURIComponent(rawDept) : null
  const mode = req.headers.get('x-dify-mode') || 'chat'

  // 4. Chọn API Key (server-side)
  const apiKey = getDifyApiKey(department, mode)

  // 5. Build URL đích
  const url = new URL(req.url)
  const difyTargetUrl = `${getDifyBaseUrl()}/${difyPath}${url.search}`

  // 6. Chuẩn bị headers forward
  const forwardHeaders: Record<string, string> = {
    'Content-Type': req.headers.get('content-type') || 'application/json'
  }
  if (apiKey) {
    forwardHeaders['Authorization'] = `Bearer ${apiKey}`
  }

  // 7. Forward request đến Dify (Inject system_dict và server-verified user info vào inputs nếu là chat-messages)
  let body: BodyInit | undefined = undefined
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    if (difyPath === 'chat-messages') {
      try {
        const jsonBody = await req.json()
        const systemDict = await getSystemDictionary(department)

        // OWASP LLM04: Input Length Limit - Chống Context Stuffing & DoS
        if (typeof jsonBody.query === 'string' && jsonBody.query.trim().length > 500) {
          return NextResponse.json(
            {
              error: 'Input Length Limit Exceeded',
              code: 400,
              message: 'Câu hỏi vượt quá giới hạn 500 ký tự cho phép (OWASP LLM04 - Context Stuffing). Vui lòng rút gọn câu hỏi.'
            },
            { status: 400 }
          )
        }

        // OWASP A01: Broken Object Level Authorization & Privilege Escalation Defense
        // Only allow safe conversational context from client - strictly block client-tampered security tokens
        const ALLOWED_CLIENT_INPUTS = new Set([
          'sys_topic',
          'base_context'
        ])
        const sanitizedInputs: Record<string, unknown> = {}
        const clientInputs = jsonBody.inputs || {}
        for (const key of ALLOWED_CLIENT_INPUTS) {
          if (clientInputs[key] !== undefined) {
            sanitizedInputs[key] = clientInputs[key]
          }
        }

        // Server-Authoritative RBAC: ONLY use credentials from verified PocketBase auth record
        // Default unassigned users strictly to Level 1 (Guest/Staff) - NEVER trust client-provided level
        const verifiedRoleLevel = auth.user?.role_level != null ? Number(auth.user.role_level) : 1
        const roleLevelStr = String(Number.isFinite(verifiedRoleLevel) && verifiedRoleLevel >= 1 ? verifiedRoleLevel : 1)
        const roleLevelNum = Number(roleLevelStr)

        // Department: strictly from server auth record
        let deptVal = auth.user?.department || 'GENERAL'
        if (Array.isArray(deptVal)) deptVal = deptVal[0] || 'GENERAL'
        const deptStr = String(deptVal)

        // Department ID: strictly enforce scoping based on verified role level
        // Level 4+ (Executive / Director) gets Wildcard access (''), Level 1-3 is strictly scoped to assigned department_id
        let deptIdStr = '1'
        if (roleLevelNum >= 4) {
          deptIdStr = '' // Legitimate Wildcard for verified executives
        } else {
          const userDeptId = (auth.user as any)?.department_id
          deptIdStr = userDeptId != null ? String(userDeptId) : '1'
        }

        // Employee ID: strictly from server auth record
        const empIdStr = String(auth.user?.emp_id || auth.user?.username || auth.user?.id || 'anonymous')

        sanitizedInputs.system_dict = String(systemDict || '')
        sanitizedInputs.role_level = roleLevelStr
        sanitizedInputs.department = deptStr
        sanitizedInputs.department_id = deptIdStr
        sanitizedInputs.emp_id = empIdStr

        jsonBody.inputs = sanitizedInputs
        body = JSON.stringify(jsonBody)
      } catch {
        body = await req.arrayBuffer()
      }
    } else {
      body = await req.arrayBuffer()
    }
  }

  // Support mock status for E2E frontend testing (e.g. ?mock_status=429 or header x-mock-status: 429)
  const mockStatus = url.searchParams.get('mock_status') || req.headers.get('x-mock-status')
  if (mockStatus === '429') {
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        code: 429,
        isRateLimit: true,
        message: 'Hệ thống AI hiện đang xử lý quá nhiều yêu cầu. Xin anh/chị vui lòng thử lại sau.'
      },
      { status: 429 }
    )
  }

  let difyResponse: Response
  try {
    difyResponse = await fetch(difyTargetUrl, {
      method: req.method,
      headers: forwardHeaders,
      body
    })
  } catch (err: any) {
    console.error('[Dify Proxy Fetch Error]:', err?.message || err)
    return NextResponse.json(
      {
        error: 'Service Unavailable',
        code: 503,
        message: 'Không thể kết nối đến máy chủ AI. Xin anh/chị vui lòng thử lại sau.'
      },
      { status: 503 }
    )
  }

  // 8. Bắt lỗi HTTP 429 (Too Many Requests / Quota Exceeded) từ Dify API
  if (difyResponse.status === 429) {
    console.warn('[Dify Proxy 429 Rate Limit]: Dify upstream returned 429 Too Many Requests')
    return NextResponse.json(
      {
        error: 'Too Many Requests',
        code: 429,
        isRateLimit: true,
        message: 'Hệ thống AI hiện đang xử lý quá nhiều yêu cầu. Xin anh/chị vui lòng thử lại sau.'
      },
      { status: 429 }
    )
  }

  // 9. Stream response về cho client với SSE headers tối ưu
  const responseHeaders = new Headers()
  const contentType = difyResponse.headers.get('content-type') || 'text/event-stream'
  responseHeaders.set('content-type', contentType)
  responseHeaders.set('Cache-Control', 'no-cache, no-transform')
  responseHeaders.set('Connection', 'keep-alive')
  responseHeaders.set('X-Accel-Buffering', 'no')

  return new NextResponse(difyResponse.body, {
    status: difyResponse.status,
    headers: responseHeaders
  })
}

export const GET = handler
export const POST = handler
export const DELETE = handler
export const PUT = handler
export const PATCH = handler

// Tắt body parsing tự động của Next.js để stream pass-through hoạt động đúng
export const dynamic = 'force-dynamic'
