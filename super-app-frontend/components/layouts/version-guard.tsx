'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, Download, ArrowRight, ShieldAlert } from 'lucide-react'

const CURRENT_VERSION = process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0'

// So sánh phiên bản v1 < v2 (VD: 1.0.0 < 1.0.1 -> true)
const isOutdated = (v1: string, v2: string): boolean => {
  const parts1 = v1.split('.').map(n => parseInt(n, 10) || 0)
  const parts2 = v2.split('.').map(n => parseInt(n, 10) || 0)
  const maxLen = Math.max(parts1.length, parts2.length)
  
  for (let i = 0; i < maxLen; i++) {
    const num1 = parts1[i] || 0
    const num2 = parts2[i] || 0
    if (num1 < num2) return true
    if (num1 > num2) return false
  }
  return false
}

export default function VersionGuard({ children }: { children: React.ReactNode }) {
  const [isOutdatedVersion, setIsOutdatedVersion] = useState(false)
  const [latestVersion, setLatestVersion] = useState('1.0.0')
  const [updateUrl, setUpdateUrl] = useState('https://github.com/Dragon9468/Enterprise-MultiAgent-Orchestrator/releases')
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    const checkVersion = async () => {
      try {
        // Thêm timestamp query param để tránh bị cache trình duyệt
        const res = await fetch(`/version.json?t=${Date.now()}`, { cache: 'no-store' })
        if (res.ok) {
          const data = await res.json()
          if (data.latest_version) {
            setLatestVersion(data.latest_version)
            if (data.update_url) {
              setUpdateUrl(data.update_url)
            }
            
            if (isOutdated(CURRENT_VERSION, data.latest_version)) {
              setIsOutdatedVersion(true)
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch version config:', error)
      } finally {
        setChecking(false)
      }
    }

    checkVersion()
  }, [])

  if (isOutdatedVersion) {
    return (
      <div className="fixed inset-0 z-[99999] bg-black/90 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-6 select-none font-sans">
        <div className="w-full max-w-md bg-card/95 border-2 border-red-500/60 rounded-3xl p-6 sm:p-8 text-center space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.3)] relative overflow-hidden backdrop-blur-3xl animate-in fade-in zoom-in duration-300">
          {/* Pulsing Ambient Background Effect */}
          <div className="absolute -top-24 -left-24 w-48 h-48 bg-red-500/20 rounded-full blur-3xl pointer-events-none animate-pulse" />
          <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-600/20 rounded-full blur-3xl pointer-events-none animate-pulse" />

          {/* Red Alert Icon */}
          <div className="relative mx-auto w-20 h-20 rounded-2xl bg-red-500/15 border border-red-500/30 text-red-500 flex items-center justify-center shadow-lg">
            <ShieldAlert className="w-10 h-10 animate-bounce" />
          </div>

          {/* Text Warnings */}
          <div className="space-y-2">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-widest bg-red-500/20 text-red-400 border border-red-500/40 inline-flex items-center gap-1.5">
              <AlertTriangle className="w-3.5 h-3.5" /> Bắt Buộc Cập Nhật
            </span>
            <h2 className="text-2xl font-black text-foreground tracking-tight pt-1">
              Phiên Bản Đã Cũ!
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
              Vui lòng tải bản cập nhật mới nhất để tiếp tục sử dụng ứng dụng Super App an toàn.
            </p>
          </div>

          {/* Version Info Table */}
          <div className="p-4 rounded-2xl bg-background/60 border border-border/80 text-xs space-y-2 font-mono">
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Phiên bản hiện tại:</span>
              <span className="font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded">v{CURRENT_VERSION}</span>
            </div>
            <div className="flex justify-between items-center text-muted-foreground">
              <span>Phiên bản mới nhất:</span>
              <span className="font-bold text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">v{latestVersion}</span>
            </div>
          </div>

          {/* Update Action Button */}
          <a
            href={updateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3.5 px-6 bg-red-600 hover:bg-red-500 text-white font-bold text-sm rounded-2xl transition-all shadow-lg shadow-red-600/30 flex items-center justify-center gap-2 cursor-pointer group"
          >
            <Download className="w-4 h-4 group-hover:-translate-y-0.5 transition-transform" />
            Tải Bản Cập Nhật Mới Nhất
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </div>
    )
  }

  return <>{children}</>
}
