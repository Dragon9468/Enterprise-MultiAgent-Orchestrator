'use client'

import React from 'react'
import { Trophy } from 'lucide-react'
import { RankCardProps } from './Rank1_ChanTienCard'

export function getTuTienStandardMeta(rankNum: number) {
  if (rankNum <= 10) {
    return {
      realm: 'Hóa Thần Kỳ',
      icon: '🔥',
      element: 'fire',
      badge: `🔥 Top ${rankNum} Hóa Thần`,
      textGradient: 'text-amber-300 font-bold',
      cardStyle: 'bg-gradient-to-br from-[#3b1a0a] via-[#5c2a10] to-[#250f05] border border-amber-500/40 shadow-lg',
      topBadgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs px-2.5 py-0.5 rounded-lg font-xianxia font-bold'
    }
  }
  if (rankNum <= 20) {
    return {
      realm: 'Nguyên Anh Kỳ',
      icon: '🌀',
      element: 'clouds',
      badge: `🌀 Top ${rankNum} Nguyên Anh`,
      textGradient: 'text-sky-300 font-bold',
      cardStyle: 'bg-gradient-to-br from-[#0f2a3a] via-[#1a455c] to-[#0a1f2c] border border-sky-500/40 shadow-lg',
      topBadgeBg: 'bg-sky-500/20 text-sky-300 border border-sky-400/40 text-xs px-2.5 py-0.5 rounded-lg font-xianxia font-bold'
    }
  }
  if (rankNum <= 35) {
    return {
      realm: 'Kết Đan Kỳ',
      icon: '🟡',
      element: 'sun',
      badge: `🟡 Top ${rankNum} Kết Đan`,
      textGradient: 'text-yellow-300 font-bold',
      cardStyle: 'bg-gradient-to-br from-[#2c2a0f] via-[#4a451a] to-[#1e1d0a] border border-yellow-500/40 shadow-lg',
      topBadgeBg: 'bg-yellow-500/20 text-yellow-300 border border-yellow-400/40 text-xs px-2.5 py-0.5 rounded-lg font-xianxia font-bold'
    }
  }
  if (rankNum <= 50) {
    return {
      realm: 'Trúc Cơ Kỳ',
      icon: '🏛️',
      element: 'earth',
      badge: `🏛️ Top ${rankNum} Trúc Cơ`,
      textGradient: 'text-orange-300 font-bold',
      cardStyle: 'bg-gradient-to-br from-[#2a1f17] via-[#453326] to-[#1d1510] border border-orange-500/40 shadow-lg',
      topBadgeBg: 'bg-orange-500/20 text-orange-300 border border-orange-400/40 text-xs px-2.5 py-0.5 rounded-lg font-xianxia font-bold'
    }
  }
  return {
    realm: 'Luyện Khí Kỳ',
    icon: '🍃',
    element: 'wind',
    badge: `🍃 Top ${rankNum} Luyện Khí`,
    textGradient: 'text-emerald-300 font-bold',
    cardStyle: 'bg-gradient-to-br from-[#17261c] via-[#263e2e] to-[#0f1a13] border border-emerald-500/40 shadow-lg',
    topBadgeBg: 'bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-xs px-2.5 py-0.5 rounded-lg font-xianxia font-bold'
  }
}

/**
 * 🛡️ STANDARD XIANXIA RANK CARD (TOP 6 - TOP 100)
 * Khung Xếp Hạng Tiêu Chuẩn (Hóa Thần, Nguyên Anh, Kết Đan, Trúc Cơ, Luyện Khí).
 */
export default function RankStandard_TuTienCard({
  rank = 6,
  className = ''
}: RankCardProps) {
  const num = typeof rank === 'number' ? rank : parseInt(String(rank).replace(/[^0-9]/g, ''), 10) || 6
  const meta = getTuTienStandardMeta(num)
  const displayRank = String(rank).toUpperCase().includes('TOP') ? String(rank) : `TOP ${num}`

  return (
    <div className={`bg-gradient-to-br ${meta.cardStyle} rounded-2xl p-4 flex flex-col justify-between backdrop-blur-xl relative overflow-hidden group transition-all duration-300 shadow-xl border border-white/10 min-h-[160px] ${className}`}>
      
      {/* TOP ROW */}
      <div className="flex items-center justify-between relative z-10 gap-2">
        <span className={`flex-shrink-0 whitespace-nowrap ${meta.topBadgeBg}`}>
          {meta.badge}
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
        <span className={`font-bold flex items-center gap-1.5 truncate ${meta.textGradient}`}>
          <span>{meta.icon}</span>
          <span className="truncate">{meta.realm}</span>
        </span>
      </div>
    </div>
  )
}
