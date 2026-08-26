'use client'

import React from 'react'
import { Trophy } from 'lucide-react'
import { RankCardProps } from './Rank1_ThienDiaCard'

/**
 * ⚡ TOP 2: VÔ THƯỢNG CẢNH RANK CARD (VÔ THƯỢNG MA VỰC)
 * Cảnh Giới Thánh Vực - Viền Sáng Tím Lôi Điện Chạy Liên Tục 360°.
 */
export default function Rank2_VoThuongCard({
  rank = 2,
  className = ''
}: RankCardProps) {
  const displayRank = String(rank).toUpperCase().includes('TOP') ? String(rank) : `TOP ${rank}`

  return (
    <div className={`relative p-[3px] sm:p-[4px] rounded-2xl overflow-hidden group shadow-[0_0_30px_rgba(168,85,247,0.6)] ${className}`}>
      
      {/* CONTINUOUS TRAVELLING VIOLET THUNDER LIGHT BEAM */}
      <div className="absolute inset-[-150%] animate-[spin_3.8s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_260deg,#7e22ce_310deg,#c084fc_340deg,#ffffff_360deg)] pointer-events-none" />

      {/* INNER CARD CONTENT */}
      <div className="relative rounded-[12px] bg-gradient-to-br from-[#270940] via-[#481045] to-[#1d0033] p-4 flex flex-col justify-between backdrop-blur-xl overflow-hidden min-h-[160px] h-full">
        
        {/* TOP ROW */}
        <div className="flex items-center justify-between relative z-10 gap-2">
          <span className="bg-gradient-to-r from-purple-300 via-purple-400 to-indigo-500 text-purple-950 font-xianxia font-extrabold tracking-wide shadow-[0_0_15px_rgba(168,85,247,0.8)] border border-purple-200 text-xs sm:text-sm px-3 py-0.5 rounded-lg flex-shrink-0 whitespace-nowrap">
            ⚡ Vô Thượng Ma Vực
          </span>
          <div className="p-1.5 rounded-xl bg-purple-400/25 text-purple-300 border border-purple-400/50 shadow-xs flex-shrink-0">
            <Trophy className="w-4 h-4 text-purple-300 fill-purple-300" />
          </div>
        </div>

        {/* BODY */}
        <div className="my-1 relative z-10">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-purple-200 via-purple-300 to-indigo-400 bg-clip-text text-transparent tracking-tight drop-shadow-[0_2px_10px_rgba(168,85,247,0.8)] inline-block pr-1.5 pb-0.5">
              {displayRank}
            </span>
            <span className="text-xs font-mono font-bold text-purple-300/90">Chi Nhánh</span>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="flex items-center justify-between text-xs font-mono pt-1 relative z-10 overflow-hidden">
          <span className="bg-gradient-to-r from-purple-200 via-indigo-300 to-purple-400 bg-clip-text text-transparent font-black drop-shadow-[0_2px_8px_rgba(168,85,247,0.7)] font-bold flex items-center gap-1.5 truncate">
            <span>⚡</span>
            <span className="truncate">Vô Thượng Cảnh</span>
          </span>
        </div>
      </div>
    </div>
  )
}
