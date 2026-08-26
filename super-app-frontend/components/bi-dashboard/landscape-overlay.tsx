'use client'

import React, { useState, useEffect } from 'react'
import { Smartphone, RotateCw, Monitor, Sparkles, X } from 'lucide-react'

export default function LandscapeOverlay() {
  const [dismissed, setDismissed] = useState<boolean>(false)
  const [isPortrait, setIsPortrait] = useState<boolean>(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const mediaQuery = window.matchMedia('(orientation: portrait) and (max-width: 1024px)')
    
    const checkOrientation = () => {
      setIsPortrait(mediaQuery.matches)
    }

    checkOrientation()

    try {
      mediaQuery.addEventListener('change', checkOrientation)
      return () => mediaQuery.removeEventListener('change', checkOrientation)
    } catch (e) {
      // Fallback for older browsers
      mediaQuery.addListener(checkOrientation)
      return () => mediaQuery.removeListener(checkOrientation)
    }
  }, [])

  if (dismissed || !isPortrait) {
    return null
  }

  return (
    <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center p-6 bg-background/95 backdrop-blur-2xl text-foreground text-center select-none animate-in fade-in duration-300">
      
      {/* Background ambient glow */}
      <div className="absolute w-72 h-72 rounded-full bg-primary/20 blur-3xl pointer-events-none -top-10 -left-10 animate-pulse" />
      <div className="absolute w-72 h-72 rounded-full bg-cyan-500/15 blur-3xl pointer-events-none -bottom-10 -right-10 animate-pulse" />

      {/* Main Container */}
      <div className="relative max-w-sm w-full bg-card/80 border border-primary/40 rounded-3xl p-7 shadow-2xl shadow-primary/20 backdrop-blur-xl flex flex-col items-center gap-5">
        
        {/* Animated Phone Rotation Icon */}
        <div className="relative flex items-center justify-center w-24 h-24 rounded-2xl bg-gradient-to-br from-primary/20 to-cyan-500/20 border border-primary/30 shadow-inner">
          
          {/* Outer rotating pulse ring */}
          <div className="absolute inset-0 rounded-2xl border border-primary/50 animate-ping opacity-25" />
          
          {/* Rotating Phone Container */}
          <div className="animate-[spin_4s_ease-in-out_infinite] flex items-center justify-center text-primary">
            <Smartphone className="w-12 h-12 stroke-[1.75]" />
          </div>

          <div className="absolute -bottom-2 -right-2 p-1.5 rounded-full bg-primary text-primary-foreground shadow-md animate-bounce">
            <RotateCw className="w-3.5 h-3.5" />
          </div>
        </div>

        {/* Text Content */}
        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/30 text-primary text-[11px] font-extrabold tracking-wide uppercase">
            <Sparkles className="w-3 h-3" />
            <span>Chế độ hiển thị tối ưu</span>
          </div>

          <h2 className="text-base sm:text-lg font-black tracking-tight text-foreground">
            Vui lòng Xoay Ngang Thiết Bị
          </h2>

          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Vui lòng xoay ngang thiết bị để trải nghiệm <span className="font-semibold text-foreground">Dashboard Thông số</span> và hệ thống lưới hít 36 cột một cách tốt nhất.
          </p>
        </div>

        {/* Feature Badges */}
        <div className="grid grid-cols-2 gap-2 w-full pt-1">
          <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-muted/50 border border-border/80 text-[11px] font-semibold text-muted-foreground">
            <Monitor className="w-3.5 h-3.5 text-primary" />
            <span>Chuẩn Power BI</span>
          </div>
          <div className="flex items-center justify-center gap-1.5 p-2 rounded-xl bg-muted/50 border border-border/80 text-[11px] font-semibold text-muted-foreground">
            <RotateCw className="w-3.5 h-3.5 text-cyan-400" />
            <span>Lưới Hít Snap-Grid</span>
          </div>
        </div>

        {/* Temporary bypass button for dev/testing */}
        <button
          onClick={() => setDismissed(true)}
          className="text-[11px] text-muted-foreground/80 hover:text-foreground underline underline-offset-4 pt-1 transition-colors cursor-pointer"
        >
          Tiếp tục ở chế độ dọc (xem thu gọn)
        </button>

      </div>

    </div>
  )
}
