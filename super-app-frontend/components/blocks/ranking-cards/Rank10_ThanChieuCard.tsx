'use client'

import React from 'react'
import { Trophy } from 'lucide-react'
import { RankCardProps } from './Rank1_ThienDiaCard'

/**
 * 👁️ TOP 10: THẦN CHIẾU CẢNH RANK CARD (THẦN CHIẾU PHÀM NHÂN)
 * Cảnh Giới Phàm Giai - Viền Sáng Đồng Kim Amber Chạy Liên Tục 360°.
 */
export default function Rank10_ThanChieuCard({
  rank = 10,
  className = ''
}: RankCardProps) {
  const displayRank = String(rank).toUpperCase().includes('TOP') ? String(rank) : `TOP ${rank}`

  return (
    <div className={`relative p-[3px] sm:p-[4px] rounded-2xl overflow-hidden group shadow-[0_0_25px_rgba(217,119,6,0.6)] ${className}`}>
      
      {/* CONTINUOUS TRAVELLING GOLDEN BRONZE LIGHT BEAM */}
      <div className="absolute inset-[-150%] animate-[spin_5.8s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_260deg,#92400e_310deg,#d97706_340deg,#ffffff_360deg)] pointer-events-none" />

      {/* INNER CARD CONTENT */}
      <div className="relative rounded-[12px] bg-gradient-to-br from-[#301c07] via-[#4f2e0c] to-[#211304] p-4 flex flex-col justify-between backdrop-blur-xl overflow-hidden min-h-[160px] h-full">
        
        {/* TOP ROW */}
        <div className="flex items-center justify-between relative z-10 gap-2">
          <span className="bg-gradient-to-r from-amber-500 via-yellow-600 to-amber-700 text-amber-950 font-xianxia font-extrabold tracking-wide shadow-[0_0_15px_rgba(217,119,6,0.8)] border border-amber-300 text-xs sm:text-sm px-3 py-0.5 rounded-lg flex-shrink-0 whitespace-nowrap">
            👁️ Thần Chiếu Phàm Nhân
          </span>
          <div className="p-1.5 rounded-xl bg-amber-500/25 text-amber-300 border border-amber-500/50 shadow-xs flex-shrink-0">
            <Trophy className="w-4 h-4 text-amber-300 fill-amber-300" />
          </div>
        </div>

        {/* BODY */}
        <div className="my-1 relative z-10">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent tracking-tight drop-shadow-[0_2px_10px_rgba(217,119,6,0.8)] inline-block pr-1.5 pb-0.5">
              {displayRank}
            </span>
            <span className="text-xs font-mono font-bold text-amber-300/90">Chi Nhánh</span>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="flex items-center justify-between text-xs font-mono pt-1 relative z-10 overflow-hidden">
          <span className="bg-gradient-to-r from-amber-200 via-yellow-300 to-amber-400 bg-clip-text text-transparent font-black drop-shadow-[0_2px_8px_rgba(217,119,6,0.7)] font-bold flex items-center gap-1.5 truncate">
            <span>👁️</span>
            <span className="truncate">Thần Chiếu Cảnh</span>
          </span>
        </div>
      </div>
    </div>
  )
}
