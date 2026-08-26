'use client'

import React from 'react'
import { Trophy } from 'lucide-react'

export interface RankCardProps {
  rank?: number | string
  employeeId?: string
  employeeName?: string
  auValue?: string | number
  score?: number | string
  className?: string
}

/**
 * 👑 TOP 1: THIÊN ĐỊA CẢNH RANK CARD (THIÊN ĐỊA CHÍ TÔN - MA HOÀNG)
 * Cảnh Giới Tối Cao Thánh Vực - Viền Sáng Vàng Hoàng Gia Chạy Liên Tục 360°.
 */
export default function Rank1_ThienDiaCard({
  rank = 1,
  employeeId = '',
  employeeName = '',
  auValue = '',
  className = ''
}: RankCardProps) {
  const displayRank = String(rank).toUpperCase().includes('TOP') ? String(rank) : `TOP ${rank}`
  const displayName = employeeName || employeeId

  return (
    <div className={`relative p-[3px] sm:p-[4px] rounded-2xl overflow-hidden group shadow-[0_0_30px_rgba(255,204,0,0.6)] ${className}`}>
      
      {/* CONTINUOUS TRAVELLING SOLAR GOLD LIGHT BEAM */}
      <div className="absolute inset-[-150%] animate-[spin_3.5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_260deg,#ff8c00_310deg,#ffcc00_340deg,#ffffff_360deg)] pointer-events-none" />

      {/* INNER CARD CONTENT */}
      <div className="relative rounded-[12px] bg-gradient-to-br from-[#3d1e03] via-[#7a3b00] to-[#aa5200] p-4 flex flex-col justify-between backdrop-blur-xl overflow-hidden min-h-[160px] h-full">
        
        {/* TOP ROW */}
        <div className="flex items-center justify-between relative z-10 gap-2">
          <span className="bg-gradient-to-r from-amber-300 via-amber-400 to-yellow-500 text-amber-950 font-xianxia font-extrabold tracking-wide shadow-[0_0_15px_rgba(255,204,0,0.8)] border border-amber-200 text-xs sm:text-sm px-3 py-0.5 rounded-lg flex-shrink-0 whitespace-nowrap">
            👑 Thiên Địa Chí Tôn
          </span>
          <div className="p-1.5 rounded-xl bg-amber-400/25 text-amber-300 border border-amber-400/50 shadow-xs flex-shrink-0">
            <Trophy className="w-4 h-4 text-amber-300 fill-amber-300" />
          </div>
        </div>

        {/* BODY */}
        <div className="my-1 relative z-10">
          <div className="flex items-baseline justify-between gap-1.5">
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent tracking-tight drop-shadow-[0_2px_10px_rgba(255,204,0,0.8)] inline-block pr-1.5 pb-0.5">
                {displayRank}
              </span>
              <span className="text-xs font-mono font-bold text-amber-300/90">Chi Nhánh</span>
            </div>
            {displayName && (
              <span className="text-xs font-mono font-bold text-amber-200 truncate max-w-[140px]">
                {displayName}
              </span>
            )}
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="flex items-center justify-between text-xs font-mono pt-1 relative z-10 overflow-hidden">
          <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-500 bg-clip-text text-transparent font-black drop-shadow-[0_2px_8px_rgba(255,204,0,0.7)] font-bold flex items-center gap-1.5 truncate">
            <span>👑</span>
            <span className="truncate">Thiên Địa Cảnh</span>
          </span>
          {auValue && (
            <span className="text-[11px] font-mono font-black text-amber-950 bg-amber-300 px-2 py-0.5 rounded shadow-sm border border-amber-200 flex-shrink-0">
              AU: {auValue}
            </span>
          )}
        </div>
      </div>
    </div>
  )
}
