'use client'

import React from 'react'
import { Trophy } from 'lucide-react'
import { RankCardProps } from './Rank1_ChanTienCard'

/**
 * ⚡ TOP 2: ĐỘ KIẾP KỲ RANK CARD (ĐỈNH PHONG THIÊN HẠ)
 * Cảnh Giới Cấp Cao: Viền sáng Lôi Điện Tím xoay chạy liên tục.
 */
export default function Rank2_DoKiepCard({
  rank = 2,
  className = ''
}: RankCardProps) {
  const displayRank = String(rank).toUpperCase().includes('TOP') ? String(rank) : `TOP ${rank}`

  return (
    <div className={`relative p-[2px] rounded-2xl overflow-hidden group shadow-[0_0_25px_rgba(168,85,247,0.6)] ${className}`}>
      
      {/* CONTINUOUS ROTATING PURPLE THUNDER BORDER GLOW */}
      <div className="absolute inset-[-200%] animate-[spin_5s_linear_infinite] bg-[conic-gradient(from_0deg,#c084fc,#9333ea,#e879f9,#3b82f6,#c084fc)] opacity-95" />

      {/* INNER CARD CONTENT */}
      <div className="relative rounded-[14px] bg-gradient-to-br from-[#2a0845] via-[#4b1248] to-[#1e0034] p-4 flex flex-col justify-between backdrop-blur-xl overflow-hidden min-h-[160px] h-full">
        
        {/* TOP ROW */}
        <div className="flex items-center justify-between relative z-10 gap-2">
          <span className="bg-purple-400 text-purple-950 font-xianxia font-extrabold tracking-wide shadow-[0_0_12px_rgba(168,85,247,0.7)] border border-purple-200 text-xs sm:text-sm px-3 py-0.5 rounded-lg flex-shrink-0 whitespace-nowrap">
            ⚡ Đỉnh Phong Thiên Hạ
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
          <span className="bg-gradient-to-r from-purple-200 via-indigo-300 to-purple-500 bg-clip-text text-transparent font-black drop-shadow-[0_2px_8px_rgba(168,85,247,0.6)] font-bold flex items-center gap-1.5 truncate">
            <span>⚡</span>
            <span className="truncate">Độ Kiếp Kỳ</span>
          </span>
        </div>
      </div>
    </div>
  )
}
