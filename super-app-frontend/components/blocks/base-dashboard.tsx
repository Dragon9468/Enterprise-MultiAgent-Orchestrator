'use client'

import React, { useState, useMemo } from 'react'
import { 
  Sparkles, ChevronDown, Activity, Wifi, Cpu, HardDrive, 
  ShieldAlert, User, Users, MapPin, Globe, Award, Zap, Search, Check, Radio
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import MetricCard from '@/components/blocks/metric-card'
import WidgetDetailModal from '@/components/blocks/widget-detail-modal'
import { 
  formatPercentageVal, 
  formatSingleDecimalVal, 
  formatBillTonVal 
} from '@/app/metrics/page'

export interface BaseDashboardProps {
  data?: any
  viewType: 'nhan_vien' | 'khu_vuc' | 'chi_nhanh'
  userLevel: number
  employeeRecord?: any
  employeeList?: { id: string, name: string }[]
  selectedEmployeeId?: string
  setSelectedEmployeeId?: (id: string) => void
  areaList?: { id: string, name: string }[]
  selectedAreaId?: string
  setSelectedAreaId?: (id: string) => void
  currentEmployeeId?: string
  topRightWidget?: React.ReactNode
  onOpenDetailModal?: () => void
  className?: string
}

// Helper to extract metric value safely from raw_data Record
function getMetricVal(raw: any, keys: string[], defaultVal = 'N/A') {
  if (!raw || typeof raw !== 'object') return defaultVal
  for (const k of keys) {
    if (raw[k] !== undefined && raw[k] !== null && raw[k] !== '') {
      return raw[k]
    }
  }
  return defaultVal
}

/**
 * 📐 HÀM CÂN BẰNG SỐ LƯỢNG WIDGETS TRÊN MỖI HÀNG (DESKTOP PC)
 * Tuân thủ quy tắc: MIN = 3 (trừ khi tổng số < 3), MAX = 5.
 * Không để hàng cuối bị rớt 1 widget đơn độc mà chia đều cân đối.
 * Ví dụ: 5 -> [5], 6 -> [3, 3], 7 -> [4, 3], 8 -> [4, 4], 9 -> [5, 4], 10 -> [5, 5].
 */
export function balanceWidgetRows<T>(items: T[], minPerRow = 3, maxPerRow = 5): T[][] {
  const n = items.length
  if (n === 0) return []
  if (n <= maxPerRow) {
    return [items]
  }

  const numRows = Math.ceil(n / maxPerRow)
  const baseSize = Math.floor(n / numRows)
  const remainder = n % numRows

  const rows: T[][] = []
  let currentIndex = 0

  for (let i = 0; i < numRows; i++) {
    const rowSize = baseSize + (i < remainder ? 1 : 0)
    rows.push(items.slice(currentIndex, currentIndex + rowSize))
    currentIndex += rowSize
  }

  return rows
}

export function getGridColsClass(count: number): string {
  switch (count) {
    case 1: return 'grid grid-cols-1 gap-3.5 w-full'
    case 2: return 'grid grid-cols-1 sm:grid-cols-2 gap-3.5 w-full'
    case 3: return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5 w-full'
    case 4: return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 w-full'
    case 5: return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 w-full'
    default: return 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3.5 w-full'
  }
}

/**
 * 🧱 BASE DASHBOARD COMPONENT (DÙNG CHUNG)
 * Chứa toàn bộ giao diện điều khiển, bộ lọc RBAC & 7 Widgets Chỉ Số.
 * Hỗ trợ topRightWidget slot để nhúng Khung Xếp Hạng nằm BÊN CẠNH AI Box (Side-by-side).
 */
export default function BaseDashboard({
  data,
  viewType = 'nhan_vien',
  userLevel = 1,
  employeeRecord,
  employeeList = [],
  selectedEmployeeId = '',
  setSelectedEmployeeId,
  areaList = [],
  selectedAreaId = '',
  setSelectedAreaId,
  currentEmployeeId = '',
  topRightWidget,
  className = ''
}: BaseDashboardProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false)

  // Use employeeRecord or data prop
  const activeRecord = employeeRecord || data
  const raw = activeRecord?.raw_data || activeRecord

  // Extract & format dynamic metric values for Widgets 1 to 7
  const rawAU = getMetricVal(raw, ['AU', 'au'], '')
  const numAU = parseFloat(String(rawAU))
  const valAU = !isNaN(numAU) ? numAU.toLocaleString('vi-VN') : (rawAU || 'N/A')

  const rawRM = getMetricVal(raw, ['Ty_Le_RM', 'Tỷ Lệ Rời Mạng', 'ty_le_rm'], '')
  const valRM = rawRM ? formatPercentageVal(rawRM, 'Chưa có chỉ số') : 'Chưa có chỉ số'

  const rawTkBt = getMetricVal(raw, ['Time_TK_BT', 'Thoi_Gian_TK_BT', 'Time TK-BT', 'time_tk_bt'], '')
  const valTkBt = rawTkBt ? formatSingleDecimalVal(rawTkBt, 'Chưa có chỉ số') : 'Chưa có chỉ số'

  const rawMobileApp = getMetricVal(raw, ['Ty_Le_App', 'Ty_Le_MobileApp', 'Mobile App', 'mobile_app'], '')
  const valMobileApp = rawMobileApp ? formatPercentageVal(rawMobileApp, 'Chưa có chỉ số') : 'Chưa có chỉ số'

  const rawBillTon = getMetricVal(raw, ['Bill_Ton', 'Bill tồn', 'bill_ton'], '')
  const valBillTon = rawBillTon ? formatBillTonVal(rawBillTon, 'Chưa có chỉ số') : 'Chưa có chỉ số'

  const rawTtOnline = getMetricVal(raw, ['Ty_Le_TT_Online', 'Thanh toán Online', 'tt_online'], '')
  const valTtOnline = rawTtOnline ? formatPercentageVal(rawTtOnline, 'Chưa có chỉ số') : 'Chưa có chỉ số'

  const rawSuyHao = getMetricVal(raw, ['Suy_Hao', 'Suy hao TK-BT', 'suy_hao'], '')
  const valSuyHao = rawSuyHao ? formatSingleDecimalVal(rawSuyHao, 'Chưa có chỉ số') : 'Chưa có chỉ số'

  const rawLap2 = getMetricVal(raw, ['Lap_2', 'lap_2', 'Lap 2', 'Suy_Hao'], '8')
  const numLap2 = parseFloat(String(rawLap2)) || 8

  const rawLap3 = getMetricVal(raw, ['Lap_3', 'lap_3', 'Lap 3'], '4')
  const numLap3 = parseFloat(String(rawLap3)) || 4

  // Filtered dropdown list based on viewType
  const filteredList = useMemo(() => {
    const list = viewType === 'khu_vuc' ? areaList : employeeList
    if (!searchQuery.trim()) return list
    return list.filter((item) => 
      (item?.name || item?.id || '').toLowerCase().includes(searchQuery.toLowerCase().trim()) || 
      (item?.id || '').toLowerCase().includes(searchQuery.toLowerCase().trim())
    )
  }, [viewType, areaList, employeeList, searchQuery])

  // Determine Title based on viewType
  const viewTitle = viewType === 'nhan_vien' 
    ? 'Nhân Viên' 
    : viewType === 'khu_vuc' 
      ? 'Khu Vực / Điều Hành' 
      : 'Toàn Chi Nhánh'

  return (
    <div className={`w-full space-y-4 ${className}`}>
      
      {/* 🔮 ROW 1: AI PHÂN TÍCH BOX & BỘ LỌC RBAC + TOP RIGHT WIDGET (KHUNG XẾP HẠNG SIDE-BY-SIDE) */}
      <div className={topRightWidget ? 'grid grid-cols-1 lg:grid-cols-3 gap-4 w-full' : 'w-full'}>
        
        {/* AI PHÂN TÍCH BOX */}
        <div className={`${topRightWidget ? 'lg:col-span-2' : 'w-full'} min-h-[160px] bg-card/95 border border-primary/30 rounded-2xl p-4 sm:p-4.5 shadow-lg backdrop-blur-xl flex flex-col justify-between relative transition-all ${
          isDropdownOpen ? 'z-50 overflow-visible' : 'z-10 overflow-hidden'
        }`}>
          
          {/* HEADER & RBAC FILTER DROPDOWN + FIXED-WIDTH AU BADGE */}
          <div className="flex items-center justify-between border-b border-border/40 pb-2.5 flex-shrink-0 gap-2">
            <div className="flex items-center gap-2 text-primary font-black text-xs sm:text-sm uppercase tracking-wider flex-shrink-0">
              <div className="w-5.5 h-5.5 rounded-lg bg-primary/20 flex items-center justify-center border border-primary/40">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="truncate">AI Phân Tích ({viewTitle})</span>
            </div>

            {/* RIGHT SIDE: SELECTOR + AU BADGE */}
            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {/* KHU VỰC VIEW */}
              {viewType === 'khu_vuc' && (
                <>
                  {userLevel >= 4 ? (
                    <div className="relative flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-primary/15 border border-primary/30 text-[11px] font-mono font-bold text-primary hidden sm:inline-flex items-center">
                        <MapPin className="w-3 h-3 inline mr-1" />
                        {areaList.length} KV
                      </span>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-background/90 border border-primary/40 text-xs font-black text-foreground cursor-pointer shadow-xs hover:border-primary transition-all active:scale-95"
                        >
                          <span className="font-mono text-primary truncate max-w-[100px] sm:max-w-[120px]">
                            {areaList.find(a => a.id === selectedAreaId)?.name || selectedAreaId || 'Chọn Khu Vực'}
                          </span>
                          <ChevronDown className={`w-3.5 sm:w-4 h-3.5 sm:h-4 text-primary transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                          {isDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs" onClick={() => setIsDropdownOpen(false)} />
                              <motion.div
                                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                className="absolute right-0 top-full mt-1.5 w-64 bg-card border border-primary/40 rounded-xl shadow-2xl p-2 z-50 overflow-hidden"
                              >
                                <div className="mb-2 px-1">
                                  <div className="relative">
                                    <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-muted-foreground" />
                                    <input
                                      type="text"
                                      placeholder="Tìm khu vực..."
                                      value={searchQuery}
                                      onChange={(e) => setSearchQuery(e.target.value)}
                                      className="w-full bg-background border border-border/50 rounded-lg pl-7 pr-2 py-1.5 text-xs focus:outline-none focus:border-primary/50 text-foreground font-mono"
                                    />
                                  </div>
                                </div>
                                <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                  {filteredList.map((kv) => (
                                    <button
                                      key={kv.id}
                                      type="button"
                                      onClick={() => {
                                        if (setSelectedAreaId) setSelectedAreaId(kv.id)
                                        setIsDropdownOpen(false)
                                        setSearchQuery('')
                                      }}
                                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-between ${
                                        selectedAreaId === kv.id
                                          ? 'bg-primary text-primary-foreground font-black'
                                          : 'hover:bg-primary/15 text-foreground'
                                      }`}
                                    >
                                      <span>{kv.name}</span>
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl bg-background/90 border border-primary/40 text-xs font-mono font-bold text-primary">
                      {selectedAreaId || 'Khu Vực'}
                    </span>
                  )}

                  {/* 📍 AU BADGE FOR KHU VỰC (FIXED RIGID WIDTH - MAX 5 DIGITS e.g. 19.505 / 99999) */}
                  <div 
                    className="w-[96px] min-w-[96px] max-w-[96px] h-7 px-2 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-400 font-mono font-bold text-xs flex items-center justify-center gap-1 shadow-xs tabular-nums flex-shrink-0 select-none"
                    title={`Chỉ số AU Khu Vực: ${valAU}`}
                  >
                    <span className="text-[10px] text-amber-400/70 font-black tracking-tighter">AU</span>
                    <span className="font-black truncate">{valAU || '--'}</span>
                  </div>
                </>
              )}

              {/* NHÂN VIÊN VIEW */}
              {viewType === 'nhan_vien' && (
                <>
                  {userLevel >= 3 ? (
                    <div className="relative flex items-center gap-1.5">
                      <span className="px-2 py-0.5 rounded-lg bg-primary/15 border border-primary/30 text-[11px] font-mono font-bold text-primary hidden sm:inline-flex items-center">
                        <User className="w-3 h-3 inline mr-1" />
                        {employeeList.length} NV
                      </span>

                      <div className="relative">
                        <button
                          type="button"
                          onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                          className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-background/90 border border-primary/40 text-xs font-black text-foreground cursor-pointer shadow-xs hover:border-primary transition-all active:scale-95"
                        >
                          <span className="font-mono text-primary truncate max-w-[95px] sm:max-w-[110px]">
                            {employeeList.find(e => e.id === selectedEmployeeId)?.name || selectedEmployeeId || 'Chọn NV'}
                          </span>
                          <ChevronDown className={`w-3.5 sm:w-4 h-3.5 sm:h-4 text-primary transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>

                        <AnimatePresence>
                          {isDropdownOpen && (
                            <>
                              <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs" onClick={() => setIsDropdownOpen(false)} />
                              <motion.div
                                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                                className="absolute right-0 top-full mt-1.5 w-60 bg-card border border-primary/40 rounded-xl shadow-2xl p-2 z-50 overflow-hidden"
                              >
                                <div className="p-1 border-b border-border/60 sticky top-0 bg-card z-10 flex items-center gap-1.5 mb-1">
                                  <Search className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                  <input
                                    type="text"
                                    placeholder="Tìm mã NV..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full px-2 py-1 bg-background border border-primary/30 rounded-lg text-xs font-mono font-bold text-foreground placeholder:text-muted-foreground outline-none"
                                  />
                                </div>
                                <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
                                  {filteredList.map((emp) => (
                                    <button
                                      key={emp.id}
                                      type="button"
                                      onClick={() => {
                                        if (setSelectedEmployeeId) setSelectedEmployeeId(emp.id)
                                        setIsDropdownOpen(false)
                                        setSearchQuery('')
                                      }}
                                      className={`w-full text-left px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold transition-all flex items-center justify-between ${
                                        selectedEmployeeId === emp.id
                                          ? 'bg-primary text-primary-foreground font-black'
                                          : 'hover:bg-primary/15 text-foreground'
                                      }`}
                                    >
                                      <span>{emp.name}</span>
                                      {selectedEmployeeId === emp.id && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            </>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  ) : (
                    <span className="px-2.5 py-1 rounded-xl bg-background/90 border border-primary/40 text-xs font-mono font-bold text-primary truncate max-w-[110px]">
                      {currentEmployeeId || selectedEmployeeId || 'Cá Nhân'}
                    </span>
                  )}

                  {/* 👤 AU BADGE FOR NHÂN VIÊN (FIXED RIGID WIDTH - MAX 4 DIGITS e.g. 1.239 / 9999) */}
                  <div 
                    className="w-[84px] min-w-[84px] max-w-[84px] h-7 px-2 rounded-xl bg-amber-400/15 border border-amber-400/40 text-amber-400 font-mono font-bold text-xs flex items-center justify-center gap-1 shadow-xs tabular-nums flex-shrink-0 select-none"
                    title={`Chỉ số AU Nhân Viên: ${valAU}`}
                  >
                    <span className="text-[10px] text-amber-400/70 font-black tracking-tighter">AU</span>
                    <span className="font-black truncate">{valAU || '--'}</span>
                  </div>
                </>
              )}

              {/* CHI NHÁNH VIEW */}
              {viewType === 'chi_nhanh' && (
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-[11px] font-mono font-bold text-emerald-400">
                    <Globe className="w-3 h-3 inline mr-1" />
                    Toàn Chi Nhánh
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* AI INSIGHT BODY CONTENT */}
          <div className="my-2.5">
            <div className="text-xs sm:text-sm text-foreground/90 leading-snug font-medium bg-background/60 p-3 rounded-xl border border-border/60">
              {viewType === 'khu_vuc' 
                ? (activeRecord?.ai_insight_khu_vuc || activeRecord?.raw_data?.ai_insight_khu_vuc || `${viewTitle} giữ vững chỉ số ổn định.`) 
                : (activeRecord?.ai_insight || activeRecord?.raw_data?.ai_insight || `${viewTitle} giữ vững chỉ số ổn định.`)}
            </div>
          </div>
        </div>

        {/* TOP RIGHT WIDGET SLOT (KHUNG XẾP HẠNG NẰM BÊN CẠNH) */}
        {topRightWidget && (
          <div className="lg:col-span-1 w-full h-full flex flex-col">
            {topRightWidget}
          </div>
        )}
      </div>

      {/* 📊 ROW 2: WIDGET 1 (LẶP 2 + LẶP 3) & WIDGET 2 (% RỜI MẠNG) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 w-full">
        <MetricCard
          title="Lặp 2 + Lặp 3"
          value={numLap2 + numLap3}
          unit="lần"
          icon={<Radio className="w-4 h-4 text-cyan-400" />}
          iconBgColor="bg-cyan-500/10"
          iconColor="text-cyan-400"
          kpiTarget={15}
          metricType="LOWER_IS_BETTER"
          showStackedBar={true}
          lap2Val={numLap2}
          lap3Val={numLap3}
        />
        <MetricCard
          title="Tỷ Lệ Rời Mạng (RM)"
          value={valRM}
          unit="%"
          icon={<Wifi className="w-4 h-4 text-rose-400" />}
          iconBgColor="bg-rose-500/10"
          iconColor="text-rose-400"
          kpiTarget={2.5}
          metricType="LOWER_IS_BETTER"
          showDonut={true}
          donutStrokeColor="#f43f5e"
          donutTextColor="text-rose-400"
          onClick={() => setIsDetailModalOpen(true)}
        />
      </div>

      {/* 📊 ROW 3+: DYNAMIC BALANCED SIMPLE WIDGET ROWS (MIN = 3, MAX = 5 TRÊN MỖI HÀNG PC) */}
      <div className="space-y-3.5 w-full">
        {balanceWidgetRows([
          <MetricCard
            key="time_tk_bt"
            title="Thời Gian TK-BT"
            value={valTkBt}
            unit="giờ"
            icon={<Cpu className="w-4 h-4 text-sky-400" />}
            iconBgColor="bg-sky-500/10"
            iconColor="text-sky-400"
            kpiTarget={24}
            metricType="LOWER_IS_BETTER"
          />,
          <MetricCard
            key="ty_le_mobile_app"
            title="Tỷ Lệ Mobile App"
            value={valMobileApp}
            unit="%"
            icon={<Zap className="w-4 h-4 text-amber-400" />}
            iconBgColor="bg-amber-500/10"
            iconColor="text-amber-400"
            kpiTarget={85}
            metricType="HIGHER_IS_BETTER"
            showDonut={true}
            donutStrokeColor="#0284c7"
            donutTextColor="text-amber-400"
          />,
          <MetricCard
            key="bill_ton"
            title="Bill Tồn"
            value={valBillTon}
            unit="bill"
            icon={<HardDrive className="w-4 h-4 text-purple-400" />}
            iconBgColor="bg-purple-500/10"
            iconColor="text-purple-400"
            kpiTarget={10}
            metricType="LOWER_IS_BETTER"
          />,
          <MetricCard
            key="tt_online"
            title="Thanh Toán Online"
            value={valTtOnline}
            unit="%"
            icon={<Activity className="w-4 h-4 text-teal-400" />}
            iconBgColor="bg-teal-500/10"
            iconColor="text-teal-400"
            kpiTarget={90}
            metricType="HIGHER_IS_BETTER"
            showDonut={true}
            donutStrokeColor="#a855f7"
            donutTextColor="text-teal-400"
          />,
          <MetricCard
            key="suy_hao"
            title="Suy Hao"
            value={valSuyHao}
            unit="ca"
            icon={<ShieldAlert className="w-4 h-4 text-amber-400" />}
            iconBgColor="bg-amber-500/10"
            iconColor="text-amber-400"
            kpiTarget={5}
            metricType="LOWER_IS_BETTER"
          />
        ], 3, 5).map((rowWidgets, rowIndex) => (
          <div key={`balanced-row-${rowIndex}`} className={getGridColsClass(rowWidgets.length)}>
            {rowWidgets}
          </div>
        ))}
      </div>

      {/* WIDGET DETAIL ANALYSIS MODAL (CHỈ DÀNH CHO % RỜI MẠNG) */}
      <WidgetDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        employeeId={currentEmployeeId}
        employeeName={selectedEmployeeId || currentEmployeeId}
        rawData={raw}
        churnRateValue={valRM}
      />
    </div>
  )
}
