'use client'

import { useState, useEffect } from 'react'
import { FlaskConical, Trophy, Sparkles, Shield, Flame, Check, RefreshCw } from 'lucide-react'
import { RankingCard, getMaHoangStandardMeta } from '@/components/blocks/ranking-cards'
import { pb } from '@/lib/pocketbase'
import { motion } from 'framer-motion'

export default function SandboxPage() {
  const [user, setUser] = useState<any>(null)
  const [selectedRank, setSelectedRank] = useState<number>(1)
  const [customRankInput, setCustomRankInput] = useState<string>('1')

  useEffect(() => {
    setUser(pb.authStore.model)
  }, [])

  const sampleRanks = [
    { rank: 1, label: 'Top 1 (Thiên Địa Cảnh)' },
    { rank: 2, label: 'Top 2 (Vô Thượng Cảnh)' },
    { rank: 3, label: 'Top 3 (Đế Cảnh)' },
    { rank: 4, label: 'Top 4 (Thánh Cảnh)' },
    { rank: 5, label: 'Top 5 (Hoàng Cảnh)' },
    { rank: 6, label: 'Top 6 (Linh Vương Cảnh)' },
    { rank: 7, label: 'Top 7 (Quy Nguyên Cảnh)' },
    { rank: 8, label: 'Top 8 (Dung Hồn Cảnh)' },
    { rank: 9, label: 'Top 9 (Hóa Hư Cảnh)' },
    { rank: 10, label: 'Top 10 (Thần Chiếu Cảnh)' },
    { rank: 15, label: 'Top 15 (Thiên Huyền Cảnh)' },
    { rank: 22, label: 'Top 22 (Đoán Cốt Cảnh)' },
    { rank: 35, label: 'Top 35 (Tụ Khí Cảnh)' },
    { rank: 60, label: 'Top 60 (Trúc Cơ Cảnh)' },
  ]

  const activeRealm = getMaHoangStandardMeta(selectedRank)

  // Render 1 Sample Trophy Card Frame based on rank number
  const renderTrophyCard = (rankNum: number) => {
    return (
      <RankingCard
        key={rankNum}
        rank={rankNum}
        employeeName="Nhân Viên Sandbox"
        employeeId="NV_TEST"
        score={99.2}
      />
    )
  }

  if (user && (user.role_level || 1) < 6) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 text-center space-y-4">
        <Shield className="w-16 h-16 text-destructive animate-bounce" />
        <h2 className="text-xl font-bold text-foreground">Truy Cập Bị Từ Chối</h2>
        <p className="text-xs text-muted-foreground max-w-sm">
          Ứng dụng Sandbox chỉ dành riêng cho tài khoản Quản trị viên (Level 6 & 7).
        </p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col w-full h-full p-4 sm:p-6 overflow-y-auto space-y-6 max-w-6xl mx-auto select-none">
      
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border/80 pb-4 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary border border-primary/40 flex items-center justify-center shadow-md">
            <FlaskConical className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-foreground tracking-tight">Sandbox Preview</h1>
              <span className="px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-mono font-bold border border-primary/30">
                Level 5 Only
              </span>
            </div>
            <p className="text-xs text-muted-foreground">Khu vực thử nghiệm các mẫu khung xếp hạng Cảnh Giới Tu Tiên</p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-card/80 p-1.5 rounded-xl border border-border">
          <input
            type="number"
            min="1"
            max="100"
            value={customRankInput}
            onChange={(e) => {
              setCustomRankInput(e.target.value)
              const val = parseInt(e.target.value, 10)
              if (!isNaN(val) && val > 0) setSelectedRank(val)
            }}
            placeholder="Nhập Hạng..."
            className="w-24 px-2.5 py-1 bg-background border border-primary/30 rounded-lg text-xs font-mono font-bold text-foreground outline-none focus:ring-1 focus:ring-primary"
          />
          <button
            type="button"
            onClick={() => {
              const val = parseInt(customRankInput, 10)
              if (!isNaN(val) && val > 0) setSelectedRank(val)
            }}
            className="px-3 py-1 bg-primary text-primary-foreground rounded-lg text-xs font-bold shadow-xs active:scale-95 transition-all"
          >
            Xem Khung
          </button>
        </div>
      </div>

      {/* QUICK SELECT RANK CHIPS */}
      <div className="space-y-2">
        <h3 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">Chọn nhanh Hạng mẫu:</h3>
        <div className="flex flex-wrap gap-2">
          {sampleRanks.map((item) => (
            <button
              key={item.rank}
              onClick={() => {
                setSelectedRank(item.rank)
                setCustomRankInput(String(item.rank))
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-xs cursor-pointer ${
                selectedRank === item.rank
                  ? 'bg-primary text-primary-foreground border-primary scale-105 shadow-md'
                  : 'bg-card text-foreground border-border hover:bg-muted'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* FEATURED LARGE DISPLAY FRAME */}
      <div className="space-y-2">
        <h3 className="text-xs font-mono font-bold text-primary uppercase tracking-wider flex items-center gap-1.5">
          <Sparkles className="w-4 h-4" /> Preview Khung Hạng Hiện Tại: TOP {selectedRank} ({activeRealm.realm})
        </h3>

        <div className="max-w-md">
          {renderTrophyCard(selectedRank)}
        </div>
      </div>

      {/* ALL 10 REALMS PREVIEW GRID */}
      <div className="space-y-3 pt-4 border-t border-border/60">
        <h3 className="text-xs font-mono font-bold text-muted-foreground uppercase tracking-wider">
          Bộ Mẫu 10 Cảnh Giới Tu Tiên (Top 1 - Top 100):
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {sampleRanks.map((item) => renderTrophyCard(item.rank))}
        </div>
      </div>

    </div>
  )
}
