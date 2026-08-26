'use client'

import React from 'react'
import { Trophy } from 'lucide-react'
import { RankCardProps } from './Rank1_ThienDiaCard'

/**
 * 🌌 TOP 9: HÓA HƯ CẢNH RANK CARD (HÓA HƯ VÔ HÌNH)
 * Cảnh Giới Phàm Giai - Viền Sáng Tinh Vân Chàm Indigo Chạy Liên Tục 360°.
 */
export default function Rank9_HoaHuCard({
  rank = 9,
  className = ''
}: RankCardProps) {
  const displayRank = String(rank).toUpperCase().includes('TOP') ? String(rank) : `TOP ${rank}`

  return (
    <div className={`relative p-[3px] sm:p-[4px] rounded-2xl overflow-hidden group shadow-[0_0_25px_rgba(99,102,241,0.6)] ${className}`}>
      
      {/* CONTINUOUS TRAVELLING COSMIC INDIGO LIGHT BEAM */}
      <div className="absolute inset-[-150%] animate-[spin_5.5s_linear_infinite] bg-[conic-gradient(from_0deg,transparent_0_260deg,#3730a3_310deg,#818cf8_340deg,#ffffff_360deg)] pointer-events-none" />

      {/* INNER CARD CONTENT */}
      <div className="relative rounded-[12px] bg-gradient-to-br from-[#181a40] via-[#282c66] to-[#0f112e] p-4 flex flex-col justify-between backdrop-blur-xl overflow-hidden min-h-[160px] h-full">
        
        {/* TOP ROW */}
        <div className="flex items-center justify-between relative z-10 gap-2">
          <span className="bg-gradient-to-r from-indigo-400 via-indigo-500 to-indigo-600 text-indigo-950 font-xianxia font-extrabold tracking-wide shadow-[0_0_15px_rgba(99,102,241,0.8)] border border-indigo-200 text-xs sm:text-sm px-3 py-0.5 rounded-lg flex-shrink-0 whitespace-nowrap">
            🌌 Hóa Hư Vô Hình
          </span>
          <div className="p-1.5 rounded-xl bg-indigo-400/25 text-indigo-300 border border-indigo-400/50 shadow-xs flex-shrink-0">
            <Trophy className="w-4 h-4 text-indigo-300 fill-indigo-300" />
          </div>
        </div>

        {/* BODY */}
        <div className="my-1 relative z-10">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl sm:text-4xl font-black bg-gradient-to-r from-indigo-200 via-sky-300 to-indigo-400 bg-clip-text text-transparent tracking-tight drop-shadow-[0_2px_10px_rgba(99,102,241,0.8)] inline-block pr-1.5 pb-0.5">
              {displayRank}
            </span>
            <span className="text-xs font-mono font-bold text-indigo-300/90">Chi Nhánh</span>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="flex items-center justify-between text-xs font-mono pt-1 relative z-10 overflow-hidden">
          <span className="bg-gradient-to-r from-indigo-200 via-sky-300 to-indigo-400 bg-clip-text text-transparent font-black drop-shadow-[0_2px_8px_rgba(99,102,241,0.7)] font-bold flex items-center gap-1.5 truncate">
            <span>🌌</span>
            <span className="truncate">Hóa Hư Cảnh</span>
          </span>
        </div>
      </div>
    </div>
  )
}
