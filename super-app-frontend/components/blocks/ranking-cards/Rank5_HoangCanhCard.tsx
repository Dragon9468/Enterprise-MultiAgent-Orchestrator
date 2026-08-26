'use client'

import React from 'react'
import { Trophy } from 'lucide-react'
import { RankCardProps } from './Rank1_ThienDiaCard'

/**
 * 🌟 TOP 5: HOÀNG CẢNH RANK CARD (HOÀNG GIA TÔN GIẢ)
 * Cảnh Giới Thánh Vực - Viền Sáng Emerald Lục Bảo Chạy Liên Tục 360°.
 */
export default function Rank5_HoangCanhCard({
  rank = 5,
  className = ''
}: RankCardProps) {
  const displayRank = String(rank).toUpperCase().includes('TOP') ? String(rank) : `TOP ${rank}`

  return (
    <div className={`relative p-[3px] sm:p-[4px] rounded-2xl overflow-hidden group shadow-[0_0_30px_rgba(74,222,128,0.6)] ${className}`}>
      
      {/* CONTINUOUS TRAVELLING EMERALD LIGHT BEAM */}
      <div className="absolute inset-[-150%] animate-[spin_4.5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_260deg,#15803d_310deg,#4ade80_340deg,#ffffff_360deg)] pointer-events-none" />

      {/* INNER CARD CONTENT */}
      <div className="relative rounded-[12px] bg-gradient-to-br from-[#122b12] via-[#204520] to-[#0b1f0b] p-4 flex flex-col justify-between backdrop-blur-xl overflow-hidden min-h-[160px] h-full">
        
        {/* TOP ROW */}
        <div className="flex items-center justify-between relative z-10 gap-2">
          <span className="bg-gradient-to-r from-emerald-400 via-green-500 to-emerald-600 text-green-950 font-xianxia font-extrabold tracking-wide shadow-[0_0_15px_rgba(74,222,128,0.8)] border border-green-200 text-xs sm:text-sm px-3 py-0.5 rounded-lg flex-shrink-0 whitespace-nowrap">
            🌟 Hoàng Gia Tôn Giả
          </span>
          <div className="p-1.5 rounded-xl bg-emerald-400/25 text-emerald-300 border border-emerald-400/50 shadow-xs flex-shrink-0">
            <Trophy className="w-4 h-4 text-emerald-300 fill-emerald-300" />
          </div>
        </div>

        {/* BODY */}
        <div className="my-1 relative z-10">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-green-200 via-emerald-300 to-green-400 bg-clip-text text-transparent tracking-tight drop-shadow-[0_2px_10px_rgba(74,222,128,0.8)] inline-block pr-1.5 pb-0.5">
              {displayRank}
            </span>
            <span className="text-xs font-mono font-bold text-emerald-300/90">Chi Nhánh</span>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="flex items-center justify-between text-xs font-mono pt-1 relative z-10 overflow-hidden">
          <span className="bg-gradient-to-r from-green-200 via-[#00ff00] to-green-400 bg-clip-text text-transparent font-black drop-shadow-[0_2px_8px_rgba(74,222,128,0.7)] font-bold flex items-center gap-1.5 truncate">
            <span>🌟</span>
            <span className="truncate">Hoàng Cảnh</span>
          </span>
        </div>
      </div>
    </div>
  )
}
