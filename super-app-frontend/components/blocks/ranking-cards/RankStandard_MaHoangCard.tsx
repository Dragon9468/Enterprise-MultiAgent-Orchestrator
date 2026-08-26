'use client'

import React from 'react'
import { Trophy } from 'lucide-react'
import { RankCardProps } from './Rank1_ThienDiaCard'

export function getMaHoangStandardMeta(rankNum: number) {
  if (rankNum <= 15) {
    return {
      realm: 'Thiên Huyền Cảnh',
      icon: '🌌',
      badge: `🌌 Top ${rankNum} Thiên Huyền`,
      textGradient: 'text-indigo-300 font-bold',
      cardStyle: 'bg-gradient-to-br from-[#121433] via-[#1e2354] to-[#0c0d24] border border-indigo-500/40 shadow-lg',
      topBadgeBg: 'bg-indigo-500/20 text-indigo-300 border border-indigo-400/40 text-xs px-2.5 py-0.5 rounded-lg font-xianxia font-bold'
    }
  }
  if (rankNum <= 25) {
    return {
      realm: 'Đoán Cốt Cảnh',
      icon: '🦴',
      badge: `🦴 Top ${rankNum} Đoán Cốt`,
      textGradient: 'text-slate-200 font-bold',
      cardStyle: 'bg-gradient-to-br from-[#262626] via-[#404040] to-[#171717] border border-slate-400/40 shadow-lg',
      topBadgeBg: 'bg-slate-500/20 text-slate-200 border border-slate-400/40 text-xs px-2.5 py-0.5 rounded-lg font-xianxia font-bold'
    }
  }
  if (rankNum <= 45) {
    return {
      realm: 'Tụ Khí Cảnh',
      icon: '🌀',
      badge: `🌀 Top ${rankNum} Tụ Khí`,
      textGradient: 'text-sky-300 font-bold',
      cardStyle: 'bg-gradient-to-br from-[#0f2a3a] via-[#1a455c] to-[#0a1f2c] border border-sky-500/40 shadow-lg',
      topBadgeBg: 'bg-sky-500/20 text-sky-300 border border-sky-400/40 text-xs px-2.5 py-0.5 rounded-lg font-xianxia font-bold'
    }
  }
  return {
    realm: 'Trúc Cơ Cảnh',
    icon: '🏛️',
    badge: `🏛️ Top ${rankNum} Trúc Cơ`,
    textGradient: 'text-amber-300 font-bold',
    cardStyle: 'bg-gradient-to-br from-[#2a1f17] via-[#453326] to-[#1d1510] border border-amber-500/40 shadow-lg',
    topBadgeBg: 'bg-amber-500/20 text-amber-300 border border-amber-400/40 text-xs px-2.5 py-0.5 rounded-lg font-xianxia font-bold'
  }
}

/**
 * 🛡️ STANDARD MA HOÀNG RANK CARD (TOP 11 - TOP 100)
 * Khung Xếp Hạng Tiêu Chuẩn Phàm Giai (Thiên Huyền, Đoán Cốt, Tụ Khí, Trúc Cơ Cảnh).
 */
export default function RankStandard_MaHoangCard({
  rank = 11,
  employeeId = '',
  employeeName = '',
  auValue = '',
  className = ''
}: RankCardProps) {
  const num = typeof rank === 'number' ? rank : parseInt(String(rank).replace(/[^0-9]/g, ''), 10) || 11
  const meta = getMaHoangStandardMeta(num)
  const displayRank = String(rank).toUpperCase().includes('TOP') ? String(rank) : `TOP ${num}`
  const displayName = employeeName || employeeId

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
        <div className="flex items-baseline justify-between gap-1.5">
          <div className="flex items-baseline gap-1.5">
            <span className="text-3xl font-black bg-gradient-to-r from-amber-200 via-amber-400 to-amber-500 bg-clip-text text-transparent tracking-tight drop-shadow-md inline-block pr-1.5 pb-0.5">
              {displayRank}
            </span>
            <span className="text-xs font-mono font-bold text-amber-300/80">Chi Nhánh</span>
          </div>
          {displayName && (
            <span className="text-xs font-mono font-bold text-slate-200 truncate max-w-[140px]">
              {displayName}
            </span>
          )}
        </div>
      </div>

      {/* BOTTOM ROW */}
      <div className="flex items-center justify-between text-xs font-mono pt-1 relative z-10 overflow-hidden">
        <span className={`font-bold flex items-center gap-1.5 truncate ${meta.textGradient}`}>
          <span>{meta.icon}</span>
          <span className="truncate">{meta.realm}</span>
        </span>
        {auValue && (
          <span className="text-[11px] font-mono font-black text-amber-950 bg-amber-300 px-2 py-0.5 rounded shadow-sm border border-amber-200 flex-shrink-0">
            AU: {auValue}
          </span>
        )}
      </div>
    </div>
  )
}
