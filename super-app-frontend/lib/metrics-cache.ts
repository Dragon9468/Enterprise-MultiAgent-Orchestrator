/**
 * ⚡ METRICS IN-MEMORY & SESSION CACHE MANAGER
 * Cung cấp giải pháp lưu trữ đệm đa tầng (Memory Map + SessionStorage) kèm TTL 10 phút.
 * Giúp chuyển đổi Tab và chuyển đổi Nhân viên/Khu vực tức thì (0ms) mà không tốn Egress Supabase.
 */

const CACHE_TTL_MS = 10 * 60 * 1000 // 10 minutes

interface CacheItem<T> {
  data: T
  timestamp: number
}

// 1. In-Memory Maps (Siêu tốc 0ms trong runtime)
const employeeMetricsMemoryCache = new Map<string, CacheItem<any>>()
const areaMetricsMemoryCache = new Map<string, CacheItem<any>>()
let areaListMemoryCache: CacheItem<any[]> | null = null
let employeeListMemoryCache: CacheItem<any[]> | null = null

// Helper an toàn cho SessionStorage
const getSessionItem = <T>(key: string): T | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = sessionStorage.getItem(`app_cache_${key}`)
    if (!raw) return null
    const parsed: CacheItem<T> = JSON.parse(raw)
    if (Date.now() - parsed.timestamp > CACHE_TTL_MS) {
      sessionStorage.removeItem(`app_cache_${key}`)
      return null
    }
    return parsed.data
  } catch (e) {
    return null
  }
}

const setSessionItem = <T>(key: string, data: T) => {
  if (typeof window === 'undefined') return
  try {
    const item: CacheItem<T> = { data, timestamp: Date.now() }
    sessionStorage.setItem(`app_cache_${key}`, JSON.stringify(item))
  } catch (e) {
    // QuotaExceeded hoặc Private Mode fallback an toàn
  }
}

// ==========================================
// 👤 EMPLOYEE METRICS CACHE
// ==========================================
export const getCachedEmployeeMetrics = (empId: string): any | null => {
  const normalized = empId.trim().toUpperCase()
  const mem = employeeMetricsMemoryCache.get(normalized)
  if (mem && (Date.now() - mem.timestamp <= CACHE_TTL_MS)) {
    return mem.data
  }
  const session = getSessionItem<any>(`emp_${normalized}`)
  if (session) {
    employeeMetricsMemoryCache.set(normalized, { data: session, timestamp: Date.now() })
    return session
  }
  return null
}

export const setCachedEmployeeMetrics = (empId: string, data: any) => {
  const normalized = empId.trim().toUpperCase()
  const item: CacheItem<any> = { data, timestamp: Date.now() }
  employeeMetricsMemoryCache.set(normalized, item)
  setSessionItem(`emp_${normalized}`, data)
}

// ==========================================
// 🗺️ AREA (KHU VỰC) METRICS CACHE
// ==========================================
export const getCachedAreaMetrics = (areaId: string): any | null => {
  const normalized = areaId.trim().toUpperCase()
  const mem = areaMetricsMemoryCache.get(normalized)
  if (mem && (Date.now() - mem.timestamp <= CACHE_TTL_MS)) {
    return mem.data
  }
  const session = getSessionItem<any>(`area_${normalized}`)
  if (session) {
    areaMetricsMemoryCache.set(normalized, { data: session, timestamp: Date.now() })
    return session
  }
  return null
}

export const setCachedAreaMetrics = (areaId: string, data: any) => {
  const normalized = areaId.trim().toUpperCase()
  const item: CacheItem<any> = { data, timestamp: Date.now() }
  areaMetricsMemoryCache.set(normalized, item)
  setSessionItem(`area_${normalized}`, data)
}

// ==========================================
// 📋 AREA LIST CACHE
// ==========================================
export const getCachedAreaList = (): any[] | null => {
  if (areaListMemoryCache && (Date.now() - areaListMemoryCache.timestamp <= CACHE_TTL_MS)) {
    return areaListMemoryCache.data
  }
  const session = getSessionItem<any[]>('area_list')
  if (session) {
    areaListMemoryCache = { data: session, timestamp: Date.now() }
    return session
  }
  return null
}

export const setCachedAreaList = (list: any[]) => {
  areaListMemoryCache = { data: list, timestamp: Date.now() }
  setSessionItem('area_list', list)
}

// ==========================================
// 👥 EMPLOYEE LIST CACHE
// ==========================================
export const getCachedEmployeeList = (): any[] | null => {
  if (employeeListMemoryCache && (Date.now() - employeeListMemoryCache.timestamp <= CACHE_TTL_MS)) {
    return employeeListMemoryCache.data
  }
  const session = getSessionItem<any[]>('employee_list')
  if (session) {
    employeeListMemoryCache = { data: session, timestamp: Date.now() }
    return session
  }
  return null
}

export const setCachedEmployeeList = (list: any[]) => {
  employeeListMemoryCache = { data: list, timestamp: Date.now() }
  setSessionItem('employee_list', list)
}

// ==========================================
// 🔒 PURGE / CLEAR CACHE ON LOGOUT OR ROLE CHANGE
// ==========================================
export const clearAllMetricsCache = () => {
  employeeMetricsMemoryCache.clear()
  areaMetricsMemoryCache.clear()
  areaListMemoryCache = null
  employeeListMemoryCache = null
  if (typeof window !== 'undefined') {
    try {
      Object.keys(sessionStorage).forEach(key => {
        if (key.startsWith('app_cache_')) {
          sessionStorage.removeItem(key)
        }
      })
    } catch (e) {}
  }
}
