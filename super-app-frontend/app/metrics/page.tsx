'use client'

import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  BarChart3, Activity, Wifi, Cpu, HardDrive, ShieldAlert, Sparkles, 
  User, Users, ShieldCheck, Check, RotateCcw, AlertTriangle,
  Zap, ArrowUpRight, ArrowDownRight, Server, Thermometer, Radio, Lock, Unlock, X,
  LayoutGrid, PieChart, TrendingUp, Gauge, Waves, Sliders, DollarSign, Loader2, Save, ChevronDown, Database, EyeOff, Eye, Archive, Shield, MapPin, Globe, Ban, Star,
  Smartphone, Monitor, Trophy, Award, Clock, CreditCard, Percent, ChevronRight, Crown, Search, Flame
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { pb } from '@/lib/pocketbase'
import { supabase } from '@/lib/supabase'
import { cleanEmpId, toDbEmpId } from '@/lib/utils'
import MetricCard from '@/components/blocks/metric-card'
import WidgetDetailModal from '@/components/blocks/widget-detail-modal'
import { RankingCard } from '@/components/blocks/ranking-cards'
import BaseDashboard from '@/components/blocks/base-dashboard'
import KhuVucMiniapp from '@/components/blocks/khu-vuc-miniapp'
import ChiNhanhMiniapp from '@/components/blocks/chi-nhanh-miniapp'
import { 
  getCachedEmployeeMetrics, 
  setCachedEmployeeMetrics, 
  getCachedEmployeeList, 
  setCachedEmployeeList, 
  getCachedAreaList,
  setCachedAreaList, 
  setCachedAreaMetrics,
  clearAllMetricsCache
} from '@/lib/metrics-cache'

// Flag to show/hide admin & management tabs while preserving code
const SHOW_ADMIN_MANAGEMENT_TABS = false

// Helper to format percentage metrics cleanly (e.g., 0.4666666666666667 -> 46.67%, 0.004212299 -> 0.42%)
export const formatPercentageVal = (valStr: string | number | undefined | null, defaultPct = '0%'): string => {
  if (valStr === undefined || valStr === null || valStr === '') return defaultPct
  const rawStr = String(valStr).replace('%', '').replace(',', '.').trim()
  const num = parseFloat(rawStr)
  if (isNaN(num)) return defaultPct

  let pct = num
  if (num > 0 && num < 1.0) {
    pct = num * 100
  }
  
  const formatted = Math.round(pct * 100) / 100
  return `${formatted}%`
}

// Helper to format number to max 1 decimal place (e.g. 11.00024074074074 -> 11.0)
export const formatSingleDecimalVal = (valStr: string | number | undefined | null, defaultVal = '0'): string => {
  if (valStr === undefined || valStr === null || valStr === '') return defaultVal
  const rawStr = String(valStr).replace(',', '.').trim()
  const num = parseFloat(rawStr)
  if (isNaN(num)) return defaultVal
  const rounded = Math.round(num * 10) / 10
  return String(rounded)
}

// Helper to format bill ton cleanly (Count of unpaid contracts e.g. 610 -> 610)
export const formatBillTonVal = (valStr: string | number | undefined | null, defaultVal = '0'): string => {
  if (valStr === undefined || valStr === null || valStr === '') return defaultVal
  const rawStr = String(valStr).replace(/[^0-9.-]/g, '').trim()
  const num = parseFloat(rawStr)
  if (isNaN(num)) return defaultVal
  return String(Math.round(num))
}

// ELEMENTAL ANIMATED CARD EFFECT OVERLAY COMPONENT (CLEAN FROSTED GLASS - HIGH PERFORMANCE)
export const ElementalCardEffect = ({ element, layer = 'background' }: { element?: string, layer?: 'background' | 'entity' }) => {
  return null
}

// Helper mapping rank string/number to the 10 Standard Xianxia Cultivation Realms (Top 100) with ELEMENTAL EFFECTS & HIGH CONTRAST BADGES
export const getTuTienRealm = (rankStr: string) => {
  const num = parseInt(rankStr.replace(/[^0-9]/g, ''), 10) || 3

  // TOP 1: CHÂN TIÊN (MOLTEN GOLD)
  if (num === 1) {
    return {
      rankNum: 1,
      realm: 'Chân Tiên',
      icon: '👑',
      element: 'fire',
      badge: '👑 Độc Cô Cầu Bại',
      textGradient: 'bg-gradient-to-r from-amber-200 via-[#ffcc00] to-amber-500 bg-clip-text text-transparent font-black drop-shadow-[0_2px_8px_rgba(255,204,0,0.6)]',
      glowEffect: '',
      cardStyle: 'bg-gradient-to-br from-[#402000] via-[#804000] to-[#b06000] border-2 border-[#ffcc00] shadow-[0_0_20px_#ffcc00,inset_0_0_30px_#b06000]',
      isTop5: true,
      topBadgeBg: 'bg-amber-400 text-amber-950 font-xianxia font-extrabold tracking-wide shadow-[0_0_12px_rgba(255,204,0,0.7)] border border-amber-200 text-xs sm:text-sm px-3 py-0.5 rounded-lg'
    }
  }

  // TOP 2: ĐỘ KIẾP KỲ (DARKENED CRACKED STONE WITH PURPLE THUNDER)
  if (num === 2) {
    return {
      rankNum: 2,
      realm: 'Độ Kiếp Kỳ',
      icon: '⚡',
      element: 'thunder',
      badge: '⚡ Đỉnh Phong Thiên Hạ',
      textGradient: 'bg-gradient-to-r from-purple-200 via-indigo-300 to-purple-500 bg-clip-text text-transparent font-black drop-shadow-[0_2px_8px_rgba(168,85,247,0.6)]',
      glowEffect: '',
      cardStyle: 'bg-gradient-to-br from-[#2a0845] via-[#4b1248] to-[#1e0034] border-2 border-purple-400 shadow-[0_0_25px_rgba(168,85,247,0.6),inset_0_0_35px_#4b1248]',
      isTop5: true,
      topBadgeBg: 'bg-purple-400 text-purple-950 font-xianxia font-extrabold tracking-wide shadow-[0_0_12px_rgba(168,85,247,0.7)] border border-purple-200 text-xs sm:text-sm px-3 py-0.5 rounded-lg'
    }
  }

  // TOP 3: ĐẠI THỪA KỲ (BLOOD-STAINED JADE)
  if (num === 3) {
    return {
      rankNum: 3,
      realm: 'Đại Thừa Kỳ',
      icon: '🔮',
      element: 'clouds',
      badge: '🔮 Thông Thiên Cái Thế',
      textGradient: 'bg-gradient-to-r from-rose-200 via-pink-300 to-rose-500 bg-clip-text text-transparent font-black drop-shadow-[0_2px_8px_rgba(244,63,94,0.6)]',
      glowEffect: '',
      cardStyle: 'bg-gradient-to-br from-[#3b0a0a] via-[#5c1010] to-[#200505] border-2 border-[#8b0000] shadow-[0_0_15px_#dc143c,inset_0_0_40px_#8b0000]',
      isTop5: true,
      topBadgeBg: 'bg-[#8b0000] text-rose-100 font-xianxia font-extrabold tracking-wide shadow-[0_0_12px_#dc143c] border border-rose-300/70 text-xs sm:text-sm px-3 py-0.5 rounded-lg'
    }
  }

  // TOP 4: HỢP THỂ KỲ (TRANSLUCENT BLUE CRYSTAL)
  if (num === 4) {
    return {
      rankNum: 4,
      realm: 'Hợp Thể Kỳ',
      icon: '✨',
      element: 'water',
      badge: '✨ Linh Thể Quy Nhất',
      textGradient: 'bg-gradient-to-r from-cyan-100 via-[#00ffff] to-cyan-400 bg-clip-text text-transparent font-black drop-shadow-[0_2px_8px_rgba(0,255,255,0.6)]',
      glowEffect: '',
      cardStyle: 'bg-gradient-to-br from-[#0a2a3b] via-[#10405c] to-[#051a25] border-2 border-[#00ffff]/60 shadow-[0_0_20px_rgba(0,255,255,0.4),inset_0_0_30px_#0088aa]',
      isTop5: true,
      topBadgeBg: 'bg-[#00ffff] text-teal-950 font-xianxia font-extrabold tracking-wide shadow-[0_0_12px_rgba(0,255,255,0.7)] border border-cyan-200 text-xs sm:text-sm px-3 py-0.5 rounded-lg'
    }
  }

  // TOP 5: LUYỆN HƯ KỲ (MOSS-COVERED WOOD)
  if (num === 5) {
    return {
      rankNum: 5,
      realm: 'Luyện Hư Kỳ',
      icon: '🌟',
      element: 'flower',
      badge: '🌟 Vạn Thọ Vô Cương',
      textGradient: 'bg-gradient-to-r from-green-200 via-[#00ff00] to-green-500 bg-clip-text text-transparent font-black drop-shadow-[0_2px_8px_rgba(0,128,0,0.6)]',
      glowEffect: '',
      cardStyle: 'bg-gradient-to-br from-[#1a2e1a] via-[#2a452a] to-[#0f1f0f] border-2 border-[#004d00] shadow-[0_0_20px_rgba(0,128,0,0.4),inset_0_0_40px_#003300]',
      isTop5: true,
      topBadgeBg: 'bg-[#008000] text-green-100 font-xianxia font-extrabold tracking-wide shadow-[0_0_12px_rgba(0,255,0,0.6)] border border-green-300/70 text-xs sm:text-sm px-3 py-0.5 rounded-lg'
    }
  }

  // TOP 6 - 10: HÓA THẦN KỲ
  if (num <= 10) {
    return {
      rankNum: num,
      realm: 'Hóa Thần Kỳ',
      icon: '🔥',
      element: 'fire_sub',
      badge: '🔥 Nguyệt Hoa Hóa Thần',
      textGradient: 'text-orange-400 font-extrabold',
      glowEffect: '',
      cardStyle: 'from-orange-950/70 via-card to-amber-950/50 border border-orange-500/60 shadow-md',
      isTop5: false,
      topBadgeBg: 'bg-gradient-to-r from-amber-600 to-orange-600 text-amber-950 font-xianxia font-extrabold tracking-wide shadow-[0_0_8px_rgba(249,115,22,0.6)] border border-orange-300 text-xs sm:text-sm px-3 py-0.5 rounded-lg'
    }
  }

  // TOP 11 - 20: NGUYÊN ANH KỲ
  if (num <= 20) {
    return {
      rankNum: num,
      realm: 'Nguyên Anh Kỳ',
      icon: '💎',
      element: 'crystal',
      badge: '💎 Linh Thai Nguyên Anh',
      textGradient: 'text-blue-400 font-bold',
      glowEffect: '',
      cardStyle: 'from-blue-950/60 via-card to-indigo-950/40 border border-blue-500/50 shadow-sm',
      isTop5: false,
      topBadgeBg: 'bg-gradient-to-r from-blue-500 to-cyan-500 text-slate-950 font-xianxia font-extrabold tracking-wide shadow-md border border-cyan-200 text-xs sm:text-sm px-3 py-0.5 rounded-lg'
    }
  }

  // TOP 21 - 35: KẾT ĐAN KỲ
  if (num <= 35) {
    return {
      rankNum: num,
      realm: 'Kết Đan Kỳ',
      icon: '🗡️',
      element: 'blade',
      badge: '🗡️ Bất Hủ Kết Đan',
      textGradient: 'text-teal-400 font-bold',
      glowEffect: '',
      cardStyle: 'from-teal-950/50 via-card to-emerald-950/30 border border-teal-500/40 shadow-xs',
      isTop5: false,
      topBadgeBg: 'bg-gradient-to-r from-teal-500 to-emerald-500 text-teal-950 font-xianxia font-extrabold tracking-wide shadow-md border border-emerald-200 text-xs sm:text-sm px-3 py-0.5 rounded-lg'
    }
  }

  // TOP 36 - 60: TRÚC CƠ KỲ
  if (num <= 60) {
    return {
      rankNum: num,
      realm: 'Trúc Cơ Kỳ',
      icon: '🌀',
      element: 'wind',
      badge: '🌀 Vững Chắc Trúc Cơ',
      textGradient: 'text-indigo-300 font-semibold',
      glowEffect: '',
      cardStyle: 'from-indigo-950/40 via-card to-slate-900/30 border border-indigo-500/30 shadow-xs',
      isTop5: false,
      topBadgeBg: 'bg-indigo-700/80 text-indigo-100 font-xianxia font-extrabold tracking-wide border border-indigo-300/50 text-xs sm:text-sm px-2.5 py-0.5 rounded-lg'
    }
  }

  // TOP 61 - 100+: LUYỆN KHÍ KỲ (TÂN THỦ TU TIÊN)
  return {
    rankNum: num,
    realm: 'Luyện Khí Kỳ',
    icon: '🌱',
    element: 'sprout',
    badge: '🌱 Tân Thủ Luyện Khí',
    textGradient: 'text-slate-300 font-extrabold',
    glowEffect: '',
    cardStyle: 'from-slate-950/80 via-card to-zinc-900/70 border border-slate-500/60 shadow-md',
    isTop5: false,
    topBadgeBg: 'bg-gradient-to-r from-slate-600 to-zinc-600 text-slate-100 font-xianxia font-extrabold tracking-wide shadow-[0_0_8px_rgba(148,163,184,0.5)] border border-slate-400 text-xs sm:text-sm px-3 py-0.5 rounded-lg'
  }
}

// Helper to extract dynamic metric values from raw_data with fallbacks & case-insensitive partial match
export const getMetricVal = (rawData: Record<string, any> | undefined, keys: string[], fallback: string) => {
  if (!rawData || typeof rawData !== 'object') return fallback
  
  // 1. Direct exact match
  for (const k of keys) {
    if (rawData[k] !== undefined && rawData[k] !== null && rawData[k] !== '') {
      return String(rawData[k])
    }
  }

  // 2. Case-insensitive / normalized match (remove underscores & spaces)
  const rawKeys = Object.keys(rawData)
  for (const k of keys) {
    const normK = k.toLowerCase().replace(/[^a-z0-9]/g, '')
    const matchKey = rawKeys.find(rk => {
      const normRk = rk.toLowerCase().replace(/[^a-z0-9]/g, '')
      return normRk === normK || normRk.includes(normK) || normK.includes(normRk)
    })
    if (matchKey && rawData[matchKey] !== undefined && rawData[matchKey] !== null && rawData[matchKey] !== '') {
      return String(rawData[matchKey])
    }
  }

  return fallback
}

// =========================================================
// 1. SUPABASE DATABASE TYPES & MASTER DEFINITIONS
// =========================================================
export interface NVKTMetricRecord {
  nvkt_id: string
  hidden_id?: string
  raw_data: Record<string, any>
  ai_insight?: string
  updated_at?: string
}

export type EmployeeMetricRecord = NVKTMetricRecord & {
  employee_id?: string
}

export interface KhuVucMetricRecord {
  dieu_hanh_id: string
  raw_data: Record<string, any>
  ai_insight_khu_vuc?: string
  updated_at?: string
}

export interface ManagerConfigRecord {
  id?: string | number
  allowed_keys: string[]
  default_template: string[]
  updated_at?: string
}

export interface MetricDictionaryRecord {
  metric_key: string
  format_type: 'none' | 'pie' | 'bar' | 'line' | 'area' | 'gauge' | 'geo' | 'score' | string
  line_style?: 'smooth' | 'stepped' | string
  bar_direction?: 'vertical' | 'horizontal'
  min_val?: number | null
  max_val?: number | null
  auto_max?: boolean
  polarity?: 'higher_is_better' | 'lower_is_better'
  color_theme?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple'
  gauge_style?: 'semicircle' | 'full_circle'
  gauge_indicator?: 'needle' | 'color_bar'
  score_style?: 'star_rating' | 'color_scale'
  is_locked?: boolean
  is_archived: boolean
  updated_at?: string
}

export interface MetricDefinition {
  key: string
  name: string
  category: string
  unit: string
  defaultValue: string
  rawNumericValue: number
  trend: 'up' | 'down' | 'stable'
  changeRate: string
  status: 'optimal' | 'warning' | 'critical'
  statusText: string
  icon: any
  color: string
  desc: string
  formatType?: string
  lineStyle?: 'smooth' | 'stepped'
  barDirection?: 'vertical' | 'horizontal'
  minVal?: number | null
  maxVal?: number | null
  autoMax?: boolean
  polarity?: 'higher_is_better' | 'lower_is_better'
  colorTheme?: 'indigo' | 'emerald' | 'amber' | 'rose' | 'sky' | 'purple'
  gaugeStyle?: 'semicircle' | 'full_circle'
  gaugeIndicator?: 'needle' | 'color_bar'
  scoreStyle?: 'star_rating' | 'color_scale'
  isLocked?: boolean
}

// Helper to parse numbers with flexible decimals (, or .) up to 2 places
export const parseFlexibleNumber = (inputStr: string | number | null | undefined): number | null => {
  if (inputStr === '' || inputStr === undefined || inputStr === null) return null
  const sanitized = String(inputStr).replace(',', '.').trim()
  const num = parseFloat(sanitized)
  if (isNaN(num)) return null
  return Math.round(num * 100) / 100
}

// Packs ALL fine-tuning properties into format_type JSON string (physical DB columns: metric_key, format_type, is_archived)
export const packMetricDictionaryFormatType = (item: Partial<MetricDictionaryRecord>): string => {
  const payloadObj = {
    fmt: item.format_type || 'pie',
    ls: item.line_style || 'smooth',
    bd: item.bar_direction || 'vertical',
    min: item.min_val ?? null,
    max: item.max_val ?? null,
    pol: item.polarity || 'higher_is_better',
    col: item.color_theme || 'indigo',
    gs: item.gauge_style || 'semicircle',
    gi: item.gauge_indicator || 'needle',
    ss: item.score_style || 'star_rating',
    loc: !!item.is_locked,
    am: !!item.auto_max
  }
  return JSON.stringify(payloadObj)
}

// Unpacks format_type JSON string or legacy string into MetricDictionaryRecord properties
export const unpackMetricDictionaryFormatType = (rawFormatStr?: string): Partial<MetricDictionaryRecord> => {
  if (!rawFormatStr) return { format_type: 'pie' }
  
  if (rawFormatStr.startsWith('{')) {
    try {
      const p = JSON.parse(rawFormatStr)
      return {
        format_type: p.fmt || 'pie',
        line_style: p.ls || 'smooth',
        bar_direction: p.bd || 'vertical',
        min_val: p.min ?? null,
        max_val: p.max ?? null,
        polarity: p.pol || 'higher_is_better',
        color_theme: p.col || 'indigo',
        gauge_style: p.gs || 'semicircle',
        gauge_indicator: p.gi || 'needle',
        score_style: p.ss || 'star_rating',
        is_locked: !!p.loc,
        auto_max: !!p.am
      }
    } catch (e) {}
  }
  
  return { format_type: rawFormatStr || 'pie' }
}

// Parse raw_data từ Supabase JSONB thành danh sách MetricDefinition động
export const parseRawDataToMetrics = (
  rawData: Record<string, any>,
  dictionaryMap: Map<string, MetricDictionaryRecord> = new Map()
): MetricDefinition[] => {
  if (!rawData || typeof rawData !== 'object') return []

  const icons = [Activity, DollarSign, Sparkles, Wifi, Radio, Cpu, HardDrive, Check, Server, Thermometer, Zap, ShieldCheck]
  const colors = [
    'text-indigo-400 bg-indigo-500/10 border-indigo-500/30',
    'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
    'text-amber-400 bg-amber-500/10 border-amber-500/30',
    'text-sky-400 bg-sky-500/10 border-sky-500/30',
    'text-purple-400 bg-purple-500/10 border-purple-500/30',
    'text-cyan-400 bg-cyan-500/10 border-cyan-500/30',
    'text-rose-400 bg-rose-500/10 border-rose-500/30',
  ]

  return Object.entries(rawData).map(([keyName, rawVal], idx) => {
    const valStr = String(rawVal ?? '')
    const rawNumericValue = parseFloat(valStr.replace(',', '.').replace(/[^0-9.-]/g, '')) || 0
    const dictItem = dictionaryMap.get(keyName)

    let unit = ''
    if (dictItem) {
      if (dictItem.format_type === 'pie') unit = '%'
      else if (dictItem.format_type === 'score') unit = '/ 5.0'
    } else {
      if (valStr.includes('%')) unit = '%'
      else if (valStr.toLowerCase().includes('dbm')) unit = 'dBm'
      else if (valStr.toLowerCase().includes('db')) unit = 'dB'
      else if (valStr.toLowerCase().includes('gbps')) unit = 'Gbps'
      else if (valStr.toLowerCase().includes('mbps')) unit = 'Mbps'
      else if (valStr.toLowerCase().includes('sessions')) unit = 'Sessions'
      else if (valStr.toLowerCase().includes('°c')) unit = '°C'
      else if (valStr.toLowerCase().includes('ms')) unit = 'ms'
      else if (
        keyName.toLowerCase().includes('hoa hồng') || 
        keyName.toLowerCase().includes('doanh thu') || 
        valStr.includes('đ') || 
        valStr.toLowerCase().includes('vnd')
      ) {
        unit = 'VNĐ'
      }
    }

    const IconComp = icons[idx % icons.length]
    const colorStyle = colors[idx % colors.length]

    return {
      key: keyName,
      name: keyName,
      category: 'Chỉ số Kinh doanh & Kỹ thuật',
      unit: unit,
      defaultValue: valStr,
      rawNumericValue: rawNumericValue,
      trend: rawNumericValue >= 0 ? 'up' : 'down',
      changeRate: unit === '%' ? '+0.5%' : unit === 'VNĐ' ? '+12.5%' : '±0.0',
      status: 'optimal',
      statusText: 'Cập nhật',
      icon: IconComp,
      color: colorStyle,
      desc: `Chỉ số ${keyName} trích xuất trực tiếp từ hệ thống dữ liệu Supabase Database`,
      formatType: dictItem?.format_type,
      lineStyle: dictItem?.line_style as any,
      barDirection: dictItem?.bar_direction,
      minVal: dictItem?.min_val,
      maxVal: dictItem?.max_val,
      autoMax: dictItem?.auto_max,
      polarity: dictItem?.polarity,
      colorTheme: dictItem?.color_theme,
      gaugeStyle: dictItem?.gauge_style,
      gaugeIndicator: dictItem?.gauge_indicator,
      scoreStyle: dictItem?.score_style,
      isLocked: dictItem?.is_locked
    }
  })
}

export const MASTER_METRICS: MetricDefinition[] = []
const INITIAL_DEFAULT_TEMPLATE_KEYS: string[] = []
const INITIAL_ALLOWED_KEYS: string[] = []

// =========================================================
// 2. GAMIFIED MOBILE & DESKTOP CHART COMPONENTS
// =========================================================

// WIDGET 1: SỐ CA LẮP (GAMIFICATION THANH MÁU / DYNAMIC PEAK)
const StackedBarWidget = ({ rawData, worstLapCount = 18 }: { rawData?: Record<string, any>, worstLapCount?: number }) => {
  const lap2 = parseInt(String(rawData?.Lap_2 ?? rawData?.['Lặp 2'] ?? rawData?.lap_2 ?? '4'), 10) || 4
  const lap3 = parseInt(String(rawData?.Lap_3 ?? rawData?.['Lặp 3'] ?? rawData?.lap_3 ?? '2'), 10) || 2
  const totalLap = lap2 + lap3

  const DYNAMIC_MAX = Math.max(totalLap, worstLapCount, 12)
  const isDanger = totalLap >= 10

  const lap2Pct = Math.min(100, (lap2 / DYNAMIC_MAX) * 100)
  const lap3Pct = Math.min(100 - lap2Pct, (lap3 / DYNAMIC_MAX) * 100)
  const safePct = Math.max(0, 100 - (lap2Pct + lap3Pct))

  return (
    <div className="w-full h-full flex flex-col justify-between p-1 select-none overflow-hidden">
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-lg flex items-center justify-center border ${
            isDanger ? 'bg-rose-500/20 text-rose-400 border-rose-500/40' : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          }`}>
            {isDanger ? <AlertTriangle className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-rose-400" /> : <Activity className="w-3.5 h-3.5 sm:w-4 sm:h-4" />}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-black text-xs sm:text-sm text-foreground">Số Ca Lặp</h4>
              {isDanger && (
                <span className="px-1.5 py-0.3 rounded-full bg-rose-500/20 text-rose-400 text-[9px] font-black border border-rose-500/40">
                  ⚠️ CẢNH BÁO
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Thanh trạng thái ca lặp</p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs sm:text-sm font-black font-mono text-foreground">
          <span>{totalLap} ca</span>
        </div>
      </div>

      {/* HEALTH BAR (THANH MÁU GAMIFICATION) */}
      <div className="my-1 space-y-1">
        <div className="flex justify-between items-center text-[11px] sm:text-xs font-mono font-extrabold">
          <div className="flex items-center gap-2.5">
            <span className="text-amber-400 flex items-center gap-1">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-xs bg-amber-400" /> Lặp 2: {lap2} ca
            </span>
            <span className="text-rose-400 flex items-center gap-1">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-xs bg-rose-500" /> Lặp 3: {lap3} ca
            </span>
          </div>
          <span className={isDanger ? 'text-rose-400 font-black' : 'text-emerald-400 font-bold'}>
            {isDanger ? '🔴' : '🟢'}
          </span>
        </div>

        {/* CONTAINER THANH MÁU */}
        <div className={`w-full h-5 sm:h-5.5 rounded-xl p-0.5 bg-background/80 border flex items-center gap-0.5 relative overflow-hidden shadow-inner ${
          isDanger ? 'border-rose-500/60 ring-2 ring-rose-500/30' : 'border-border/80'
        }`}>
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${lap2Pct}%` }}
            transition={{ duration: 0.6 }}
            className="h-full bg-gradient-to-r from-amber-500 to-amber-400 rounded-l-md relative group shadow-xs"
          />

          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${lap3Pct}%` }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="h-full bg-gradient-to-r from-rose-500 to-red-600 relative group shadow-xs"
          />

          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${safePct}%` }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="h-full bg-emerald-500/20 border-l border-emerald-500/30 rounded-r-md"
          />
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono text-muted-foreground border-t border-border/40 pt-0.5 flex-shrink-0">
        <span>Theo quy mô chi nhánh</span>
        <span className={isDanger ? 'text-rose-400 font-black' : 'text-emerald-400 font-bold'}>
          {isDanger ? '🔴' : '🟢'}
        </span>
      </div>
    </div>
  )
}

// WIDGET 2: TỶ LỆ RỜI MẠNG (DONUT CHART & HEARTBEAT WARNING)
const StackedAreaWidget = ({ rawData, onClick }: { rawData?: Record<string, any>, onClick?: () => void }) => {
  const rawRMVal = getMetricVal(rawData, ['Ty_Le_RM', 'Tỷ Lệ Rời Mạng', 'ty_le_rm'], '2.85%')
  const rawCLDVVal = getMetricVal(rawData, ['Ty_Le_Huy_CLDV', 'Hủy do CLDV', 'ty_le_huy_cldv'], '0.22%')

  const formattedRM = formatPercentageVal(rawRMVal, '2.85%')
  const formattedCLDV = formatPercentageVal(rawCLDVVal, '0.22%')

  const numRM = parseFloat(formattedRM.replace('%', '')) || 2.85
  const numCLDV = parseFloat(formattedCLDV.replace('%', '')) || 0.22

  const isHeartbeatWarning = numRM >= 5.0 || numCLDV >= 0.4
  const cldvPctOfRM = numRM > 0 ? Math.min(100, (numCLDV / numRM) * 100) : 0

  return (
    <div 
      onClick={onClick}
      className={`w-full h-full flex flex-col justify-between p-2.5 sm:p-3.5 rounded-2xl select-none overflow-hidden transition-all duration-300 ${
        onClick ? 'cursor-pointer hover:scale-[1.01] active:scale-[0.99] group' : ''
      } ${
        isHeartbeatWarning 
          ? 'bg-rose-950/40 border-2 border-rose-500 shadow-[0_0_25px_rgba(244,63,94,0.35)]' 
          : 'bg-card/90 border border-indigo-500/40 shadow-md backdrop-blur-xl hover:border-emerald-400/80'
      }`}
    >
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className={`w-6 h-6 sm:w-6.5 sm:h-6.5 rounded-lg flex items-center justify-center border ${
            isHeartbeatWarning 
              ? 'bg-rose-500/20 text-rose-400 border-rose-500/50' 
              : 'bg-indigo-500/20 text-indigo-400 border-indigo-500/30'
          }`}>
            <Activity className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${isHeartbeatWarning ? 'text-rose-400' : 'text-indigo-400'}`} />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h4 className="font-black text-xs sm:text-sm text-foreground">Tỷ Lệ Rời Mạng</h4>
              {isHeartbeatWarning && (
                <span className="px-1.5 py-0.3 rounded-full bg-rose-500/30 text-rose-300 text-[9px] font-black border border-rose-500/60">
                  💓 CẢNH BÁO
                </span>
              )}
            </div>
            <p className="text-[10px] sm:text-xs text-muted-foreground">Rời mạng & Hủy do CLDV</p>
          </div>
        </div>

        <div className="text-right">
          <span className={`text-sm sm:text-lg font-black tracking-tight ${isHeartbeatWarning ? 'text-rose-400' : 'text-purple-400'}`}>
            {formattedRM}
          </span>
        </div>
      </div>

      {/* DONUT CHART & CORE METRICS */}
      <div className="flex items-center justify-between gap-2.5 my-0.5 px-1 flex-1">
        <div className="relative w-14 h-14 sm:w-20 sm:h-20 flex-shrink-0 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
            <circle cx="18" cy="18" r="14" fill="none" stroke="currentColor" strokeWidth="4" className="text-muted/20" />
            <circle 
              cx="18" cy="18" r="14" fill="none" 
              stroke={isHeartbeatWarning ? '#f43f5e' : '#a855f7'} 
              strokeWidth="4" 
              strokeDasharray={`${Math.min(100, numRM * 10)}, 100`} 
              strokeLinecap="round" 
            />
            <circle 
              cx="18" cy="18" r="10" fill="none" 
              stroke="#0284c7" 
              strokeWidth="3" 
              strokeDasharray={`${Math.min(100, cldvPctOfRM)}, 100`} 
              strokeLinecap="round" 
            />
          </svg>

          <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
            <span className="text-[10px] sm:text-xs font-black text-foreground">{formattedCLDV}</span>
            <span className="text-[7px] font-mono text-muted-foreground uppercase">CLDV</span>
          </div>
        </div>

        <div className="flex-1 space-y-1 text-xs font-mono">
          <div className="flex items-center justify-between p-1 rounded-lg bg-background/60 border border-border/50">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-xs bg-purple-500 shadow-xs" />
              <span className="text-muted-foreground font-sans text-xs">Rời mạng:</span>
            </div>
            <strong className={isHeartbeatWarning ? 'text-rose-400 font-black' : 'text-purple-400 font-bold'}>
              {formattedRM}
            </strong>
          </div>

          <div className="flex items-center justify-between p-1 rounded-lg bg-background/60 border border-border/50">
            <div className="flex items-center gap-1.5">
              <span className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-xs bg-sky-500 shadow-xs" />
              <span className="text-muted-foreground font-sans text-xs">Hủy CLDV:</span>
            </div>
            <strong className={numCLDV >= 0.4 ? 'text-rose-400 font-black' : 'text-sky-400 font-bold'}>
              {formattedCLDV}
            </strong>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-[11px] sm:text-xs font-mono pt-0.5 border-t border-border/40 flex-shrink-0">
        <span>Trạng thái hệ thống</span>
        <span className={isHeartbeatWarning ? 'text-rose-400 font-black flex items-center gap-0.5' : 'text-emerald-400 font-bold'}>
          {isHeartbeatWarning ? '🔴' : '🟢'}
        </span>
      </div>
    </div>
  )
}

// =========================================================
// 3. MOBILE ARCHITECTURE (OPTIMIZED 2 SCREENS * 3 KHUNG EACH)
// =========================================================
const MobileSnapArchitecture = ({ 
  employeeRecord, 
  userRole, 
  employeeList, 
  selectedEmployeeId, 
  setSelectedEmployeeId, 
  fetchEmployeeMetrics,
  isEmployeeDropdownOpen,
  setIsEmployeeDropdownOpen,
  currentEmployeeId,
  onOpenDetailModal
}: any) => {
  const [searchEmpQuery, setSearchEmpQuery] = useState('')

  const filteredEmployees = useMemo(() => {
    if (!searchEmpQuery.trim()) return employeeList
    return employeeList.filter((emp: any) => 
      emp.id.toLowerCase().includes(searchEmpQuery.toLowerCase().trim()) || 
      emp.name.toLowerCase().includes(searchEmpQuery.toLowerCase().trim())
    )
  }, [employeeList, searchEmpQuery])

  // Extract & format dynamic values cleanly for Widgets 3 to 8
  const raw = employeeRecord?.raw_data

  const rawAU = getMetricVal(raw, ['AU', 'au'], '')
  const numAU = parseFloat(String(rawAU))
  const valAU = !isNaN(numAU) ? numAU.toLocaleString('vi-VN') : (rawAU || 'N/A')

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

  const rawXepHang = getMetricVal(raw, ['Xep_Hang_Thang', 'Xep_Hang', 'Xếp hạng', 'xep_hang_thang', 'xep_hang'], 'TOP 3')
  const valXepHang = rawXepHang.toUpperCase().includes('TOP') ? rawXepHang : `TOP ${rawXepHang}`

  // Xianxia Cultivation Realm Info for Mobile
  const mobileRealmInfo = getTuTienRealm(valXepHang)

  return (
    <div className="w-full h-[calc(100vh-88px)] overflow-y-auto overflow-x-hidden scroll-smooth custom-scrollbar bg-background text-foreground select-none">
      
      {/* SCREEN 1 */}
      <div className="h-[calc(100vh-88px)] flex flex-col p-2.5 gap-2 w-full flex-shrink-0 flex-grow-0 border-b border-border/20">
        
        {/* KHUNG 1: AI PHÂN TÍCH BOX (CỐ ĐỊNH CHIỀU CAO CHÍNH XÁC) */}
        <div className={`h-[36%] min-h-[140px] max-h-[140px] bg-card/95 border border-primary/30 rounded-2xl p-2.5 sm:p-3 flex flex-col justify-between shadow-md backdrop-blur-xl relative transition-all ${
          isEmployeeDropdownOpen ? 'z-50 overflow-visible' : 'z-10 overflow-hidden'
        }`}>
          <div className="flex items-center justify-between border-b border-border/40 pb-1.5 flex-shrink-0">
            <div className="flex items-center gap-1.5 text-primary font-black text-xs sm:text-sm uppercase tracking-wider">
              <div className="w-5.5 h-5.5 rounded-md bg-primary/20 flex items-center justify-center border border-primary/40">
                <Sparkles className="w-3.5 h-3.5" />
              </div>
              <span>AI Phân Tích</span>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              {userRole >= 2 ? (
                <div className="relative flex items-center gap-1 flex-shrink-0">
                  <span className="px-1.5 py-0.5 rounded-md bg-primary/15 border border-primary/30 text-[10px] font-mono font-bold text-primary">
                    {employeeList.length} NV
                  </span>

                  <div className="relative">
                    <button
                      type="button"
                      onClick={() => setIsEmployeeDropdownOpen(!isEmployeeDropdownOpen)}
                      className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-background/90 border border-primary/40 text-xs font-black text-foreground cursor-pointer shadow-xs active:scale-95"
                    >
                      <span className="font-mono text-primary truncate max-w-[80px]">
                        {employeeList.find((e: any) => e.id === selectedEmployeeId)?.name || selectedEmployeeId || 'Chọn NV'}
                      </span>
                      <ChevronDown className={`w-3.5 h-3.5 text-primary transition-transform ${isEmployeeDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {isEmployeeDropdownOpen && (
                        <>
                          <div className="fixed inset-0 z-40 bg-black/20 backdrop-blur-xs" onClick={() => setIsEmployeeDropdownOpen(false)} />
                          <motion.div
                            initial={{ opacity: 0, y: 4, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 4, scale: 0.95 }}
                            className="absolute right-0 top-full mt-1.5 w-56 bg-card/98 border-2 border-primary/60 rounded-2xl p-1.5 shadow-2xl backdrop-blur-3xl z-[9999] space-y-1 font-mono text-xs overflow-hidden"
                          >
                            <div className="p-1 border-b border-border/60 sticky top-0 bg-card z-10 flex items-center gap-1">
                              <Search className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                              <input
                                type="text"
                                autoFocus
                                value={searchEmpQuery}
                                onChange={(e) => setSearchEmpQuery(e.target.value)}
                                placeholder="Tìm mã NV..."
                                className="w-full px-2 py-1 bg-background border border-primary/30 rounded-lg text-xs font-mono font-bold text-foreground placeholder:text-muted-foreground outline-none focus:ring-1 focus:ring-primary"
                              />
                            </div>

                            <div className="overflow-y-auto max-h-52 custom-scrollbar space-y-0.5 p-0.5">
                              {filteredEmployees.length > 0 ? (
                                filteredEmployees.map((emp: any) => (
                                  <button
                                    key={emp.id}
                                    type="button"
                                    onClick={() => {
                                      setSelectedEmployeeId(emp.id)
                                      fetchEmployeeMetrics(emp.id)
                                      setIsEmployeeDropdownOpen(false)
                                      setSearchEmpQuery('')
                                    }}
                                    className={`w-full text-left px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center justify-between cursor-pointer ${
                                      selectedEmployeeId === emp.id ? 'bg-primary/20 text-primary border border-primary/30' : 'text-foreground hover:bg-muted'
                                    }`}
                                  >
                                    <span className="truncate">{emp.name}</span>
                                    {selectedEmployeeId === emp.id && <Check className="w-3.5 h-3.5 text-primary" />}
                                  </button>
                                ))
                              ) : (
                                <div className="p-2 text-center text-xs text-muted-foreground">Không tìm thấy mã NV</div>
                              )}
                            </div>
                          </motion.div>
                        </>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <span className="px-2 py-0.5 rounded-lg bg-background/90 border border-primary/40 text-xs font-mono font-bold text-primary truncate max-w-[90px]">
                  {currentEmployeeId || selectedEmployeeId || 'Cá Nhân'}
                </span>
              )}

              {/* AU BADGE MOBILE (FIXED RIGID WIDTH - MAX 4 DIGITS) */}
              <div 
                className="w-[74px] min-w-[74px] max-w-[74px] h-6 px-1 rounded-lg bg-amber-400/15 border border-amber-400/40 text-amber-400 font-mono font-bold text-[11px] flex items-center justify-center gap-0.5 shadow-xs tabular-nums flex-shrink-0 select-none"
                title={`AU: ${valAU}`}
              >
                <span className="text-[9px] text-amber-400/70 font-black">AU</span>
                <span className="font-bold truncate">{valAU || '--'}</span>
              </div>
            </div>
          </div>

          <div className="h-16 max-h-16 overflow-y-auto custom-scrollbar text-xs sm:text-sm text-foreground/95 leading-snug font-medium bg-background/60 p-2.5 rounded-xl border border-border/60">
            {employeeRecord?.ai_insight || `Nhân viên ${selectedEmployeeId || currentEmployeeId} giữ vững chỉ số ổn định. Tỉ lệ hoàn tất TK-BT đạt ${valMobileApp}, lặp mạng giảm 12% so với cùng kỳ.`}
          </div>
        </div>

        {/* KHUNG 2: WIDGET 1 (SỐ CA LẮP) */}
        <div className="h-[32%] bg-card/90 border border-border rounded-2xl p-2.5 sm:p-3 shadow-md backdrop-blur-xl overflow-hidden">
          <StackedBarWidget rawData={employeeRecord?.raw_data} />
        </div>

        {/* KHUNG 3: WIDGET 2 (TỶ LỆ RỜI MẠNG) */}
        <div className="h-[32%] overflow-hidden">
          <StackedAreaWidget rawData={employeeRecord?.raw_data} onClick={onOpenDetailModal} />
        </div>
      </div>

      {/* SCREEN 2 */}
      <div className="h-[calc(100vh-88px)] flex flex-col p-2.5 gap-2 w-full flex-shrink-0 flex-grow-0">
        
        {/* WIDGET [3] & WIDGET [4] (% MOBILE APP VỚI VÒNG TRÒN DYNAMIC BÊN PHẢI) */}
        <div className="h-[33%] grid grid-cols-2 gap-2 w-full">
          <MetricCard
            title="Time TK-BT"
            value={valTkBt}
            unit="Giờ"
            icon={<Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />}
            iconBgColor="bg-amber-500/10"
            iconColor="text-amber-400"
            kpiTarget={3.0}
            metricType="LOWER_IS_BETTER"
          />

          <MetricCard
            title="% Mobile App"
            value={valMobileApp}
            unit="%"
            icon={<Percent className="w-3.5 h-3.5" />}
            iconBgColor="bg-sky-500/10"
            iconColor="text-sky-400"
            kpiTarget={90}
            metricType="HIGHER_IS_BETTER"
            showDonut={true}
            donutStrokeColor="#0284c7"
            donutTextColor="text-sky-400"
          />
        </div>

        {/* WIDGET [5] (BILL TỒN - ĐƠN VỊ BILL) & WIDGET [6] (% TT ONLINE) */}
        <div className="h-[33%] grid grid-cols-2 gap-2 w-full">
          <MetricCard
            title="Bill Tồn"
            value={valBillTon}
            unit="bill"
            icon={<CreditCard className="w-3.5 h-3.5" />}
            iconBgColor="bg-emerald-500/10"
            iconColor="text-emerald-400"
            kpiTarget={15}
            metricType="LOWER_IS_BETTER"
          />

          <MetricCard
            title="% Thanh Toán Online"
            value={valTtOnline}
            unit="%"
            icon={<Percent className="w-3.5 h-3.5" />}
            iconBgColor="bg-purple-500/10"
            iconColor="text-purple-400"
            kpiTarget={90}
            metricType="HIGHER_IS_BETTER"
            showDonut={true}
            donutStrokeColor="#a855f7"
            donutTextColor="text-purple-400"
          />
        </div>

        {/* WIDGET [7] & WIDGET [8] (ANIMATED ELEMENTAL MYTHICAL REALM CARD) */}
        <div className="h-[34%] grid grid-cols-2 gap-2 w-full">
          <MetricCard
            title="Suy Hao TK-BT"
            value={valSuyHao}
            unit="hợp đồng"
            icon={<Radio className="w-3.5 h-3.5" />}
            iconBgColor="bg-cyan-500/10"
            iconColor="text-cyan-400"
            kpiTarget={15}
            metricType="LOWER_IS_BETTER"
          />

          {/* WIDGET 8: KHUNG XẾP HẠNG CẢNH GIỚI TU TIÊN */}
          <RankingCard
            rank={valXepHang}
            employeeId={selectedEmployeeId || currentEmployeeId}
            employeeName={employeeRecord?.raw_data?.['Ten_NV'] || employeeRecord?.raw_data?.['Nhân viên']}
          />
        </div>

      </div>

    </div>
  )
}

// =========================================================
// 4. MAIN PAGE COMPONENT
// =========================================================
export default function MetricsPage() {
  const [activeTab, setActiveTab] = useState<'personal' | 'khu_vuc' | 'chi_nhanh' | 'collective' | 'management' | 'system_config'>('personal')
  const [userRole, setUserRole] = useState<number>(5)
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false)

  // Supabase Data State
  const [employeeRecord, setEmployeeRecord] = useState<EmployeeMetricRecord | null>(null)
  const [employeeDataLoading, setEmployeeDataLoading] = useState<boolean>(true)
  const [supabaseParsedMetrics, setSupabaseParsedMetrics] = useState<MetricDefinition[]>([])
  const [currentEmployeeId, setCurrentEmployeeId] = useState<string>('HUYHC')
  
  // Manager Specific State
  const [employeeList, setEmployeeList] = useState<{id: string, name: string}[]>([])
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('')
  const [isEmployeeDropdownOpen, setIsEmployeeDropdownOpen] = useState<boolean>(false)
  const [searchEmpQueryDesktop, setSearchEmpQueryDesktop] = useState('')

  // Metric Dictionary State
  const [dictionaryRecords, setDictionaryRecords] = useState<MetricDictionaryRecord[]>([])
  const [dictionaryMap, setDictionaryMap] = useState<Map<string, MetricDictionaryRecord>>(new Map())
  const [adminDraftDictionary, setAdminDraftDictionary] = useState<Record<string, MetricDictionaryRecord>>({})
  const [autoSaveStatus, setAutoSaveStatus] = useState<string | null>(null)
  const [isAutoSaveEnabled, setIsAutoSaveEnabled] = useState<boolean>(true)
  const [isSavingDictionary, setIsSavingDictionary] = useState<boolean>(false)

  const filteredEmployeesDesktop = useMemo(() => {
    if (!searchEmpQueryDesktop.trim()) return employeeList
    return employeeList.filter((emp: any) => 
      emp.id.toLowerCase().includes(searchEmpQueryDesktop.toLowerCase().trim()) ||
      emp.name.toLowerCase().includes(searchEmpQueryDesktop.toLowerCase().trim())
    )
  }, [employeeList, searchEmpQueryDesktop])

  const fetchMetricDictionary = async () => {
    try {
      const { data, error } = await supabase.from('metric_dictionary').select('*')
      if (data && Array.isArray(data)) {
        setDictionaryRecords(data)
        const map = new Map<string, MetricDictionaryRecord>()
        const draft: Record<string, MetricDictionaryRecord> = {}
        
        data.forEach(item => {
          const unpacked = unpackMetricDictionaryFormatType(item.format_type)
          const record: MetricDictionaryRecord = {
            metric_key: item.metric_key,
            format_type: unpacked.format_type || 'pie',
            line_style: unpacked.line_style || 'smooth',
            bar_direction: unpacked.bar_direction || 'vertical',
            min_val: unpacked.min_val ?? null,
            max_val: unpacked.max_val ?? null,
            auto_max: unpacked.auto_max || unpacked.max_val === null,
            polarity: unpacked.polarity || 'higher_is_better',
            color_theme: unpacked.color_theme || 'indigo',
            gauge_style: unpacked.gauge_style || 'semicircle',
            gauge_indicator: unpacked.gauge_indicator || 'needle',
            score_style: unpacked.score_style || 'star_rating',
            is_locked: unpacked.is_locked || false,
            is_archived: !!item.is_archived
          }
          map.set(item.metric_key, record)
          draft[item.metric_key] = record
        })

        setDictionaryMap(map)
        setAdminDraftDictionary(draft)
      }
    } catch (err) {
      console.error('[Supabase fetchMetricDictionary Error]:', err)
    }
  }

  const fetchEmployeeMetrics = async (targetEmpId: string, currentDictMap = dictionaryMap) => {
    const cleanId = cleanEmpId(targetEmpId)
    const dbId = toDbEmpId(targetEmpId)

    // 1. Kiểm tra cache trước (0ms latency tức thì, hỗ trợ cả cleanId lẫn dbId)
    const cached = getCachedEmployeeMetrics(cleanId) || getCachedEmployeeMetrics(dbId) || getCachedEmployeeMetrics(targetEmpId)
    if (cached) {
      setEmployeeRecord(cached)
      setCurrentEmployeeId(cleanEmpId(cached.nvkt_id || cached.employee_id || cleanId))
      if (cached.raw_data && typeof cached.raw_data === 'object') {
        const parsedList = parseRawDataToMetrics(cached.raw_data, currentDictMap)
        setSupabaseParsedMetrics(parsedList)
      } else {
        setSupabaseParsedMetrics([])
      }
      setEmployeeDataLoading(false)
      return
    }

    setEmployeeDataLoading(true)
    try {
      // Tìm theo dbId (HUETI.xxx), cleanId (xxx), hoặc ILIKE
      let { data: empData } = await supabase
        .from('nvkt_metrics')
        .select('*')
        .or(`nvkt_id.eq.${dbId},nvkt_id.eq.${cleanId},nvkt_id.ilike.%.${cleanId}`)
        .limit(1)
        .maybeSingle()

      if (empData) {
        setEmployeeRecord(empData)
        const displayId = cleanEmpId(empData.nvkt_id || empData.employee_id || cleanId)
        setCurrentEmployeeId(displayId)
        setCachedEmployeeMetrics(cleanId, empData)
        setCachedEmployeeMetrics(displayId, empData)
        if (empData.nvkt_id) {
          setCachedEmployeeMetrics(empData.nvkt_id, empData)
        }

        if (empData.raw_data && typeof empData.raw_data === 'object') {
          const parsedList = parseRawDataToMetrics(empData.raw_data, currentDictMap)
          setSupabaseParsedMetrics(parsedList)
        } else {
          setSupabaseParsedMetrics([])
        }
      } else {
        setEmployeeRecord(null)
        setCurrentEmployeeId(cleanId)
        setSupabaseParsedMetrics([])
      }
    } catch (err) {
      console.error('[Supabase Fetch nvkt_metrics Error]:', err)
      setEmployeeRecord(null)
      setCurrentEmployeeId(cleanId)
      setSupabaseParsedMetrics([])
    } finally {
      setEmployeeDataLoading(false)
    }
  }

  useEffect(() => {
    const initApp = async () => {
      let dictMap = new Map<string, MetricDictionaryRecord>()
      try {
        const { data: dictData } = await supabase.from('metric_dictionary').select('*')
        if (dictData && Array.isArray(dictData)) {
          setDictionaryRecords(dictData)
          const draft: Record<string, MetricDictionaryRecord> = {}
          dictData.forEach(item => {
            const unpacked = unpackMetricDictionaryFormatType(item.format_type)
            const record: MetricDictionaryRecord = {
              metric_key: item.metric_key,
              format_type: unpacked.format_type || 'pie',
              line_style: unpacked.line_style || 'smooth',
              bar_direction: unpacked.bar_direction || 'vertical',
              min_val: unpacked.min_val ?? null,
              max_val: unpacked.max_val ?? null,
              auto_max: unpacked.auto_max || unpacked.max_val === null,
              polarity: unpacked.polarity || 'higher_is_better',
              color_theme: unpacked.color_theme || 'indigo',
              gauge_style: unpacked.gauge_style || 'semicircle',
              gauge_indicator: unpacked.gauge_indicator || 'needle',
              score_style: unpacked.score_style || 'star_rating',
              is_locked: unpacked.is_locked || false,
              is_archived: !!item.is_archived
            }
            dictMap.set(item.metric_key, record)
            draft[item.metric_key] = record
          })
          setDictionaryMap(dictMap)
          setAdminDraftDictionary(draft)
        }
      } catch (e) {}

      const authModel = pb.authStore.model
      // role_level được đọc thuần từ authStore.model — đã được validate và cập nhật từ PocketBase server
      // bởi authRefresh() trong AuthGuard. Không cần hardcode override ở đây.
      let roleVal = authModel?.role_level ?? 1
      let rawId = 'HUYHC'

      if (authModel) {
        if (authModel.email) {
          rawId = authModel.email.split('@')[0]
        } else if (authModel.username) {
          rawId = authModel.username
        }
      }
      const idNhanVien = cleanEmpId(rawId) || 'HUYHC'

      setUserRole(roleVal)

      if (roleVal >= 4) {
        // LEVEL 4, 5, 6, 7 (TRƯỞNG PHÒNG, GIÁM ĐỐC, SYS ADMIN, SUPER ADMIN): LẤY TOÀN BỘ 84+ NV (ĐÃ LỌC BỎ TIỀN TỐ HUETI.)
        try {
          const cachedEmpList = getCachedEmployeeList()
          if (cachedEmpList && cachedEmpList.length > 0) {
            setEmployeeList(cachedEmpList)
            const defaultSelected = cachedEmpList[0].id
            setSelectedEmployeeId(defaultSelected)
            await fetchEmployeeMetrics(defaultSelected, dictMap)
          } else {
            const { data: listData, error: listError } = await supabase
              .from('nvkt_metrics')
              .select('nvkt_id')

            if (!listError && listData && Array.isArray(listData) && listData.length > 0) {
              const list = listData.map((i: any) => {
                const clean = cleanEmpId(i.nvkt_id)
                return {
                  id: clean,
                  name: clean
                }
              }).filter((i: any) => i.id)

              // Deduplicate danh sách theo mã clean
              const uniqueList = Array.from(new Map(list.map((item: any) => [item.id, item])).values())

              setEmployeeList(uniqueList)
              setCachedEmployeeList(uniqueList)
              if (uniqueList.length > 0) {
                const defaultSelected = uniqueList[0].id
                setSelectedEmployeeId(defaultSelected)
                await fetchEmployeeMetrics(defaultSelected, dictMap)
              } else {
                await fetchEmployeeMetrics(idNhanVien, dictMap)
              }
            } else {
              console.error('[Supabase nvkt_metrics fetch error]:', listError)
              setEmployeeList([{ id: idNhanVien, name: idNhanVien }])
              await fetchEmployeeMetrics(idNhanVien, dictMap)
            }
          }
        } catch (e) {
          console.error('[Supabase nvkt_metrics catch error]:', e)
          setEmployeeList([{ id: idNhanVien, name: idNhanVien }])
          await fetchEmployeeMetrics(idNhanVien, dictMap)
        }
      } else if (roleVal === 3) {
        // LEVEL 3 (TRƯỞNG NHÓM / ĐIỀU HÀNH KHU VỰC): LẤY DANH SÁCH THEO KHU VỰC TỪ BẢNG khu_vuc_nvkt TRÊN SUPABASE
        try {
          let targetAreaId = 'TAIHD'
          const cleanId = cleanEmpId(idNhanVien)
          const dbId = toDbEmpId(idNhanVien)

          // 1. Tra cứu khu vực quản lý của NV từ bảng khu_vuc_nvkt (hỗ trợ cả có/không tiền tố)
          const { data: mappingData } = await supabase
            .from('khu_vuc_nvkt')
            .select('dieu_hanh_id')
            .or(`nvkt_id.eq.${dbId},nvkt_id.eq.${cleanId},nvkt_id.ilike.%.${cleanId}`)
            .limit(1)

          if (mappingData && mappingData.length > 0 && mappingData[0].dieu_hanh_id) {
            targetAreaId = mappingData[0].dieu_hanh_id
          }

          // 2. Lấy toàn bộ danh sách nhân viên thuộc khu vực đó (lọc bỏ HUETI.)
          const { data: kvData } = await supabase
            .from('khu_vuc_nvkt')
            .select('nvkt_id')
            .eq('dieu_hanh_id', targetAreaId)
            
          if (kvData && Array.isArray(kvData) && kvData.length > 0) {
            const list = kvData.map((i: any) => {
              const clean = cleanEmpId(i.nvkt_id)
              return {
                id: clean,
                name: clean
              }
            }).filter((i: any) => i.id)

            const uniqueList = Array.from(new Map(list.map((item: any) => [item.id, item])).values())
            setEmployeeList(uniqueList)
            if (uniqueList.length > 0) {
              const defaultSelected = uniqueList[0].id
              setSelectedEmployeeId(defaultSelected)
              await fetchEmployeeMetrics(defaultSelected, dictMap)
            } else {
              await fetchEmployeeMetrics(idNhanVien, dictMap)
            }
          } else {
            setEmployeeList([{ id: idNhanVien, name: idNhanVien }])
            await fetchEmployeeMetrics(idNhanVien, dictMap)
          }
        } catch (e) {
          console.error('[Supabase Level 3 Area Lookup Error]:', e)
          setEmployeeList([{ id: idNhanVien, name: idNhanVien }])
          await fetchEmployeeMetrics(idNhanVien, dictMap)
        }
      } else {
        // NHÂN VIÊN (Level 1): CHỈ LẤY BẢN THÂN
        setEmployeeList([{ id: idNhanVien, name: idNhanVien }])
        setSelectedEmployeeId(idNhanVien)
        await fetchEmployeeMetrics(idNhanVien, dictMap)
      }

      // 🚀 BACKGROUND PREFETCH KHU VỰC (Tải sẵn toàn bộ 4 khu vực vào Cache)
      try {
        const cachedAreas = getCachedAreaList()
        if (!cachedAreas || cachedAreas.length === 0) {
          const { data: allAreas } = await supabase.from('khu_vuc_metrics').select('*')
          if (allAreas && Array.isArray(allAreas) && allAreas.length > 0) {
            const kvList = allAreas.map((item: any) => ({
              id: item.dieu_hanh_id,
              name: item.dieu_hanh_id
            }))
            setCachedAreaList(kvList)
            allAreas.forEach((areaRecord: any) => {
              setCachedAreaMetrics(areaRecord.dieu_hanh_id, areaRecord)
            })
          }
        }
      } catch (prefetchErr) {
        console.error('[Prefetch KhuVuc Error]:', prefetchErr)
      }
    }

    initApp()
  }, [])

  useEffect(() => {
    if (userRole < 3 && (activeTab === 'management' || activeTab === 'system_config')) {
      setActiveTab('personal')
    } else if (userRole < 4 && activeTab === 'system_config') {
      setActiveTab('personal')
    }
  }, [userRole, activeTab])

  // Extract & format dynamic values cleanly for Desktop Widgets 3 to 8
  const desktopRaw = employeeRecord?.raw_data

  const desktopRawAU = getMetricVal(desktopRaw, ['AU', 'au'], '')
  const desktopNumAU = parseFloat(String(desktopRawAU))
  const desktopValAU = !isNaN(desktopNumAU) ? desktopNumAU.toLocaleString('vi-VN') : (desktopRawAU || 'N/A')

  const desktopRawRM = getMetricVal(desktopRaw, ['Ty_Le_RM', 'Tỷ Lệ Rời Mạng', 'ty_le_rm'], '')
  const desktopValRM = desktopRawRM ? formatPercentageVal(desktopRawRM, 'Chưa có chỉ số') : 'Chưa có chỉ số'

  const desktopRawTkBt = getMetricVal(desktopRaw, ['Time_TK_BT', 'Thoi_Gian_TK_BT', 'Time TK-BT', 'time_tk_bt'], '')
  const desktopValTkBt = desktopRawTkBt ? formatSingleDecimalVal(desktopRawTkBt, 'Chưa có chỉ số') : 'Chưa có chỉ số'

  const desktopRawMobileApp = getMetricVal(desktopRaw, ['Ty_Le_App', 'Ty_Le_MobileApp', 'Mobile App', 'mobile_app'], '')
  const desktopValMobileApp = desktopRawMobileApp ? formatPercentageVal(desktopRawMobileApp, 'Chưa có chỉ số') : 'Chưa có chỉ số'

  const desktopRawBillTon = getMetricVal(desktopRaw, ['Bill_Ton', 'Bill tồn', 'bill_ton'], '')
  const desktopValBillTon = desktopRawBillTon ? formatBillTonVal(desktopRawBillTon, 'Chưa có chỉ số') : 'Chưa có chỉ số'

  const desktopRawTtOnline = getMetricVal(desktopRaw, ['Ty_Le_TT_Online', 'Thanh toán Online', 'tt_online'], '')
  const desktopValTtOnline = desktopRawTtOnline ? formatPercentageVal(desktopRawTtOnline, 'Chưa có chỉ số') : 'Chưa có chỉ số'

  const desktopRawSuyHao = getMetricVal(desktopRaw, ['Suy_Hao', 'Suy hao TK-BT', 'suy_hao'], '')
  const desktopValSuyHao = desktopRawSuyHao ? formatSingleDecimalVal(desktopRawSuyHao, 'Chưa có chỉ số') : 'Chưa có chỉ số'

  const desktopRawXepHang = getMetricVal(desktopRaw, ['Xep_Hang_Thang', 'Xep_Hang', 'Xếp hạng', 'xep_hang_thang', 'xep_hang'], 'TOP 3')
  const desktopValXepHang = desktopRawXepHang.toUpperCase().includes('TOP') ? desktopRawXepHang : `TOP ${desktopRawXepHang}`

  // Xianxia Cultivation Realm Info for Desktop
  const desktopRealmInfo = getTuTienRealm(desktopValXepHang)

  return (
    <div className="flex-1 flex flex-col w-full h-full relative overflow-hidden select-none">
      
      {/* 🧭 STICKY TOP HEADER BAR */}
      <div className="flex items-center justify-between border-b border-border/80 px-3 py-1.5 sm:px-6 bg-card/60 backdrop-blur-md sticky top-0 z-20 w-full flex-shrink-0 h-10">
        <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-[340px] sm:w-[420px] max-w-full">
          <TabsList className={`grid w-full h-8 ${SHOW_ADMIN_MANAGEMENT_TABS ? (userRole >= 4 ? 'grid-cols-5' : userRole >= 3 ? 'grid-cols-4' : 'grid-cols-3') : 'grid-cols-3'} bg-muted/80 border border-border/60 p-0.5 rounded-xl`}>
            <TabsTrigger value="personal" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-bold cursor-pointer text-xs flex items-center justify-center gap-1.5">
              <User className="w-3.5 h-3.5" />
              <span>{userRole >= 3 ? 'Nhân viên' : 'Cá nhân'}</span>
            </TabsTrigger>
            <TabsTrigger value="khu_vuc" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-bold cursor-pointer text-xs flex items-center justify-center gap-1.5">
              <MapPin className="w-3.5 h-3.5" />
              <span>Khu vực</span>
            </TabsTrigger>
            <TabsTrigger value="chi_nhanh" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-bold cursor-pointer text-xs flex items-center justify-center gap-1.5">
              <Globe className="w-3.5 h-3.5" />
              <span>Chi nhánh</span>
            </TabsTrigger>
            {SHOW_ADMIN_MANAGEMENT_TABS && userRole >= 4 && (
              <TabsTrigger value="management" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-bold cursor-pointer text-xs flex items-center justify-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Quản lý</span>
              </TabsTrigger>
            )}
            {SHOW_ADMIN_MANAGEMENT_TABS && userRole >= 6 && (
              <TabsTrigger value="system_config" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-bold cursor-pointer text-xs flex items-center justify-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-indigo-400" />
                <span>Admin</span>
              </TabsTrigger>
            )}
          </TabsList>
        </Tabs>
      </div>

      {/* 🚀 WORKSPACE CONTENT AREA */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden w-full max-w-full">

        {/* =========================================================
           MINIAPP 1: NHÂN VIÊN (KEEP-ALIVE: GIỮ TRONG DOM, 0MS SWITCH)
           ========================================================= */}
        <div className={activeTab === 'personal' ? 'p-4 lg:p-5 space-y-4 w-full max-w-6xl mx-auto block' : 'hidden'}>
          <BaseDashboard
            viewType="nhan_vien"
            userLevel={userRole}
            employeeRecord={employeeRecord}
            employeeList={employeeList}
            selectedEmployeeId={selectedEmployeeId}
            setSelectedEmployeeId={(id: string) => {
              setSelectedEmployeeId(id)
              fetchEmployeeMetrics(id)
            }}
            currentEmployeeId={currentEmployeeId}
            topRightWidget={
              <RankingCard
                rank={desktopValXepHang}
              />
            }
          />
        </div>

        {/* =========================================================
           MINIAPP 2: KHU VỰC (KEEP-ALIVE: GIỮ TRONG DOM, 0MS SWITCH)
           ========================================================= */}
        <div className={activeTab === 'khu_vuc' ? 'p-4 lg:p-5 space-y-4 w-full max-w-6xl mx-auto block' : 'hidden'}>
          <KhuVucMiniapp userLevel={userRole} currentUser={pb.authStore.model} />
        </div>

        {/* =========================================================
           MINIAPP 3: CHI NHÁNH (KEEP-ALIVE: GIỮ TRONG DOM, 0MS SWITCH)
           ========================================================= */}
        <div className={activeTab === 'chi_nhanh' ? 'p-4 lg:p-5 space-y-4 w-full max-w-6xl mx-auto block' : 'hidden'}>
          <ChiNhanhMiniapp userLevel={userRole} employeeRecord={employeeRecord} />
        </div>

        {/* WIDGET DETAIL MODAL (RECHARTS CHURN RATE VISUALIZER) */}
        <WidgetDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => setIsDetailModalOpen(false)}
          employeeId={currentEmployeeId}
          employeeName={selectedEmployeeId || currentEmployeeId}
          rawData={employeeRecord?.raw_data}
          churnRateValue={desktopValRM}
        />

      </div>

    </div>
  )
}
