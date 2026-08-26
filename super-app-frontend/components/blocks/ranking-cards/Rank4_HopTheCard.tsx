'use client'

import React from 'react'
import { Trophy } from 'lucide-react'
import { RankCardProps } from './Rank1_ChanTienCard'

/**
 * ✨ TOP 4: HỢP THỂ KỲ RANK CARD (LINH THỂ QUY NHẤT)
 * Cảnh Giới Cấp Cao: Viền sáng Băng Tuyết Cyan xoay chạy liên tục.
 */
export default function Rank4_HopTheCard({
  rank = 4,
  className = ''
}: RankCardProps) {
  const displayRank = String(rank).toUpperCase().includes('TOP') ? String(rank) : `TOP ${rank}`

  return (
    <div className={`relative p-[2px] rounded-2xl overflow-hidden group shadow-[0_0_25px_rgba(34,211,238,0.6)] ${className}`}>
      
      {/* CONTINUOUS ROTATING CYAN ICE BORDER GLOW */}
      <div className="absolute inset-[-200%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_0deg,#22d3ee,#0284c7,#67e8f9,#0f766e,#22d3ee)] opacity-95" />

      {/* INNER CARD CONTENT */}
      <div className="relative rounded-[14px] bg-gradient-to-br from-[#0a2a3b] via-[#10405c] to-[#051a25] p-4 flex flex-col justify-between backdrop-blur-xl overflow-hidden min-h-[160px] h-full">
        
        {/* TOP ROW */}
        <div className="flex items-center justify-between relative z-10 gap-2">
          <span className="bg-[#00ffff] text-teal-950 font-xianxia font-extrabold tracking-wide shadow-[0_0_12px_rgba(0,255,255,0.7)] border border-cyan-200 text-xs sm:text-sm px-3 py-0.5 rounded-lg flex-shrink-0 whitespace-nowrap">
            ✨ Linh Thể Quy Nhất
          </span>
          <div className="p-1.5 rounded-xl bg-amber-400/20 text-amber-300 border border-amber-400/40 shadow-xs flex-shrink-0">
            <Trophy className="w-4 h-4 text-amber-300 fill-amber-300" />
          </div>
        </div>

        {/* BODY */}
        <div className="my-1 relative z-10">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent tracking-tight drop-shadow-md inline-block pr-1.5 pb-0.5">
              {displayRank}
            </span>
            <span className="text-xs font-mono font-bold text-amber-300/80">Chi Nhánh</span>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="flex items-center justify-between text-xs font-mono pt-1 relative z-10 overflow-hidden">
          <span className="bg-gradient-to-r from-cyan-100 via-[#00ffff] to-cyan-400 bg-clip-text text-transparent font-black drop-shadow-[0_2px_8px_rgba(0,255,255,0.6)] font-bold flex items-center gap-1.5 truncate">
            <span>✨</span>
            <span className="truncate">Hợp Thể Kỳ</span>
          </span>
        </div>
      </div>
    </div>
  )
}
