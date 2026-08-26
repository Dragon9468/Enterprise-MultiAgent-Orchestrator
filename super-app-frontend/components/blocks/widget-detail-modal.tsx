'use client'

import React from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  X, BarChart2, Users, Activity, Zap, TrendingUp, TrendingDown, Palette
} from 'lucide-react'
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell, LabelList 
} from 'recharts'
import { resolveEnterpriseMetric } from '@/lib/enterprise-metrics-dictionary'

export interface WidgetDetailModalProps {
  isOpen: boolean
  onClose: () => void
  employeeId?: string
  employeeName?: string
  rawData?: Record<string, any>
  churnRateValue?: string
}

/**
 * Quy chuẩn định dạng tên chỉ số hiển thị trên biểu đồ & chú giải:
 * 1. Giữ nguyên viết tắt (AU, YCH, CTBDV, KPDV, PTTB, DK, CLDV, NET, etc.)
 * 2. Đổi dấu '_' thành khoảng trắng ' '
 * 3. Tự nhận diện các từ tiếng Việt không dấu phổ biến và chuyển thành từ có dấu hoàn chỉnh
 */
export function formatMetricLabel(key: string): string {
  if (!key) return ''

  const customMap: Record<string, string> = {
    'AU': 'AU',
    'YCH_Thang': 'YCH Tháng',
    'YCH_THANG': 'YCH Tháng',
    'Yeu_Cau_Huy': 'Yêu Cầu Hủy',
    'CTBDV_DK': 'CTBDV ĐK',
    'KPDV': 'KPDV',
    'PTTB': 'PTTB',
    'NET': 'NET',
    'Ty_Le_RM': 'Tỷ Lệ RM',
    'Ty_Le_Huy_CLDV': 'Tỷ Lệ Hủy CLDV'
  }

  if (customMap[key]) return customMap[key]

  const wordAccents: Record<string, string> = {
    'thang': 'Tháng',
    'yeu': 'Yêu',
    'cau': 'Cầu',
    'huy': 'Hủy',
    'huyl': 'Hủy',
    'dk': 'ĐK',
    'ty': 'Tỷ',
    'le': 'Lệ',
    'cldv': 'CLDV',
    'rm': 'RM',
    'thoi': 'Thời',
    'gian': 'Gian',
    'tk': 'TK',
    'bt': 'BT',
    'bill': 'Bill',
    'ton': 'Tồn',
    'thanh': 'Thành',
    'toan': 'Toán',
    'online': 'Online',
    'suy': 'Suy',
    'hao': 'Hao',
    'xep': 'Xếp',
    'hang': 'Hạng'
  }

  const withSpaces = key.replace(/_/g, ' ')
  
  return withSpaces
    .split(' ')
    .filter(Boolean)
    .map(word => {
      const lower = word.toLowerCase()
      if (wordAccents[lower]) return wordAccents[lower]
      if (word === word.toUpperCase()) return word
      return word
    })
    .join(' ')
}

// Config mapping cho CÁC CHỈ SỐ NGUYÊN NHÂN RỜI MẠNG THÀNH PHẦN (Biểu đồ Bar Chart - KHÔNG BAO GỒM AU & ĐÃ LOẠI BỎ YCH_THÁNG TRÙNG LẶP)
const CHURN_SUB_METRICS_CONFIG = [
  { key: 'Yeu_Cau_Huy', color: '#3b82f6' },
  { key: 'CTBDV_DK', color: '#8b5cf6' },
  { key: 'KPDV', color: '#f59e0b' },
  { key: 'PTTB', color: '#ec4899' },
]

export default function WidgetDetailModal({
  isOpen,
  onClose,
  employeeId = 'NV_DEMO',
  employeeName = 'Nhân Viên',
  rawData = {},
  churnRateValue = 'Chưa có chỉ số',
}: WidgetDetailModalProps) {
  if (!isOpen) return null

  // 1. Trích xuất chỉ số Hủy do CLDV (Tỷ lệ %)
  const rawCLDV = rawData?.Ty_Le_Huy_CLDV ?? rawData?.ty_le_huy_cldv ?? rawData?.['Hủy do CLDV']
  const formattedCLDV = rawCLDV !== undefined && rawCLDV !== null && rawCLDV !== '' 
    ? (String(rawCLDV).includes('%') ? String(rawCLDV) : `${rawCLDV}%`)
    : 'Chưa có chỉ số'

  // 2. Trích xuất chỉ số tổng quan MACRO (NET)
  const rawNET = rawData?.NET ?? rawData?.net ?? rawData?.['NET']
  const formattedNET = rawNET !== undefined && rawNET !== null && rawNET !== ''
    ? String(rawNET)
    : 'Chưa có chỉ số'

  // 3. Chuẩn bị dữ liệu cho Biểu đồ Recharts BarChart (CHỈ CHỨA CHỈ SỐ THÀNH PHẦN)
  const chartData = CHURN_SUB_METRICS_CONFIG.map(item => {
    const rawVal = rawData?.[item.key] ?? rawData?.[item.key.toLowerCase()] ?? rawData?.[`RM_${item.key}`] ?? rawData?.[`rm_${item.key.toLowerCase()}`] ?? 0
    const numVal = typeof rawVal === 'number' ? rawVal : parseFloat(String(rawVal).replace(/[^0-9.-]/g, '')) || 0
    const formattedLabel = formatMetricLabel(item.key)
    return {
      name: formattedLabel,
      rawKey: item.key,
      value: Math.abs(numVal),
      rawDisplay: rawVal !== 0 && rawVal !== '0' ? String(rawVal) : '0',
      color: item.color,
    }
  })

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-2xl flex items-center justify-center p-2 sm:p-4 md:p-6 font-sans select-none">
        {/* Backdrop overlay listener */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-transparent"
        />

        {/* Modal Container */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.25, ease: 'easeOut' }}
          className="w-[95vw] md:max-w-6xl h-[92vh] max-h-[92vh] bg-card/95 border border-white/15 rounded-3xl shadow-[0_0_60px_rgba(0,0,0,0.9)] backdrop-blur-3xl flex flex-col overflow-hidden relative z-10"
        >
          {/* HEADER SECTION */}
          <div className="p-4 sm:p-5 border-b border-border/60 flex items-center justify-between bg-background/50 backdrop-blur-md flex-shrink-0 gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <div className="p-2.5 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex-shrink-0 shadow-lg">
                <BarChart2 className="w-6 h-6" />
              </div>
              <div className="min-w-0">
                <h3 className="text-base sm:text-lg font-black text-foreground tracking-tight flex items-center gap-2 truncate">
                  <span className="truncate">Phân Tích Chi Tiết Tỷ Lệ Rời Mạng</span>
                </h3>
                <p className="text-xs font-mono text-muted-foreground truncate pt-0.5">
                  Nhân Viên: <span className="text-primary font-bold">{employeeName}</span> ({employeeId})
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2.5 rounded-2xl bg-muted/40 hover:bg-muted/80 border border-border text-foreground transition-all flex-shrink-0 cursor-pointer group shadow-md"
              title="Đóng Modal"
            >
              <X className="w-5.5 h-5.5 group-hover:rotate-90 transition-transform duration-200" />
            </button>
          </div>

          {/* BODY CONTENT - MAXIMIZED VERTICAL SPACE WITHOUT FOOTER */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-5">
            
            {/* TOP STATS CARDS SUMMARY (3 CỘT CHUẨN - ĐÃ BỎ AU) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* CARD 1: TỶ LỆ RỜI MẠNG */}
              <div className="bg-background/60 border border-purple-500/30 rounded-2xl p-3.5 flex flex-col justify-between shadow-md relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">Tỷ Lệ Rời Mạng</span>
                  <Activity className="w-4 h-4 text-purple-400" />
                </div>
                <div className="pt-2">
                  <span className={`text-xl sm:text-3xl font-black tracking-tight ${churnRateValue.includes('Chưa') ? 'text-muted-foreground/70 text-base font-bold' : 'text-purple-400'}`}>
                    {churnRateValue}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground block pt-0.5">Chỉ số chính</span>
                </div>
              </div>

              {/* CARD 2: % HỦY DO CLDV */}
              <div className="bg-background/60 border border-sky-500/30 rounded-2xl p-3.5 flex flex-col justify-between shadow-md relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">% Hủy Do CLDV</span>
                  <Zap className="w-4 h-4 text-sky-400" />
                </div>
                <div className="pt-2">
                  <span className={`text-xl sm:text-3xl font-black tracking-tight ${formattedCLDV.includes('Chưa') ? 'text-muted-foreground/70 text-base font-bold' : 'text-sky-400'}`}>
                    {formattedCLDV}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground block pt-0.5">Chất lượng dịch vụ</span>
                </div>
              </div>

              {/* CARD 3: NET (PHÁT TRIỂN RÒNG) */}
              <div className="bg-background/60 border border-amber-500/30 rounded-2xl p-3.5 flex flex-col justify-between shadow-md relative overflow-hidden group">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">NET (Phát Triển Ròng)</span>
                  {formattedNET.startsWith('-') ? (
                    <TrendingDown className="w-4 h-4 text-rose-400" />
                  ) : (
                    <TrendingUp className="w-4 h-4 text-amber-400" />
                  )}
                </div>
                <div className="pt-2">
                  <span className={`text-xl sm:text-3xl font-black tracking-tight ${
                    formattedNET.includes('Chưa') ? 'text-muted-foreground/70 text-base font-bold' : formattedNET.startsWith('-') ? 'text-rose-400' : 'text-amber-400'
                  }`}>
                    {formattedNET}
                  </span>
                  <span className="text-[10px] font-mono text-muted-foreground block pt-0.5">Công thức: - Rời Mạng + PTTB</span>
                </div>
              </div>
            </div>

            {/* MAIN FLEX LAYOUT: BAR CHART MAXIMIZED + COMPACT LEGEND PANEL */}
            <div className="flex flex-col md:flex-row gap-4 items-stretch">
              
              {/* SECTION 1: RECHARTS BAR CHART (TAKES MAXIMUM SPACE) */}
              <div className="flex-1 w-full bg-background/50 border border-border/80 rounded-3xl p-4 sm:p-5 flex flex-col shadow-lg backdrop-blur-xl space-y-3">
                <div className="flex items-center justify-between border-b border-border/40 pb-2.5">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-emerald-400" />
                    <h3 className="text-sm sm:text-base font-bold text-foreground">
                      Biểu Đồ So Sánh Các Chỉ Số Nguyên Nhân Rời Mạng
                    </h3>
                  </div>
                  <span className="text-xs font-mono text-muted-foreground">BarChart Visual</span>
                </div>

                {/* RECHARTS CONTAINER */}
                <div className="h-72 sm:h-96 w-full pt-1">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartData}
                      layout="vertical"
                      margin={{ top: 10, right: 30, left: 25, bottom: 10 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" horizontal={false} />
                      <XAxis type="number" stroke="currentColor" className="text-[10px] text-muted-foreground" />
                      <YAxis 
                        type="category" 
                        dataKey="name" 
                        stroke="currentColor" 
                        className="text-[11px] font-bold font-mono text-foreground"
                        width={115} 
                      />
                      {/* TẠM THỜI VÔ HIỆU HÓA TOOLTIP KHI HOVER VÌ SỐ ĐÃ HIỂN THỊ TRỰC TIẾP TRÊN THANH BAR (LƯU LẠI ĐỂ DÙNG SAU NÀY) */}
                      {/* <Tooltip
                        contentStyle={{
                          backgroundColor: 'rgba(15, 23, 42, 0.95)',
                          borderColor: 'rgba(255, 255, 255, 0.2)',
                          borderRadius: '16px',
                          color: '#fff',
                          fontSize: '12px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.5)',
                        }}
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                      /> */}
                      <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={24}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                        <LabelList 
                          dataKey="value" 
                          position="insideRight" 
                          offset={10}
                          fill="#ffffff" 
                          formatter={(val: any) => `${val}`}
                          style={{ 
                            fontWeight: '900', 
                            fontSize: '11px', 
                            fontFamily: 'monospace', 
                            fill: '#ffffff',
                            filter: 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.8))'
                          }} 
                        />
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* SECTION 2: CHÚ GIẢI MÀU SẮC SIÊU TỐI GIẢN (CHỈ 1 DÒNG CHỮ VỚI QUY TẮC ĐỊNH DẠNG TÊN) */}
              <div className="w-full md:w-56 flex-shrink-0 bg-background/50 border border-border/80 rounded-3xl p-4 flex flex-col justify-start space-y-3 shadow-lg backdrop-blur-xl">
                <div className="flex items-center gap-2 border-b border-border/40 pb-2.5">
                  <Palette className="w-4 h-4 text-cyan-400" />
                  <h3 className="text-sm font-bold text-foreground">Chú Giải Màu</h3>
                </div>

                {/* DANH SÁCH CHÚ GIẢI CHỈ GỒM NÚT MÀU + 1 DÒNG TÊN CHỈ SỐ DUY NHẤT */}
                <div className="space-y-2 flex-1 overflow-y-auto custom-scrollbar pr-0.5">
                  {chartData.map((item) => (
                    <div
                      key={item.rawKey}
                      className="bg-background/60 border border-border/50 rounded-xl px-2.5 py-2 flex items-center gap-2.5 hover:border-white/20 transition-all"
                    >
                      <span 
                        className="w-3.5 h-3.5 rounded-sm flex-shrink-0 shadow-xs border border-white/20"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-xs font-mono font-bold text-foreground truncate">
                        {item.name}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
