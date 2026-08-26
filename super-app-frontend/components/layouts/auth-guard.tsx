'use client'

import { useEffect, useState, useRef, useCallback } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { pb } from '@/lib/pocketbase'
import { ServerCrash, RefreshCw, ArrowRight } from 'lucide-react'

/**
 * 🔐 AUTH GUARD — Bảo vệ toàn bộ App & Quản lý phiên đăng nhập
 */
export default function AuthGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [isMounted, setIsMounted] = useState(false)
  const [isChecking, setIsChecking] = useState(true)
  const [hasConnectionError, setHasConnectionError] = useState(false)
  const hasRefreshedOnce = useRef(false)

  // Force isMounted to true on client after initial paint (prevents SSR Hydration Mismatch)
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const checkAuth = useCallback(async () => {
    try {
      const isLoginPage = pathname === '/login'

      // 1. Kiểm tra session hợp lệ trong memory
      if (!pb.authStore.isValid) {
        if (!isLoginPage) {
          router.replace('/login')
        }
        setIsChecking(false)
        return
      }

      // 2. Nếu đã đăng nhập mà đang ở trang login -> Chuyển hướng sang workspace
      if (isLoginPage) {
        const lastApp = localStorage.getItem('app_last_active_app') || '/workspace'
        router.replace(lastApp)
        setIsChecking(false)
        return
      }

      // 3. Chỉ refresh token duy nhất 1 lần khi app khởi động (tránh infinite loop)
      if (!hasRefreshedOnce.current) {
        hasRefreshedOnce.current = true
        try {
          await pb.collection('users').authRefresh()
        } catch (refreshErr: any) {
          console.warn('[AuthGuard] Token validation warning:', refreshErr?.message)
          // Nếu token thực sự bị từ chối bởi server (401/403)
          if (refreshErr?.status === 401 || refreshErr?.status === 403) {
            pb.authStore.clear()
            router.replace('/login')
            setIsChecking(false)
            return
          }
          // Nếu lỗi mạng offline, vẫn cho phép tiếp tục với session hiện có
        }
      }

      setIsChecking(false)
    } catch (err) {
      console.error('[AuthGuard Critical Exception]:', err)
      setHasConnectionError(true)
      setIsChecking(false)
    }
  }, [pathname, router])

  useEffect(() => {
    if (!isMounted) return

    checkAuth()

    // Safety fallback: Tự động tắt màn hình loading sau tối đa 2.5s
    const safetyTimer = setTimeout(() => {
      setIsChecking(false)
    }, 2500)

    return () => {
      clearTimeout(safetyTimer)
    }
  }, [isMounted, checkAuth])

  // BEFORE MOUNT (SSR / Hydration Pass 1): Return EXACT 100% identical HTML string
  if (!isMounted) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-primary min-h-screen font-mono text-sm font-bold animate-pulse space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Đang khởi động Enterprise Super App...</span>
      </div>
    )
  }

  if (hasConnectionError) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-foreground min-h-screen p-6 font-sans select-none">
        <div className="max-w-md w-full bg-card/90 border border-destructive/40 rounded-3xl p-8 text-center space-y-6 shadow-2xl backdrop-blur-2xl">
          <div className="w-16 h-16 rounded-2xl bg-destructive/15 border border-destructive/30 text-destructive flex items-center justify-center mx-auto shadow-lg">
            <ServerCrash className="w-8 h-8" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-extrabold text-foreground tracking-tight">Không Thể Kết Nối Đến Máy Chủ</h2>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Dịch vụ xác thực tạm thời không phản hồi. Vui lòng kiểm tra lại kết nối mạng hoặc thử lại.
            </p>
          </div>
          <div className="pt-2 space-y-2">
            <button
              onClick={() => {
                setHasConnectionError(false)
                setIsChecking(true)
                hasRefreshedOnce.current = false
                checkAuth()
              }}
              className="w-full py-3.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer active:scale-95"
            >
              <RefreshCw className="w-4 h-4 animate-spin" /> Thử Lại Kết Nối
            </button>
            <button
              onClick={() => {
                setHasConnectionError(false)
                setIsChecking(false)
                router.replace('/login')
              }}
              className="w-full py-3 bg-muted hover:bg-muted/80 text-foreground font-semibold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <span>Vào Trang Đăng Nhập</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    )
  }

  if (isChecking) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-background text-primary min-h-screen font-mono text-sm font-bold animate-pulse space-y-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <span>Đang khởi động Enterprise Super App...</span>
      </div>
    )
  }

  return <>{children}</>
}
