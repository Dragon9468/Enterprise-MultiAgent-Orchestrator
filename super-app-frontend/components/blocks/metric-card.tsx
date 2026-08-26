'use client'

import React from 'react'
import { CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react'

export interface MetricCardProps {
  title: string
  value: string | number
  unit?: string
  icon?: React.ReactNode
  iconBgColor?: string
  iconColor?: string
  
  // KPI Config
  kpiTarget?: number
  metricType?: 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER'
  
  // Custom Donut Ring (Placed right next to the number)
  showDonut?: boolean
  donutStrokeColor?: string
  donutTextColor?: string

  // Stacked Horizontal Bar Chart (For Lặp 2 + Lặp 3)
  showStackedBar?: boolean
  lap2Val?: number
  lap3Val?: number

  // Extra Class & Interactivity
  className?: string
  onClick?: () => void
}

export default function MetricCard({
  title,
  value,
  unit = '',
  icon,
  iconBgColor = 'bg-primary/10',
  iconColor = 'text-primary',
  kpiTarget,
  metricType = 'HIGHER_IS_BETTER',
  showDonut = false,
  donutStrokeColor = '#0284c7',
  donutTextColor = 'text-sky-400',
  showStackedBar = false,
  lap2Val = 0,
  lap3Val = 0,
  className = '',
  onClick,
}: MetricCardProps) {
  // Check if value is missing or "Chưa có chỉ số"
  const isNoData = !value || String(value).includes('Chưa có') || String(value) === 'N/A'

  // Parse numeric current value cleanly
  const rawString = String(value ?? '').replace(/%/g, '').trim()
  const numericVal = parseFloat(rawString)
  const isNumber = !isNoData && !isNaN(numericVal)

  // Calculate KPI Status & Footer UI
  let footerElement: React.ReactNode = null

  if (kpiTarget !== undefined && isNumber) {
    const formattedUnit = unit === '%' ? '%' : (unit ? ` ${unit}` : '')

    if (metricType === 'HIGHER_IS_BETTER') {
      const diff = numericVal - kpiTarget
      if (numericVal < kpiTarget) {
        // Còn thiếu X
        const missing = (kpiTarget - numericVal).toFixed(1).replace(/\.0$/, '')
        footerElement = (
          <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-border/40 text-amber-400 font-bold">
            <span className="flex items-center gap-1 truncate">
              <AlertTriangle className="w-3 h-3 flex-shrink-0 text-amber-400" />
              <span className="truncate">Còn thiếu {missing}{formattedUnit}</span>
            </span>
            <span className="flex-shrink-0 text-[10px]">⚠️</span>
          </div>
        )
      } else {
        // Đã đạt/vượt KPI
        const extra = diff > 0 ? ` (+${diff.toFixed(1).replace(/\.0$/, '')}${formattedUnit})` : ''
        footerElement = (
          <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-border/40 text-emerald-400 font-bold">
            <span className="flex items-center gap-1 truncate">
              <CheckCircle2 className="w-3 h-3 flex-shrink-0 text-emerald-400" />
              <span className="truncate">Đã đạt/vượt KPI{extra}</span>
            </span>
            <span className="flex-shrink-0 text-[10px]">🟢</span>
          </div>
        )
      }
    } else if (metricType === 'LOWER_IS_BETTER') {
      const isExceeded = numericVal > kpiTarget
      const diff = Math.abs(numericVal - kpiTarget)

      if (isExceeded) {
        // Vượt quá X
        const exceededAmt = diff.toFixed(1).replace(/\.0$/, '')
        footerElement = (
          <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-border/40 text-rose-400 font-bold">
            <span className="flex items-center gap-1 truncate">
              <AlertTriangle className="w-3 h-3 flex-shrink-0 text-rose-400 animate-pulse" />
              <span className="truncate">Vượt quá {exceededAmt}{formattedUnit}</span>
            </span>
            <span className="flex-shrink-0 text-[10px]">🚨</span>
          </div>
        )
      } else {
        // Đạt chuẩn an toàn (Dưới KPI)
        footerElement = (
          <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-border/40 text-emerald-400 font-bold">
            <span className="flex items-center gap-1 truncate">
              <ShieldCheck className="w-3 h-3 flex-shrink-0 text-emerald-400" />
              <span className="truncate">Đạt chuẩn an toàn (Dưới KPI)</span>
            </span>
            <span className="flex-shrink-0 text-[10px]">🟢</span>
          </div>
        )
      }
    }
  } else if (isNoData) {
    footerElement = (
      <div className="flex items-center justify-between text-[11px] font-mono pt-1.5 border-t border-border/30 text-muted-foreground/70">
        <span className="truncate">Chưa có dữ liệu KPI</span>
        <span className="text-[10px]">⚪</span>
      </div>
    )
  }

  const totalLap = lap2Val + lap3Val
  const lap2Pct = totalLap > 0 ? (lap2Val / totalLap) * 100 : 50
  const lap3Pct = totalLap > 0 ? (lap3Val / totalLap) * 100 : 50

  return (
    <div
      onClick={onClick}
      className={`bg-card/90 border border-border/80 rounded-2xl p-3 sm:p-3.5 flex flex-col justify-between shadow-md backdrop-blur-xl transition-all duration-200 hover:border-primary/40 ${onClick ? 'cursor-pointer hover:scale-[1.02] active:scale-[0.98]' : ''} ${className}`}
    >
      {/* HEADER: TITLE + ICON */}
      <div className="flex items-center justify-between gap-1">
        <span className="text-xs font-bold text-foreground truncate">{title}</span>
        {icon && (
          <div className={`p-1 rounded-lg ${iconBgColor} ${iconColor} border border-white/10 flex-shrink-0`}>
            {icon}
          </div>
        )}
      </div>

      {/* BODY: VALUE / STACKED BAR / DONUT INLINE */}
      {showStackedBar ? (
        <div className="space-y-1 my-1 w-full">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1">
              <span className="text-xl sm:text-2xl font-black text-cyan-400">
                {totalLap}
              </span>
              <span className="text-xs font-mono font-bold text-muted-foreground">lần</span>
            </div>
            <span className="text-[10px] font-mono font-bold text-muted-foreground">Cột chồng ngang</span>
          </div>

          {/* STACKED HORIZONTAL BAR */}
          <div className="w-full h-3 bg-muted/40 rounded-full flex overflow-hidden border border-white/10 p-0.5 gap-0.5 shadow-inner">
            <div 
              className="h-full bg-cyan-400 rounded-l-full transition-all duration-500" 
              style={{ width: `${Math.max(10, lap2Pct)}%` }} 
              title={`Lặp 2: ${lap2Val} lần`}
            />
            <div 
              className="h-full bg-indigo-500 rounded-r-full transition-all duration-500" 
              style={{ width: `${Math.max(10, lap3Pct)}%` }} 
              title={`Lặp 3: ${lap3Val} lần`}
            />
          </div>

          <div className="flex items-center justify-between text-[10px] font-mono font-bold pt-0.5">
            <span className="text-cyan-400">Lặp 2: {lap2Val} lần</span>
            <span className="text-indigo-400">Lặp 3: {lap3Val} lần</span>
          </div>
        </div>
      ) : (
        <div className="flex items-baseline justify-between my-0.5 pr-0.5">
          <div className="flex items-center gap-1.5 truncate">
            {isNoData ? (
              <span className="text-xs sm:text-sm font-bold font-sans text-muted-foreground/80 tracking-tight italic">
                Chưa có chỉ số
              </span>
            ) : (
              <>
                <span className="text-xl sm:text-2xl font-black text-foreground tracking-tight truncate">
                  {rawString}
                </span>

                {/* DYNAMIC SVG DONUT RING PLACED RIGHT NEXT TO THE VALUE */}
                {showDonut && isNumber && (
                  <div className="relative w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0 flex items-center justify-center -ml-0.5">
                    <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="4.5"
                        className="text-muted/30"
                      />
                      <circle
                        cx="18"
                        cy="18"
                        r="14"
                        fill="none"
                        stroke={donutStrokeColor}
                        strokeWidth="4.5"
                        pathLength="100"
                        strokeDasharray={`${Math.min(100, Math.max(0, numericVal))}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <span className={`absolute text-[9px] font-black ${donutTextColor}`}>%</span>
                  </div>
                )}

                {unit && !showDonut && (
                  <span className="text-[11px] font-mono font-bold text-muted-foreground">{unit}</span>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* FOOTER: KPI STATUS */}
      {footerElement}
    </div>
  )
}
