import { supabase } from '@/lib/supabase'
import { cleanEmpId } from '@/lib/utils'

/**
 * 🔐 DIFY CLIENT — Gọi qua /api/dify-proxy (server-side proxy)
 *
 * THAY ĐỔI BẢO MẬT:
 * - Client KHÔNG còn biết Dify API Key (đã chuyển sang server-side proxy)
 * - Client KHÔNG còn gọi trực tiếp đến Dify URL
 * - Mọi request đều đi qua /api/dify-proxy → được validate PocketBase token → inject API Key → forward đến Dify
 *
 * Cách client truyền context cho proxy:
 * - Header `x-department`: phòng ban (để proxy chọn đúng API Key)
 * - Header `x-dify-mode`: 'chat' hoặc 'work'
 * - Header `x-pb-token`: PocketBase JWT token (để proxy validate)
 */

// ────────────────────────────────────────────────────────────
// Lấy PocketBase token hiện tại từ authStore (không từ localStorage)
// ────────────────────────────────────────────────────────────
function getPbToken(): string {
  // pb.authStore.token là nơi đáng tin cậy nhất — được quản lý bởi PocketBase SDK
  try {
    // Dynamic import để tránh vòng circular
    const { pb } = require('@/lib/pocketbase')
    return pb.authStore.token || ''
  } catch {
    return ''
  }
}

// ────────────────────────────────────────────────────────────
// Tạo headers chuẩn cho mọi request đến proxy
// ────────────────────────────────────────────────────────────
const getProxyHeaders = (department?: string | null, mode: 'chat' | 'work' = 'chat'): HeadersInit => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'x-dify-mode': mode
  }
  if (department) {
    headers['x-department'] = encodeURIComponent(department)
  }
  const pbToken = getPbToken()
  if (pbToken) {
    headers['x-pb-token'] = pbToken
  }
  return headers
}

// ────────────────────────────────────────────────────────────
// Base proxy URL (relative → tự động match domain hiện tại)
// ────────────────────────────────────────────────────────────
const PROXY_BASE = '/api/dify-proxy'

// ────────────────────────────────────────────────────────────
// ThoughtStep — Interface Dòng suy nghĩ và Tiến trình Thực thi
// ────────────────────────────────────────────────────────────
export interface ThoughtStep {
  id: string
  title: string
  nodeType?: string
  status: 'running' | 'completed' | 'error'
  timestamp: number
  detail?: string
  toolName?: string
}

export function formatNodeStatusTitle(title?: string, nodeType?: string, toolName?: string): string {
  const t = (title || '').toLowerCase()
  const n = (nodeType || '').toLowerCase()
  const tn = (toolName || '').toLowerCase()

  if (tn.includes('searchfile') || tn.includes('locate') || t.includes('tìm kiếm file') || t.includes('tìm file')) {
    return '🔍 Đang dò tìm thư mục & tệp trên Google Drive...'
  }
  if (tn.includes('get_rowcolumn') || tn.includes('schema') || t.includes('quét cấu trúc') || t.includes('schema')) {
    return '📊 Đang quét cấu trúc bảng tính Google Sheets (Schema Scanner)...'
  }
  if (tn.includes('get_data') || tn.includes('extract') || t.includes('trích xuất dữ liệu') || t.includes('extract')) {
    return '📑 Đang trích xuất dữ liệu bảng tính Google Sheets...'
  }
  if (t.includes('agent truy xuất') || tn.includes('agent_truy_xuat')) {
    return '🤖 Đang kích hoạt Agent Truy xuất dữ liệu (Băng chuyền 3 Tool)...'
  }
  if (t.includes('kpi') || t.includes('get rows') || tn.includes('get_rows')) {
    return '📈 Đang tra cứu số liệu KPI từ cơ sở dữ liệu Supabase...'
  }
  if (n.includes('if-else') || t.includes('định tuyến') || t.includes('router') || t.includes('rbac')) {
    return '🔀 Đang thẩm định quyền hạn & phân luồng nghiệp vụ...'
  }
  if (n.includes('knowledge') || t.includes('kr') || t.includes('tri thức')) {
    return '📚 Đang tra cứu cơ sở tri thức nghiệp vụ doanh nghiệp...'
  }
  if (n.includes('parameter-extractor') || t.includes('trích xuất mã') || t.includes('trích xuất')) {
    return '🎯 Đang nhận diện tham số & mã định danh...'
  }
  if (n.includes('variable-aggregator') || t.includes('tổng hợp')) {
    return '📋 Đang tổng hợp các nguồn dữ liệu...'
  }
  if (n.includes('llm') || t.includes('llm')) {
    return '🧠 Đang tổng hợp phân tích và chuẩn bị câu trả lời...'
  }
  if (title) {
    return `⚙️ Đang thực hiện: ${title}...`
  }
  return '⚡ Đang điều phối xử lý...'
}

// ────────────────────────────────────────────────────────────
// Hằng số thông điệp lỗi chuẩn & Bộ lọc nhận diện lỗi Quota / Rate Limit
// ────────────────────────────────────────────────────────────
export const STANDARD_RATE_LIMIT_MSG =
  'Hệ thống AI hiện đang xử lý quá nhiều yêu cầu. Xin anh/chị vui lòng thử lại sau.'

export function isRateLimitError(text?: string | null): boolean {
  if (!text) return false
  const lower = String(text).toLowerCase()
  return (
    lower.includes('429') ||
    lower.includes('resource_exhausted') ||
    lower.includes('quota') ||
    lower.includes('rate limit') ||
    lower.includes('too many requests') ||
    lower.includes('exceeded your current quota')
  )
}

// ────────────────────────────────────────────────────────────
// sendClientChat — Gửi tin nhắn đến Dify Chatflow (Streaming SSE)
// ────────────────────────────────────────────────────────────
export async function sendClientChat({
  query,
  department,
  department_id,
  role_level,
  user_level,
  user_email,
  emp_id,
  conversation_id,
  sys_topic,
  base_context,
  onChunk,
  onThought
}: {
  query: string
  department?: string | null
  department_id?: string | null
  role_level?: number | string | null
  user_level?: number | string | null
  user_email?: string | null
  emp_id?: string | null
  conversation_id?: string | null
  sys_topic?: string | null
  base_context?: string | null
  onChunk?: (text: string) => void
  onThought?: (step: ThoughtStep, allSteps: ThoughtStep[]) => void
}) {
  const endpoint = `${PROXY_BASE}/chat-messages`
  const headers = getProxyHeaders(department, 'chat')
  const effectiveEmpId = cleanEmpId(emp_id || (user_email ? user_email.split('@')[0] : 'anonymous')) || 'anonymous'
  const effectiveRoleLevel = String(role_level ?? user_level ?? '1')
  const effectiveDept = department || 'IBB'
  const effectiveDeptId = department_id !== undefined && department_id !== null ? String(department_id) : (Number(effectiveRoleLevel) >= 4 ? '' : '1')

  const payload: any = {
    inputs: {
      sys_topic: sys_topic || 'Chung',
      base_context: base_context || '',
      emp_id: effectiveEmpId,
      role_level: effectiveRoleLevel,
      department: effectiveDept,
      department_id: effectiveDeptId
    },
    query,
    response_mode: 'streaming',
    user: effectiveEmpId
  }
  if (conversation_id) {
    payload.conversation_id = conversation_id
  }

  const thoughtSteps: ThoughtStep[] = []

  const updateThoughts = (newOrUpdatedStep?: ThoughtStep) => {
    if (newOrUpdatedStep) {
      const idx = thoughtSteps.findIndex(s => s.id === newOrUpdatedStep.id)
      if (idx >= 0) {
        thoughtSteps[idx] = newOrUpdatedStep
      } else {
        thoughtSteps.push(newOrUpdatedStep)
      }
      onThought?.(newOrUpdatedStep, [...thoughtSteps])
    }
  }

  let response: Response
  try {
    response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify(payload)
    })
  } catch (err: any) {
    console.error('[sendClientChat Fetch Error]:', err)
    for (const s of thoughtSteps) {
      if (s.status === 'running') s.status = 'error'
    }
    updateThoughts({
      id: 'net_err',
      title: '⚠️ Mất kết nối đến máy chủ AI',
      status: 'error',
      timestamp: Date.now(),
      detail: 'Không thể kết nối đến máy chủ. Xin vui lòng kiểm tra lại mạng.'
    })
    throw new Error('Không thể kết nối đến máy chủ AI. Xin anh/chị vui lòng thử lại sau.')
  }

  // Bắt lỗi HTTP status (429 hoặc lỗi khác)
  if (!response.ok) {
    for (const s of thoughtSteps) {
      if (s.status === 'running') s.status = 'error'
    }

    if (response.status === 429) {
      updateThoughts({
        id: 'rate_limit_step',
        title: '⚠️ Hệ thống AI hiện đang xử lý quá nhiều yêu cầu',
        status: 'error',
        timestamp: Date.now(),
        detail: 'Định ngạch kết nối AI tạm thời bị giới hạn. Vui lòng thử lại sau giây lát.'
      })
      throw new Error(STANDARD_RATE_LIMIT_MSG)
    }

    let errMsg = 'Lỗi khi kết nối đến Dify API (Chatflow)'
    try {
      const errData = await response.json()
      if (isRateLimitError(errData.message || errData.error)) {
        updateThoughts({
          id: 'rate_limit_step',
          title: '⚠️ Hệ thống AI hiện đang xử lý quá nhiều yêu cầu',
          status: 'error',
          timestamp: Date.now(),
          detail: 'Định ngạch kết nối AI tạm thời bị giới hạn. Vui lòng thử lại sau giây lát.'
        })
        throw new Error(STANDARD_RATE_LIMIT_MSG)
      }
      errMsg = errData.message || errMsg
    } catch (e: any) {
      if (e.message === STANDARD_RATE_LIMIT_MSG) throw e
    }
    throw new Error(errMsg)
  }

  let finalAnswer = ''
  let resConversationId = conversation_id || ''

  const contentType = response.headers.get('content-type') || ''
  if (contentType.includes('text/event-stream') || response.body) {
    const reader = response.body?.getReader()
    const decoder = new TextDecoder('utf-8')
    let buffer = ''

    if (reader) {
      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          const trimmed = line.trim()
          if (!trimmed || !trimmed.startsWith('data:')) continue
          const dataStr = trimmed.slice(5).trim()
          if (dataStr === '[DONE]') continue

          try {
            const parsed = JSON.parse(dataStr)
            if (parsed.conversation_id) {
              resConversationId = parsed.conversation_id
            }

            const evt = parsed.event

            if (evt === 'workflow_started') {
              const startStep: ThoughtStep = {
                id: 'wf_start',
                title: '🚀 Khởi động luồng điều phối nghiệp vụ Enterprise Multi-Agent...',
                status: 'completed',
                timestamp: Date.now()
              }
              updateThoughts(startStep)
            } else if (evt === 'node_started') {
              const nodeData = parsed.data || {}
              const nodeId = nodeData.node_id || nodeData.id || `node_${Date.now()}`
              const nodeTitle = nodeData.title || nodeData.node_type || 'Đang xử lý'
              const nodeType = nodeData.node_type || ''
              const statusTitle = formatNodeStatusTitle(nodeTitle, nodeType)

              // Mark previous running steps as completed
              for (const s of thoughtSteps) {
                if (s.status === 'running') s.status = 'completed'
              }

              const newStep: ThoughtStep = {
                id: nodeId,
                title: statusTitle,
                nodeType: nodeType,
                status: 'running',
                timestamp: Date.now()
              }
              updateThoughts(newStep)
            } else if (evt === 'tool_call' || evt === 'tool_started') {
              const toolData = parsed.data || {}
              const toolName = toolData.tool || toolData.name || parsed.tool || 'Tool'
              const toolTitle = formatNodeStatusTitle(undefined, undefined, toolName)
              const toolStep: ThoughtStep = {
                id: `tool_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
                title: toolTitle,
                toolName: toolName,
                status: 'running',
                timestamp: Date.now(),
                detail: toolData.tool_input ? JSON.stringify(toolData.tool_input) : undefined
              }
              updateThoughts(toolStep)
            } else if (evt === 'agent_thought') {
              if (parsed.thought) {
                const latestStep = thoughtSteps[thoughtSteps.length - 1]
                if (latestStep && latestStep.status === 'running') {
                  latestStep.detail = (latestStep.detail ? latestStep.detail + '\n' : '') + parsed.thought
                  updateThoughts(latestStep)
                }
              }
            } else if (evt === 'node_finished') {
              const nodeData = parsed.data || {}
              const nodeId = nodeData.node_id || nodeData.id
              const isNodeFailed = nodeData.status === 'failed' || nodeData.error
              const found = thoughtSteps.find(s => s.id === nodeId)
              if (found) {
                found.status = isNodeFailed ? 'error' : 'completed'
                if (isNodeFailed && nodeData.error) {
                  found.detail = String(nodeData.error)
                }
                updateThoughts(found)
              } else {
                for (const s of thoughtSteps) {
                  if (s.status === 'running') s.status = 'completed'
                }
              }
            } else if (
              evt === 'message' ||
              evt === 'agent_message' ||
              evt === 'text_chunk' ||
              parsed.answer
            ) {
              if (parsed.answer) {
                finalAnswer += parsed.answer
                onChunk?.(finalAnswer)
              }
            } else if (evt === 'error') {
              const rawErrMsg = parsed.message || parsed.data?.message || ''
              for (const s of thoughtSteps) {
                if (s.status === 'running') s.status = 'error'
              }
              if (isRateLimitError(rawErrMsg)) {
                finalAnswer = STANDARD_RATE_LIMIT_MSG
                onChunk?.(finalAnswer)
                updateThoughts({
                  id: 'rate_limit_step',
                  title: '⚠️ Hệ thống AI hiện đang xử lý quá nhiều yêu cầu',
                  status: 'error',
                  timestamp: Date.now(),
                  detail: 'Định ngạch kết nối AI tạm thời bị giới hạn. Vui lòng thử lại sau giây lát.'
                })
              } else if (rawErrMsg && !finalAnswer) {
                finalAnswer = `Lỗi hệ thống AI: ${rawErrMsg}`
                onChunk?.(finalAnswer)
              }
            } else if (evt === 'workflow_finished') {
              const wfData = parsed.data || {}
              const wfError = wfData.error || ''
              const isFailed = wfData.status === 'failed' || Boolean(wfError)

              if (isFailed) {
                for (const s of thoughtSteps) {
                  if (s.status === 'running') s.status = 'error'
                }

                if (isRateLimitError(wfError)) {
                  finalAnswer = STANDARD_RATE_LIMIT_MSG
                  onChunk?.(finalAnswer)
                  updateThoughts({
                    id: 'rate_limit_step',
                    title: '⚠️ Hệ thống AI hiện đang xử lý quá nhiều yêu cầu',
                    status: 'error',
                    timestamp: Date.now(),
                    detail: 'Định ngạch kết nối AI tạm thời bị giới hạn. Vui lòng thử lại sau giây lát.'
                  })
                } else if (wfError && !finalAnswer) {
                  finalAnswer = `Đã xảy ra sự cố trong quá trình xử lý: ${wfError}`
                  onChunk?.(finalAnswer)
                }
              } else {
                for (const s of thoughtSteps) {
                  if (s.status === 'running') s.status = 'completed'
                }
                if (wfData.outputs?.result && !finalAnswer) {
                  finalAnswer = wfData.outputs.result
                  onChunk?.(finalAnswer)
                }
                onThought?.(
                  {
                    id: 'wf_end',
                    title: '✅ Hoàn tất xử lý yêu cầu và tổng hợp báo cáo.',
                    status: 'completed',
                    timestamp: Date.now()
                  },
                  [...thoughtSteps]
                )
              }
            }
          } catch (e) {
            // Ignore parse errors on line splits
          }
        }
      }
    }
  }

  if (!finalAnswer) {
    try {
      const data = await response.json()
      finalAnswer = data.answer || data.answer_text || 'Đã xử lý thông tin thành công.'
      if (data.conversation_id) {
        resConversationId = data.conversation_id
      }
    } catch (e) {}
  }

  // Supabase Fire-and-forget Query Logging for Trending Data Analysis (Single prompt only)
  ;(async () => {
    try {
      // 1. Chỉ lưu 1 câu hỏi đơn lẻ hiện tại vào chat_logs (không lưu cả đoạn hội thoại dài)
      await supabase.from('chat_logs').insert({
        query_text: query
      })

      // 2. Tự động dọn dẹp xoay vòng: Xóa log cũ hơn 7 ngày để bảng không bị phình to vô hạn
      if (Math.random() < 0.1) {
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
        await supabase.from('chat_logs').delete().lt('created_at', sevenDaysAgo)
      }
    } catch (e) {
      console.error('Supabase chat_logs insert error (fire-and-forget):', e)
    }
  })()

  // Supabase Usage Logging from Client
  try {
    await supabase.from('usage_logs').insert({
      user_id: effectiveEmpId,
      action: 'tư vấn',
      target_agent: department || 'General'
    })
  } catch (e) {
    console.error('Supabase client log error:', e)
  }

  return {
    answer: finalAnswer,
    conversation_id: resConversationId
  }
}

// ────────────────────────────────────────────────────────────
// fetchClientConversations — Lấy danh sách cuộc trò chuyện từ Dify
// ────────────────────────────────────────────────────────────
export async function fetchClientConversations({
  department,
  user_email,
  emp_id,
  limit = 20
}: {
  department?: string | null
  user_email?: string | null
  emp_id?: string | null
  limit?: number
}) {
  try {
    const headers = getProxyHeaders(department, 'chat')
    const effectiveEmpId = cleanEmpId(emp_id || (user_email ? user_email.split('@')[0] : 'anonymous')) || 'anonymous'
    const endpoint = `${PROXY_BASE}/conversations?user=${encodeURIComponent(effectiveEmpId)}&limit=${limit}&sort_by=-updated_at`

    const response = await fetch(endpoint, {
      method: 'GET',
      headers
    }).catch(err => {
      console.warn('[Dify Service] Proxy unreachable:', err?.message || err)
      return null
    })

    if (!response) {
      return { data: [], has_more: false }
    }

    if (!response.ok) {
      let errMsg = 'Không thể lấy danh sách cuộc trò chuyện từ Dify'
      try {
        const errData = await response.json()
        errMsg = errData.message || errMsg
      } catch (e) {}
      console.warn('[Dify API Warning]:', errMsg)
      return { data: [], has_more: false }
    }

    return await response.json()
  } catch (error) {
    console.warn('[Dify fetchClientConversations caught]:', error)
    return { data: [], has_more: false }
  }
}

// ────────────────────────────────────────────────────────────
// fetchClientMessages — Lấy tin nhắn trong một cuộc trò chuyện
// ────────────────────────────────────────────────────────────
export async function fetchClientMessages({
  conversation_id,
  department,
  user_email,
  emp_id,
  limit = 50
}: {
  conversation_id: string
  department?: string | null
  user_email?: string | null
  emp_id?: string | null
  limit?: number
}) {
  try {
    const headers = getProxyHeaders(department, 'chat')
    const effectiveEmpId = cleanEmpId(emp_id || (user_email ? user_email.split('@')[0] : 'anonymous')) || 'anonymous'
    const endpoint = `${PROXY_BASE}/messages?user=${encodeURIComponent(effectiveEmpId)}&conversation_id=${encodeURIComponent(conversation_id)}&limit=${limit}`

    const response = await fetch(endpoint, {
      method: 'GET',
      headers
    }).catch(err => {
      console.warn('[Dify Service] Proxy messages endpoint unreachable:', err?.message || err)
      return null
    })

    if (!response) {
      return { data: [], has_more: false }
    }

    if (!response.ok) {
      let errMsg = 'Không thể lấy nội dung tin nhắn từ Dify'
      try {
        const errData = await response.json()
        errMsg = errData.message || errMsg
      } catch (e) {}
      console.warn('[Dify API Warning]:', errMsg)
      return { data: [], has_more: false }
    }

    return await response.json()
  } catch (error) {
    console.warn('[Dify fetchClientMessages caught]:', error)
    return { data: [], has_more: false }
  }
}

// ────────────────────────────────────────────────────────────
// deleteClientConversation — Xóa một cuộc trò chuyện
// ────────────────────────────────────────────────────────────
export async function deleteClientConversation({
  conversation_id,
  department,
  user_email,
  emp_id
}: {
  conversation_id: string
  department?: string | null
  user_email?: string | null
  emp_id?: string | null
}) {
  try {
    const headers = getProxyHeaders(department, 'chat')
    const effectiveEmpId = cleanEmpId(emp_id || (user_email ? user_email.split('@')[0] : 'anonymous')) || 'anonymous'
    const endpoint = `${PROXY_BASE}/conversations/${encodeURIComponent(conversation_id)}`

    const response = await fetch(endpoint, {
      method: 'DELETE',
      headers,
      body: JSON.stringify({
        user: effectiveEmpId
      })
    }).catch(err => {
      console.warn('[Dify Service] Delete conversation unreachable:', err?.message || err)
      return null
    })

    if (!response || !response.ok) {
      return false
    }

    return true
  } catch (error) {
    console.warn('[Dify deleteClientConversation caught]:', error)
    return false
  }
}

// ────────────────────────────────────────────────────────────
// renameClientConversation — Đổi tên cuộc trò chuyện
// ────────────────────────────────────────────────────────────
export async function renameClientConversation({
  conversation_id,
  name,
  auto_generate = false,
  department,
  user_email,
  emp_id
}: {
  conversation_id: string
  name?: string
  auto_generate?: boolean
  department?: string | null
  user_email?: string | null
  emp_id?: string | null
}) {
  try {
    const headers = getProxyHeaders(department, 'chat')
    const effectiveEmpId = cleanEmpId(emp_id || (user_email ? user_email.split('@')[0] : 'anonymous')) || 'anonymous'
    const endpoint = `${PROXY_BASE}/conversations/${encodeURIComponent(conversation_id)}/name`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        name: name || '',
        auto_generate,
        user: effectiveEmpId
      })
    }).catch(err => {
      console.warn('[Dify Service] Rename conversation unreachable:', err?.message || err)
      return null
    })

    if (!response || !response.ok) {
      return null
    }

    return await response.json()
  } catch (error) {
    console.warn('[Dify renameClientConversation caught]:', error)
    return null
  }
}

// ────────────────────────────────────────────────────────────
// runClientWorkflow — Chạy Dify Workflow qua proxy
// ────────────────────────────────────────────────────────────
export async function runClientWorkflow({
  inputs,
  department,
  user_email
}: {
  inputs: any
  department?: string | null
  user_email?: string | null
}) {
  const headers = getProxyHeaders(department, 'work')
  const endpoint = `${PROXY_BASE}/workflows/run`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      inputs: inputs || {},
      response_mode: 'blocking',
      user: user_email || 'anonymous'
    })
  })

  const data = await response.json()

  if (!response.ok) {
    if (response.status === 429 || isRateLimitError(data.message || data.error)) {
      throw new Error(STANDARD_RATE_LIMIT_MSG)
    }
    throw new Error(data.message || 'Lỗi khi kết nối đến Dify API (Workflow)')
  }

  // Supabase Logging from Client
  try {
    await supabase.from('usage_logs').insert({
      user_id: user_email || 'anonymous',
      action: 'thực thi',
      target_agent: department || 'General'
    })
  } catch (e) {
    console.error('Supabase client log error:', e)
  }

  return data
}
