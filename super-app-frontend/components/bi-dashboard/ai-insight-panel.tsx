'use client'

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { usePathname } from 'next/navigation'
import { 
  Sparkles, RefreshCw, ChevronDown, ChevronUp, AlertTriangle, 
  User, Building2, Shield, Target, BarChart3, Lightbulb, CheckCircle2, TrendingUp,
  Search, Check, X
} from 'lucide-react'

// 0. BỘ PHÂN TÍCH TÁCH 2 PHẦN: 📊 TỔNG QUAN & 🎯 KHUYẾN NGHỊ
interface ParsedAiInsight {
  overview: string | null
  recommendations: string | null
  raw: string
  isStructured: boolean
}

export function parseAiInsightContent(text: string): ParsedAiInsight {
  if (!text || typeof text !== 'string') {
    return { overview: null, recommendations: null, raw: '', isStructured: false }
  }

  const raw = text.trim()

  // Match 📊 TỔNG QUAN: (chấp nhận có/không có emoji, bold markdown, dấu 2 chấm)
  const overviewRegex = /(?:📊\s*)?(?:\*{1,2})?TỔNG\s*QUAN(?:\*{1,2})?\s*:\s*([\s\S]*?)(?=(?:(?:🎯\s*)?(?:\*{1,2})?KHUYẾN\s*NGHỊ(?:\*{1,2})?\s*:)|$)/i
  
  // Match 🎯 KHUYẾN NGHỊ: (chấp nhận có/không có emoji, bold markdown, dấu 2 chấm)
  const recRegex = /(?:🎯\s*)?(?:\*{1,2})?KHUYẾN\s*NGHỊ(?:\*{1,2})?\s*:\s*([\s\S]*)$/i

  const overviewMatch = raw.match(overviewRegex)
  const recMatch = raw.match(recRegex)

  const overview = overviewMatch && overviewMatch[1] ? overviewMatch[1].trim() : null
  const recommendations = recMatch && recMatch[1] ? recMatch[1].trim() : null

  if (!overview && !recommendations) {
    return { overview: null, recommendations: null, raw, isStructured: false }
  }

  return {
    overview,
    recommendations,
    raw,
    isStructured: true
  }
}

export type UserLevel = 1 | 2 | 3 | 4 | 5

interface AiInsightPanelProps {
  pageId?: string
  metricId?: string
  metricTitle?: string
  initialUserLevel?: UserLevel
  className?: string
}

// 1. DANH SÁCH 4 KHU VỰC CHUẨN XÁC THEO DATABASE (KHÔNG TIỀN TỐ KV)
export const AREAS = [
  { id: 'BinhPB', name: 'BinhPB' },
  { id: 'HuyTH', name: 'HuyTH' },
  { id: 'TAIHD', name: 'TAIHD' },
  { id: 'TANNVN', name: 'TANNVN' }
]

// 2. DANH SÁCH 79 NHÂN VIÊN CHUẨN XÁC THEO BẢNG khu_vuc_nvkt
export const REAL_EMPLOYEES_BY_AREA: Record<string, string[]> = {
  BinhPB: [
    "HUETI.DAOLX", "HUETI.DUYTV4", "HUETI.ANNV8", "HUETI.ANTTV", "HUETI.DANGT",
    "HUETI.DATTVT", "HUETI.DIEUTVQ", "HUETI.DINHTVM", "HUETI.HUONGDQ", "HUETI.KHANHHN",
    "HUETI.MANHNV1", "HUETI.MYNH1", "HUETI.THACHNQ", "HUETI.THANGNV4", "HUETI.THANHTC",
    "HUETI.THAOTQ", "HUETI.THUVB", "HUETI.TINPV", "HUETI.TUANNV36", "HUETI.TUONGNH"
  ],
  HuyTH: [
    "HUETI.QUOCLV1", "HUETI.BAOTBQ", "HUETI.HIEUHC", "HUETI.TUNGTT2", "HUETI.CONGNV2",
    "HUETI.CUONGNM6", "HUETI.CUONGVT3", "HUETI.HOANGDD", "HUETI.HUNGVLT", "HUETI.NAMTVH",
    "HUETI.NAMVV2", "HUETI.PHUOCNH2", "HUETI.THANGNQ1", "HUETI.THANHDN6", "HUETI.THANHNL",
    "HUETI.THUCTV3", "HUETI.TRUNGPHT"
  ],
  TAIHD: [
    "HUETI.ANHNV21", "HUETI.ANTV1", "HUETI.DUCNDM", "HUETI.HIEUPV6", "HUETI.HUUTM",
    "HUETI.HUYCVT", "HUETI.KHANHNP", "HUETI.KHANHNQ9", "HUETI.LANHND", "HUETI.MINHCQ1",
    "HUETI.MINHTV2", "HUETI.MINHVV4", "HUETI.NGHIATH2", "HUETI.NHANTT1", "HUETI.NHUANTD",
    "HUETI.PHUONGTV2", "HUETI.THANHNC18", "HUETI.THAONV1", "HUETI.THUANND9", "HUETI.THUYLT1",
    "HUETI.TUANPM11", "HUETI.VINHTL", "HUETI.YENHH2"
  ],
  TANNVN: [
    "HUETI.ANTT", "HUETI.BAOTT1", "HUETI.BINHCV", "HUETI.BINHNP", "HUETI.HIEUDV4",
    "HUETI.HUYHC", "HUETI.KIENHD", "HUETI.LONGMV", "HUETI.MYPT", "HUETI.NGHIAPNM",
    "HUETI.QUOCLVM", "HUETI.SANGNC3", "HUETI.SINHLV3", "HUETI.SONHT", "HUETI.THANGLCT",
    "HUETI.THANHTC3", "HUETI.TRIHM3", "HUETI.TRUONGDV6", "HUETI.TUTD"
  ]
}

// Danh sách toàn bộ 79 nhân viên (Tổng hợp từ tất cả các khu vực)
export const ALL_REAL_EMPLOYEES: string[] = Array.from(
  new Set(Object.values(REAL_EMPLOYEES_BY_AREA).flat())
).sort()

export default function AiInsightPanel({
  pageId,
  metricId,
  initialUserLevel = 4,
  className = ''
}: AiInsightPanelProps) {
  const pathname = usePathname()

  // 1. STATE PHÂN QUYỀN (RBAC) & BỘ LỌC
  const [userLevel, setUserLevel] = useState<UserLevel>(initialUserLevel)
  const [viewMode, setViewMode] = useState<'personal' | 'regional'>('regional')
  
  // Thiết lập mặc định 'none' ('Không') khi vị trí đó là dropdown
  const [selectedArea, setSelectedArea] = useState<string>(() => {
    return initialUserLevel <= 3 ? 'BinhPB' : 'none'
  })
  const [selectedEmployee, setSelectedEmployee] = useState<string>(() => {
    return initialUserLevel <= 2 ? 'HUETI.DAOLX' : 'none'
  })
  
  const [isExpanded, setIsExpanded] = useState<boolean>(true)

  // Danh sách nhân viên tương ứng với Khu vực đang chọn (Nếu Khu vực = 'none' -> lấy toàn bộ 79 nhân viên)
  const currentAreaEmployees = useMemo(() => {
    if (selectedArea === 'none') {
      return ALL_REAL_EMPLOYEES
    }
    return REAL_EMPLOYEES_BY_AREA[selectedArea] || ALL_REAL_EMPLOYEES
  }, [selectedArea])

  // 1.1 State & Ref cho Searchable Dropdown Chọn Nhân Viên
  const [isEmployeeMenuOpen, setIsEmployeeMenuOpen] = useState<boolean>(false)
  const [employeeSearchQuery, setEmployeeSearchQuery] = useState<string>('')
  const employeeDropdownRef = useRef<HTMLDivElement>(null)
  const employeeInputRef = useRef<HTMLInputElement>(null)

  // 1.2 State & Ref cho Custom Dropdown Chọn Khu Vực
  const [isAreaMenuOpen, setIsAreaMenuOpen] = useState<boolean>(false)
  const areaDropdownRef = useRef<HTMLDivElement>(null)

  // Đóng popover khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (employeeDropdownRef.current && !employeeDropdownRef.current.contains(event.target as Node)) {
        setIsEmployeeMenuOpen(false)
      }
      if (areaDropdownRef.current && !areaDropdownRef.current.contains(event.target as Node)) {
        setIsAreaMenuOpen(false)
      }
    }
    if (isEmployeeMenuOpen || isAreaMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isEmployeeMenuOpen, isAreaMenuOpen])

  // Tự động focus vào ô tìm kiếm khi mở popup (CHỈ áp dụng trên PC, không focus trên mobile để tránh bật bàn phím ảo)
  useEffect(() => {
    if (isEmployeeMenuOpen) {
      const isMobile = typeof window !== 'undefined' && (window.innerWidth < 768 || window.matchMedia('(pointer: coarse)').matches)
      if (!isMobile) {
        setTimeout(() => {
          employeeInputRef.current?.focus()
        }, 50)
      }
    } else {
      setEmployeeSearchQuery('')
    }
  }, [isEmployeeMenuOpen])

  // Danh sách nhân viên sau khi lọc theo từ khóa tìm kiếm (mã NV hoặc tên)
  const filteredEmployees = useMemo(() => {
    const query = employeeSearchQuery.trim().toLowerCase()
    if (!query) return currentAreaEmployees
    return currentAreaEmployees.filter(emp => emp.toLowerCase().includes(query))
  }, [currentAreaEmployees, employeeSearchQuery])

  // Tự động đồng bộ nhân viên khi đổi Khu vực (nếu nhân viên cũ không thuộc khu vực mới và không phải 'none')
  useEffect(() => {
    if (selectedEmployee !== 'none' && !currentAreaEmployees.includes(selectedEmployee)) {
      setSelectedEmployee('none')
    }
  }, [selectedArea, currentAreaEmployees, selectedEmployee])

  // Xử lý đổi User Level: Thiết lập 'none' cho các vị trí có dropdown
  const handleLevelChange = (lvl: UserLevel) => {
    setUserLevel(lvl)
    if (lvl <= 2) {
      // Level 1 & 2: Cố định cả nhân viên và khu vực (không có dropdown)
      setSelectedArea('BinhPB')
      setSelectedEmployee('HUETI.DAOLX')
    } else if (lvl === 3) {
      // Level 3: Khu vực cố định BinhPB, Nhân viên là dropdown -> mặc định 'none'
      setSelectedArea('BinhPB')
      setSelectedEmployee('none')
    } else {
      // Level 4 & 5: Cả 2 đều là dropdown -> mặc định 'none'
      setSelectedArea('none')
      setSelectedEmployee('none')
    }
  }

  // 2. TÍNH TOÁN PAGE ID
  const effectivePageId = useMemo(() => {
    if (pageId) return pageId
    if (metricId) return metricId
    if (pathname) {
      const parts = pathname.split('/').filter(Boolean)
      const lastPart = parts[parts.length - 1]
      if (lastPart && lastPart !== 'thong-so') {
        return lastPart
      }
    }
    return 'tong-hop'
  }, [pageId, metricId, pathname])

  // 3. FETCH DỮ LIỆU AI INSIGHT THẬT
  const [aiText, setAiText] = useState<string>('')
  const [loading, setLoading] = useState<boolean>(false)
  const [error, setError] = useState<string | null>(null)
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false)

  const fetchAiData = useCallback(async (isManual = false) => {
    // Nếu chọn 'Không' -> Hiển thị thông báo hướng dẫn, không fetch
    if (viewMode === 'personal' && selectedEmployee === 'none') {
      setAiText('Vui lòng bấm vào nút "Cá nhân" để chọn nhân viên cần xem phân tích AI.')
      setLoading(false)
      setIsRefreshing(false)
      return
    }

    if (viewMode === 'regional' && selectedArea === 'none') {
      setAiText('Vui lòng bấm vào nút "Khu vực" để chọn khu vực cần xem phân tích AI.')
      setLoading(false)
      setIsRefreshing(false)
      return
    }

    if (isManual) setIsRefreshing(true)
    else setLoading(true)
    setError(null)

    try {
      let url = `/api/ai-insights?page_id=${encodeURIComponent(effectivePageId)}`
      if (viewMode === 'personal') {
        const emp = (userLevel <= 2) ? 'HUETI.DAOLX' : selectedEmployee
        url += `&employee_id=${encodeURIComponent(emp)}`
      } else {
        const area = (userLevel <= 3) ? 'BinhPB' : selectedArea
        url += `&filter_id=${encodeURIComponent(area)}`
      }

      const res = await fetch(url)
      if (!res.ok) throw new Error(`HTTP ${res.status}: Lỗi máy chủ AI`)
      const data = await res.json()

      if (data.success && data.insight_data) {
        setAiText(data.insight_data.tong_quan || 'Chưa có nhận định phân tích từ AI.')
      } else {
        setAiText('Chưa có nhận định phân tích từ AI.')
      }
    } catch (err: any) {
      console.error('[AiInsightPanel] Fetch error:', err)
      setError(err.message || 'Không thể tải phân tích AI')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }, [effectivePageId, viewMode, selectedArea, selectedEmployee, userLevel])

  useEffect(() => {
    fetchAiData()
  }, [fetchAiData])

  // 4. PARSE NỘI DUNG AI THÀNH 2 PHẦN RIÊNG BIỆT (TỔNG QUAN & KHUYẾN NGHỊ)
  const parsedInsight = useMemo(() => {
    return parseAiInsightContent(aiText)
  }, [aiText])

  const renderSectionBody = (content: string, type: 'overview' | 'recommendation') => {
    if (!content) return null
    const lines = content.split('\n').map(l => l.trim()).filter(Boolean)
    const hasBullets = lines.some(l => /^[-*•\d+\.]\s+/.test(l))

    if (hasBullets) {
      return (
        <div className="space-y-1.5 pt-0.5">
          {lines.map((line, idx) => {
            const isBullet = /^[-*•\d+\.]\s+/.test(line)
            const cleanLine = line.replace(/^[-*•\d+\.]\s+/, '')
            if (isBullet) {
              return (
                <div key={idx} className="flex items-start gap-2 text-foreground/90 text-xs sm:text-[13px] leading-relaxed">
                  <span className={`inline-block w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0 ${
                    type === 'overview' ? 'bg-primary' : 'bg-amber-400'
                  }`} />
                  <span>{cleanLine}</span>
                </div>
              )
            }
            return (
              <p key={idx} className="text-foreground/90 text-xs sm:text-[13px] leading-relaxed">
                {line}
              </p>
            )
          })}
        </div>
      )
    }

    return (
      <p className="text-foreground/90 text-xs sm:text-[13px] leading-relaxed whitespace-pre-line pt-0.5">
        {content}
      </p>
    )
  }

  return (
    <div className={`w-full bg-card border border-border/80 rounded-xl shadow-xs select-none transition-all relative z-20 ${className}`}>
      
      {/* 🧭 THANH HEADER TÍCH HỢP: THANH GẠT PHỦ DROPDOWN TOÀN DIỆN */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 bg-muted/40 border-b border-border/70 rounded-t-xl">
        
        {/* Left: Icon & Tiêu đề */}
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-primary/10 text-primary flex-shrink-0">
            <Sparkles className="w-4 h-4" />
          </div>
          <span className="font-extrabold text-xs sm:text-sm text-foreground tracking-tight">
            Phân Tích AI
          </span>
        </div>

        {/* Center: 🎛️ THANH GẠT ĐA NĂNG (DROPDOWN PHỦ TOÀN BỘ NÚT BẤM) */}
        <div className="flex items-center p-0.5 bg-background border border-border rounded-lg shadow-2xs">
          
          {/* NÚT 1: CÁ NHÂN (SEARCHABLE COMBOBOX KHI USER LEVEL >= 3) */}
          <div className="relative flex items-center" ref={employeeDropdownRef}>
            <div 
              onClick={() => {
                setViewMode('personal')
                if (userLevel >= 3) {
                  setIsEmployeeMenuOpen(!isEmployeeMenuOpen)
                  setIsAreaMenuOpen(false)
                }
              }}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                viewMode === 'personal'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <User className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">Cá nhân:</span>
              <span className="font-black truncate max-w-[130px]">
                {userLevel <= 2 ? 'HUETI.DAOLX' : (selectedEmployee === 'none' ? 'Không' : selectedEmployee)}
              </span>
              {userLevel >= 3 && (
                <ChevronDown className={`w-3 h-3 ml-0.5 opacity-70 flex-shrink-0 transition-transform duration-200 ${isEmployeeMenuOpen ? 'rotate-180' : ''}`} />
              )}
            </div>

            {/* POPOVER MENU TÌM KIẾM NHÂN VIÊN */}
            {userLevel >= 3 && isEmployeeMenuOpen && (
              <div className="absolute top-full left-0 mt-1.5 w-64 sm:w-72 bg-card/95 backdrop-blur-2xl border border-border rounded-xl shadow-2xl z-50 p-2 space-y-2 animate-in fade-in-0 zoom-in-95 duration-150">
                
                {/* Thanh tìm kiếm */}
                <div className="relative flex items-center bg-muted/60 border border-border/80 rounded-lg px-2.5 py-1.5 focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/40 transition-all">
                  <Search className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                  <input
                    ref={employeeInputRef}
                    type="text"
                    value={employeeSearchQuery}
                    onChange={(e) => setEmployeeSearchQuery(e.target.value)}
                    placeholder="Tìm mã hoặc tên NV..."
                    className="text-xs bg-transparent text-foreground placeholder:text-muted-foreground outline-none w-full ml-1.5"
                  />
                  {employeeSearchQuery && (
                    <button
                      onClick={() => setEmployeeSearchQuery('')}
                      className="p-0.5 text-muted-foreground hover:text-foreground rounded-sm cursor-pointer"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>

                {/* Thông tin phạm vi khu vực & số lượng */}
                <div className="flex items-center justify-between px-1 text-[10px] text-muted-foreground font-semibold">
                  <span className="truncate max-w-[170px]">
                    Phạm vi: <strong className="text-foreground">{selectedArea === 'none' ? 'Tất cả NV' : selectedArea}</strong>
                  </span>
                  <span className="bg-primary/10 text-primary px-1.5 py-0.2 rounded-full font-bold flex-shrink-0">
                    {filteredEmployees.length} NV
                  </span>
                </div>

                {/* Danh sách cuộn */}
                <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1 custom-scrollbar">
                  
                  {/* Tùy chọn: Không */}
                  <button
                    onClick={() => {
                      setSelectedEmployee('none')
                      setViewMode('personal')
                      setIsEmployeeMenuOpen(false)
                    }}
                    className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                      selectedEmployee === 'none'
                        ? 'bg-primary/20 text-primary font-bold border border-primary/30'
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <span>-- Không chọn nhân viên --</span>
                    {selectedEmployee === 'none' && <Check className="w-3.5 h-3.5 text-primary" />}
                  </button>

                  <div className="border-t border-border/50 my-1" />

                  {/* Danh sách nhân viên đã lọc */}
                  {filteredEmployees.length === 0 ? (
                    <div className="py-4 text-center text-xs text-muted-foreground">
                      Không tìm thấy nhân viên phù hợp
                    </div>
                  ) : (
                    filteredEmployees.map((emp) => {
                      const isSelected = selectedEmployee === emp
                      return (
                        <button
                          key={emp}
                          onClick={() => {
                            setSelectedEmployee(emp)
                            setViewMode('personal')
                            setIsEmployeeMenuOpen(false)
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                            isSelected
                              ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                              : 'text-foreground/90 hover:bg-muted hover:text-foreground'
                          }`}
                        >
                          <span className="font-medium truncate">{emp}</span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground" />}
                        </button>
                      )
                    })
                  )}
                </div>

              </div>
            )}
          </div>

          {/* NÚT 2: KHU VỰC (CUSTOM POPOVER KHI USER LEVEL >= 4) */}
          <div className="relative flex items-center" ref={areaDropdownRef}>
            <div 
              onClick={() => {
                setViewMode('regional')
                if (userLevel >= 4) {
                  setIsAreaMenuOpen(!isAreaMenuOpen)
                  setIsEmployeeMenuOpen(false)
                }
              }}
              className={`relative flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-md transition-all cursor-pointer ${
                viewMode === 'regional'
                  ? 'bg-primary text-primary-foreground shadow-xs'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              }`}
            >
              <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
              <span className="whitespace-nowrap">Khu vực:</span>
              <span className="font-black truncate max-w-[130px]">
                {userLevel <= 3 
                  ? 'BinhPB' 
                  : (selectedArea === 'none' ? 'Không' : (AREAS.find(a => a.id === selectedArea)?.name || selectedArea))}
              </span>
              {userLevel >= 4 && (
                <ChevronDown className={`w-3 h-3 ml-0.5 opacity-70 flex-shrink-0 transition-transform duration-200 ${isAreaMenuOpen ? 'rotate-180' : ''}`} />
              )}
            </div>

            {/* POPOVER MENU CHỌN KHU VỰC */}
            {userLevel >= 4 && isAreaMenuOpen && (
              <div className="absolute top-full right-0 sm:left-0 sm:right-auto mt-1.5 w-56 sm:w-64 bg-card/95 backdrop-blur-2xl border border-border rounded-xl shadow-2xl z-50 p-2 space-y-1.5 animate-in fade-in-0 zoom-in-95 duration-150">
                
                <div className="px-2 py-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
                  <span>Danh sách khu vực</span>
                  <span className="bg-primary/10 text-primary px-1.5 py-0.2 rounded-full font-bold">{AREAS.length} KV</span>
                </div>

                {/* Tùy chọn: Không */}
                <button
                  onClick={() => {
                    setSelectedArea('none')
                    setViewMode('regional')
                    setIsAreaMenuOpen(false)
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                    selectedArea === 'none'
                      ? 'bg-primary/20 text-primary font-bold border border-primary/30'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                  }`}
                >
                  <span>-- Không chọn khu vực --</span>
                  {selectedArea === 'none' && <Check className="w-3.5 h-3.5 text-primary" />}
                </button>

                <div className="border-t border-border/50 my-1" />

                {/* Danh sách 4 khu vực */}
                <div className="space-y-1">
                  {AREAS.map((a) => {
                    const isSelected = selectedArea === a.id
                    const empCount = REAL_EMPLOYEES_BY_AREA[a.id]?.length || 0
                    return (
                      <button
                        key={a.id}
                        onClick={() => {
                          setSelectedArea(a.id)
                          setViewMode('regional')
                          setIsAreaMenuOpen(false)
                        }}
                        className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-primary text-primary-foreground font-bold shadow-2xs'
                            : 'text-foreground/90 hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <Building2 className={`w-3.5 h-3.5 ${isSelected ? 'text-primary-foreground' : 'text-primary'}`} />
                          <span className="font-bold">{a.name}</span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-semibold ${
                            isSelected ? 'bg-primary-foreground/20 text-primary-foreground' : 'bg-muted text-muted-foreground'
                          }`}>
                            {empCount} NV
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-primary-foreground ml-0.5" />}
                        </div>
                      </button>
                    )
                  })}
                </div>

              </div>
            )}
          </div>

        </div>

        {/* Right: Bộ chọn giả lập Level & Nút công cụ */}
        <div className="flex items-center gap-1.5">
          
          {/* Bộ Tester User Level */}
          <div className="flex items-center gap-0.5 bg-background border border-border p-0.5 rounded-lg">
            <span className="text-[9px] font-bold text-muted-foreground px-1 hidden sm:inline flex items-center gap-1">
              <Shield className="w-2.5 h-2.5 text-primary" />
              Level:
            </span>
            {([1, 2, 3, 4, 5] as UserLevel[]).map((lvl) => {
              const isActive = userLevel === lvl
              return (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => handleLevelChange(lvl)}
                  className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${
                    isActive
                      ? 'bg-primary text-primary-foreground font-black shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                  title={`Chuyển sang User Level ${lvl}`}
                >
                  L{lvl}
                </button>
              )
            })}
          </div>

          {/* Làm mới */}
          <button
            onClick={() => fetchAiData(true)}
            disabled={loading || isRefreshing}
            className={`p-1 text-muted-foreground hover:text-foreground transition-all cursor-pointer ${
              isRefreshing || loading ? 'animate-spin text-primary' : ''
            }`}
            title="Làm mới phân tích"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>

          {/* Thu gọn / Mở rộng */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            title={isExpanded ? "Thu gọn" : "Mở rộng"}
          >
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>

        </div>

      </div>

      {/* 📝 NỘI DUNG NHẬN ĐỊNH AI THẬT: TINH GỌN, CHỈ HIỂN THỊ VĂN BẢN TRỰC TIẾP */}
      {isExpanded && (
        <div className="p-3 sm:p-4 bg-background/50 animate-in slide-in-from-top-1 duration-150 rounded-b-xl">
          
          {loading && (
            <div className="space-y-2 p-3 bg-card/40 border border-border/60 rounded-lg animate-pulse">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                <span className="text-xs text-primary font-medium">
                  Đang tải nhận định AI...
                </span>
              </div>
              <div className="h-3 w-full bg-muted rounded" />
              <div className="h-3 w-4/5 bg-muted rounded" />
            </div>
          )}

          {!loading && error && (
            <div className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-400 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => fetchAiData(true)}
                className="px-2 py-0.5 bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 rounded text-[10px] font-bold"
              >
                Thử lại
              </button>
            </div>
          )}

          {!loading && !error && (
            <>
              {parsedInsight.isStructured ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5 sm:gap-3">
                  
                  {/* 📊 1. KHỐI TỔNG QUAN */}
                  {parsedInsight.overview && (
                    <div className="relative flex flex-col p-3 sm:p-3.5 rounded-xl bg-card border border-primary/25 shadow-xs overflow-hidden group hover:border-primary/45 transition-all">
                      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-border/50">
                        <div className="p-1 rounded-md bg-primary/10 text-primary border border-primary/20 flex items-center justify-center flex-shrink-0">
                          <BarChart3 className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-primary">
                            Tổng Quan Tình Hình
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        {renderSectionBody(parsedInsight.overview, 'overview')}
                      </div>
                    </div>
                  )}

                  {/* 🎯 2. KHỐI KHUYẾN NGHỊ */}
                  {parsedInsight.recommendations && (
                    <div className="relative flex flex-col p-3 sm:p-3.5 rounded-xl bg-card border border-amber-500/30 shadow-xs overflow-hidden group hover:border-amber-500/50 transition-all">
                      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-border/50">
                        <div className="p-1 rounded-md bg-amber-500/10 text-amber-400 border border-amber-500/25 flex items-center justify-center flex-shrink-0">
                          <Target className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] sm:text-xs font-black uppercase tracking-wider text-amber-400">
                            Khuyến Nghị Hành Động
                          </span>
                        </div>
                      </div>
                      <div className="flex-1">
                        {renderSectionBody(parsedInsight.recommendations, 'recommendation')}
                      </div>
                    </div>
                  )}

                </div>
              ) : (
                <div className="p-3 sm:p-3.5 rounded-lg bg-card border border-border/80 text-xs sm:text-sm text-foreground/95 leading-relaxed shadow-2xs">
                  <p className="text-foreground/95 leading-relaxed whitespace-pre-line">
                    {aiText || 'Chưa có nhận định từ AI cho đối tượng này.'}
                  </p>
                </div>
              )}
            </>
          )}

        </div>
      )}

    </div>
  )
}
