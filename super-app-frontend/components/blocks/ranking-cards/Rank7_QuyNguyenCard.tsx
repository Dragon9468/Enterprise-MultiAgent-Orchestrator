'use client'

import React from 'react'
import { Trophy } from 'lucide-react'
import { RankCardProps } from './Rank1_ThienDiaCard'

/**
 * ☯️ TOP 7: QUY NGUYÊN CẢNH RANK CARD (QUY NGUYÊN NHẤT THỂ)
 * Cảnh Giới Phàm Giai Đỉnh Phong - Viền Sáng Bạch Kim Hổ Phách Chạy Liên Tục 360°.
 */
export default function Rank7_QuyNguyenCard({
  rank = 7,
  className = ''
}: RankCardProps) {
  const displayRank = String(rank).toUpperCase().includes('TOP') ? String(rank) : `TOP ${rank}`

  return (
    <div className={`relative p-[3px] sm:p-[4px] rounded-2xl overflow-hidden group shadow-[0_0_25px_rgba(245,158,11,0.6)] ${className}`}>
      
      {/* CONTINUOUS TRAVELLING PLATINUM AMBER LIGHT BEAM */}
      <div className="absolute inset-[-150%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_260deg,#b45309_310deg,#fbbf24_340deg,#ffffff_360deg)] pointer-events-none" />

      {/* INNER CARD CONTENT */}
      <div className="relative rounded-[12px] bg-gradient-to-br from-[#331e08] via-[#543310] to-[#241505] p-4 flex flex-col justify-between backdrop-blur-xl overflow-hidden min-h-[160px] h-full">
        
        {/* TOP ROW */}
        <div className="flex items-center justify-between relative z-10 gap-2">
          <span className="bg-gradient-to-r from-amber-400 via-yellow-500 to-amber-600 text-amber-950 font-xianxia font-extrabold tracking-wide shadow-[0_0_15px_rgba(245,158,11,0.8)] border border-amber-200 text-xs sm:text-sm px-3 py-0.5 rounded-lg flex-shrink-0 whitespace-nowrap">
            ☯️ Quy Nguyên Nhất Thể
          </span>
          <div className="p-1.5 rounded-xl bg-amber-400/25 text-amber-300 border border-amber-400/50 shadow-xs flex-shrink-0">
            <Trophy className="w-4 h-4 text-amber-300 fill-amber-300" />
          </div>
        </div>

        {/* BODY */}
        <div className="my-1 relative z-10">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent tracking-tight drop-shadow-[0_2px_10px_rgba(245,158,11,0.8)] inline-block pr-1.5 pb-0.5">
              {displayRank}
            </span>
            <span className="text-xs font-mono font-bold text-amber-300/90">Chi Nhánh</span>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="flex items-center justify-between text-xs font-mono pt-1 relative z-10 overflow-hidden">
          <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent font-black drop-shadow-[0_2px_8px_rgba(245,158,11,0.7)] font-bold flex items-center gap-1.5 truncate">
            <span>☯️</span>
            <span className="truncate">Quy Nguyên Cảnh</span>
          </span>
        </div>
      </div>
    </div>
  )
}
