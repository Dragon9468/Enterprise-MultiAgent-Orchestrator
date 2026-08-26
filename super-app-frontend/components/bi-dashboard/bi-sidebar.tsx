'use client'

import React, { useState } from 'react'
import { 
  LayoutDashboard, Wrench, Radio, Star, Server, Activity, 
  ChevronLeft, ChevronRight, Menu, X, Layers, BarChart3, Filter, FileSpreadsheet,
  ListOrdered, Target, Repeat, RotateCcw, ShieldCheck, Award, UserX, Zap,
  Coins, Clock, Timer, UserMinus, Gauge, Gift, Package, Shuffle
} from 'lucide-react'

export interface ReportPageItem {
  id: string
  name: string
  icon: React.ComponentType<{ className?: string }>
}

export const BI_REPORT_PAGES: ReportPageItem[] = [
  { id: 'chi-tiet', name: 'chi tiết', icon: ListOrdered },
  { id: 'kpi', name: 'KPI', icon: Target },
  { id: 'lap-2', name: 'Lặp 2', icon: Repeat },
  { id: 'lap-3', name: 'Lặp 3', icon: RotateCcw },
  { id: 'suy-hao', name: 'suy hao', icon: Radio },
  { id: 'tong-hop', name: 'Tổng Hợp', icon: LayoutDashboard },
  { id: 'csat-lan-2', name: 'Csat Lần 2', icon: Star },
  { id: 'nkn', name: 'NKN', icon: ShieldCheck },
  { id: 'xep-loai', name: 'Xếp Loại', icon: Award },
  { id: 'yeu-cau-huy', name: 'yêu cầu hủy', icon: UserX },
  { id: 'chu-dong', name: 'chủ động', icon: Zap },
  { id: 'luong-tam-tinh', name: 'Lương Tạm Tính', icon: Coins },
  { id: 'tien-do', name: 'Tiến độ', icon: Clock },
  { id: 'time-tk-bt', name: 'Time TK-BT', icon: Timer },
  { id: 'roi-mang', name: 'Rời Mạng', icon: UserMinus },
  { id: 'respontime', name: 'Respontime', icon: Gauge },
  { id: 'hoa-hong', name: 'Hoa Hồng', icon: Gift },
  { id: 'ton-kho', name: 'Tồn Kho', icon: Package },
  { id: 'cheo', name: 'Chéo', icon: Shuffle }
]

interface BiSidebarProps {
  activePageId: string
  onSelectPage: (id: string) => void
  isCollapsed: boolean
  onToggleCollapse: () => void
}

export default function BiSidebar({
  activePageId,
  onSelectPage,
  isCollapsed,
  onToggleCollapse
}: BiSidebarProps) {
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false)

  return (
    <>
      {/* 📱 MOBILE TOP SUB-NAV TOGGLE (COLLAPSIBLE ON MOBILE) */}
      <div className="md:hidden flex items-center justify-between px-3 py-2 bg-card/90 backdrop-blur-md border-b border-border/80 text-foreground z-10 w-full flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-lg bg-primary/10 text-primary">
            <BarChart3 className="w-4 h-4" />
          </div>
          <div className="flex flex-col">
            <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground">Power BI Dashboard</span>
            <span className="text-xs font-bold text-foreground truncate">
              {BI_REPORT_PAGES.find(p => p.id === activePageId)?.name || 'Tổng Hợp'}
            </span>
          </div>
        </div>

        <button
          onClick={() => setMobileDrawerOpen(!mobileDrawerOpen)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-foreground text-xs font-medium border border-border/60 transition-colors cursor-pointer"
        >
          {mobileDrawerOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          <span>Tất cả trang ({BI_REPORT_PAGES.length})</span>
        </button>
      </div>

      {/* 📱 MOBILE HORIZONTAL SLIDEBAR (VUỐT / LƯỚT CHỌN TRANG NHANH) */}
      <div className="md:hidden flex items-center gap-1.5 px-2.5 py-1.5 bg-card/60 backdrop-blur-md border-b border-border/70 overflow-x-auto no-scrollbar scroll-smooth snap-x z-10 w-full flex-shrink-0">
        {BI_REPORT_PAGES.map((page) => {
          const isActive = activePageId === page.id
          const IconComp = page.icon
          return (
            <button
              key={page.id}
              onClick={(e) => {
                e.preventDefault()
                onSelectPage(page.id)
              }}
              className={`flex-shrink-0 snap-start flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                isActive
                  ? 'bg-primary text-primary-foreground shadow-xs font-bold scale-[1.02]'
                  : 'bg-muted/70 text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <IconComp className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">{page.name}</span>
            </button>
          )
        })}
      </div>

      {/* 📱 MOBILE DROPDOWN OVERLAY MENU */}
      {mobileDrawerOpen && (
        <div className="md:hidden fixed top-24 left-0 right-0 bg-card/95 backdrop-blur-2xl border-b border-border p-3 z-30 space-y-1.5 shadow-2xl animate-in slide-in-from-top-2 duration-200">
          <div className="px-2 py-1 text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-primary" />
              <span>Danh mục trang BI</span>
            </div>
            <span className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-full font-bold">
              {BI_REPORT_PAGES.length} trang
            </span>
          </div>

          <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1">
            {BI_REPORT_PAGES.map((page) => {
              const isActive = activePageId === page.id
              const IconComp = page.icon
              return (
                <button
                  key={page.id}
                  onClick={(e) => {
                    e.preventDefault()
                    onSelectPage(page.id)
                    setMobileDrawerOpen(false)
                  }}
                  className={`w-full flex items-center px-3 py-2.5 rounded-xl text-xs font-medium transition-all ${
                    isActive
                      ? 'bg-primary/20 text-primary border border-primary/30 shadow-xs font-bold'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <IconComp className="w-4 h-4 flex-shrink-0" />
                    <span>{page.name}</span>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* 🖥️ DESKTOP POWER BI SIDEBAR (COLLAPSIBLE w-56 vs w-14) */}
      <aside className={`${isCollapsed ? 'w-14' : 'w-56'} transition-all duration-300 hidden md:flex flex-col justify-between p-2.5 bg-card/75 backdrop-blur-md border-r border-border/80 text-foreground relative z-10 flex-shrink-0 select-none h-full min-h-0`}>
        
        <div className="space-y-2.5 flex-1 flex flex-col min-h-0">
          {/* Header & Toggle Collapse Button */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} px-1 py-1 flex-shrink-0`}>
            {!isCollapsed && (
              <div className="flex items-center gap-2 overflow-hidden">
                <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400 border border-amber-500/30 flex-shrink-0">
                  <BarChart3 className="w-4 h-4" />
                </div>
                <div className="flex flex-col overflow-hidden">
                  <h2 className="font-bold text-xs tracking-tight text-foreground truncate">Power BI Report</h2>
                  <span className="text-[10px] text-muted-foreground truncate">Enterprise BI Analytics</span>
                </div>
              </div>
            )}

            <button
              onClick={(e) => {
                e.preventDefault()
                onToggleCollapse()
              }}
              className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted/80 rounded-lg transition-colors cursor-pointer"
              title={isCollapsed ? "Mở rộng danh mục báo cáo" : "Thu gọn danh mục báo cáo"}
            >
              {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
            </button>
          </div>

          {/* Section Divider */}
          <div className="border-t border-border/50 flex-shrink-0" />

          {/* Report Pages Navigation Header */}
          {!isCollapsed && (
            <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between flex-shrink-0">
              <div className="flex items-center gap-1.5">
                <FileSpreadsheet className="w-3 h-3 text-primary" />
                <span>Trang báo cáo</span>
              </div>
              <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.2 rounded-full font-bold">
                {BI_REPORT_PAGES.length}
              </span>
            </div>
          )}

          {/* Report Pages Navigation List (Scrollable Slidebar on Desktop) */}
          <nav className="flex-1 overflow-y-auto space-y-0.5 pr-1 min-h-0">
            {BI_REPORT_PAGES.map((page) => {
              const isActive = activePageId === page.id
              const IconComp = page.icon
              return (
                <button
                  key={page.id}
                  onClick={(e) => {
                    e.preventDefault()
                    onSelectPage(page.id)
                  }}
                  title={page.name}
                  className={`w-full flex items-center ${isCollapsed ? 'justify-center px-0' : 'px-2.5'} py-2 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary/20 text-primary border border-primary/30 shadow-xs font-bold'
                      : 'text-muted-foreground hover:bg-muted/70 hover:text-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2.5 overflow-hidden">
                    <IconComp className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{page.name}</span>}
                  </div>
                </button>
              )
            })}
          </nav>
        </div>

      </aside>
    </>
  )
}
