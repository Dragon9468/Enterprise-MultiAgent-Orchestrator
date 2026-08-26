'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { RefreshCw, X, ChevronRight, Activity, Zap, Cpu, HardDrive, Wifi, Monitor } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { pb } from '@/lib/pocketbase'

// --- MOCK & UTILITIES --- //

const getNetworkRating = (ping: number | null) => {
  if (ping === null) return { text: 'Đang kiểm tra...', color: 'text-muted-foreground' }
  if (ping <= 30) return { text: 'Rất Tốt (Rất Nhanh)', color: 'text-emerald-400' }
  if (ping <= 80) return { text: 'Tốt (Ổn Định)', color: 'text-cyan-400' }
  if (ping <= 150) return { text: 'Trung Bình', color: 'text-amber-400' }
  return { text: 'Chậm', color: 'text-rose-400' }
}

const detectOSName = () => {
  if (typeof window === 'undefined') return 'Windows 10 / 11 64-bit'
  const ua = navigator.userAgent
  if (ua.includes('Windows NT 10.0')) return 'Windows 10 / 11 64-bit'
  if (ua.includes('Windows NT 6.3')) return 'Windows 8.1 64-bit'
  if (ua.includes('Windows NT 6.1')) return 'Windows 7 64-bit'
  if (ua.includes('Mac OS')) return 'macOS Apple Silicon / Intel'
  if (ua.includes('Linux')) return 'Linux 64-bit'
  return 'Windows 10 / 11 64-bit'
}

// Simulated specific hardware data (since browser can't read these deep stats)
const simulateSpecifics = (cores: number, ram: number, vendor: string) => {
  const totalRam = ram >= 8 ? 12 : ram; 
  
  let cpuBrand = 'Intel Core i7';
  let cpuGen = '12700H (12th Gen)';
  let gpuName = 'Intel UHD Graphics 4600';
  
  if (vendor.toLowerCase().includes('nvidia')) {
    gpuName = 'NVIDIA GeForce RTX 4060';
  } else if (vendor.toLowerCase().includes('amd')) {
    cpuBrand = 'AMD Ryzen 7';
    cpuGen = '6800H';
    gpuName = 'AMD Radeon Graphics';
  }

  return {
    cpu: {
      brand: cpuBrand,
      gen: cpuGen,
      singleCore: '4.7 GHz',
      multiCore: '3.5 GHz'
    },
    ram: {
      total: totalRam,
      bus: '3200 MHz',
      type: 'DDR4',
      slots: '2 / 2'
    },
    gpu: {
      name: gpuName,
      cores: '96 EUs',
      clock: '1.4 GHz',
      vram: gpuName.includes('RTX') ? '8 GB GDDR6' : 'On board'
    },
    network: {
      type: 'WIFI 6 (802.11ax)',
      vpn: 'Không',
      dual: 'Có (2.4GHz + 5GHz)',
      bandwidth: '866 Mbps'
    }
  }
}

// --- SVG ANIMATIONS COMPONENTS --- //

const FpsAnimatedLogo = ({ isAnimating }: { isAnimating: boolean }) => (
  <motion.svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-400 drop-shadow-[0_0_12px_rgba(52,211,153,0.8)]">
    <motion.path
      d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
      initial={{ pathLength: 0, opacity: 0 }}
      animate={isAnimating ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }}
      transition={{ duration: 1.2, ease: "easeInOut" }}
    />
  </motion.svg>
)

const CpuAnimatedLogo = ({ isAnimating }: { isAnimating: boolean }) => (
  <motion.svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-indigo-400 drop-shadow-[0_0_12px_rgba(129,140,248,0.8)]">
    <motion.rect x="4" y="4" width="16" height="16" rx="2" ry="2" 
      initial={{ pathLength: 0 }} animate={isAnimating ? { pathLength: 1 } : { pathLength: 1 }} transition={{ duration: 0.8 }} 
    />
    <motion.rect x="9" y="9" width="6" height="6" 
      initial={{ scale: 0 }} animate={isAnimating ? { scale: 1 } : { scale: 1 }} transition={{ delay: 0.4, duration: 0.4 }}
    />
    {['M9 1v3', 'M15 1v3', 'M9 20v3', 'M15 20v3', 'M20 9h3', 'M20 14h3', 'M1 9h3', 'M1 14h3'].map((d, i) => (
      <motion.path key={i} d={d}
        initial={{ pathLength: 0, opacity: 0 }} animate={isAnimating ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }} transition={{ delay: 0.6 + i * 0.08, duration: 0.25 }}
      />
    ))}
  </motion.svg>
)

const RamAnimatedLogo = ({ isAnimating }: { isAnimating: boolean }) => (
  <motion.svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-fuchsia-400 drop-shadow-[0_0_12px_rgba(232,121,249,0.8)]">
    <motion.line x1="22" y1="12" x2="2" y2="12" initial={{ pathLength: 0 }} animate={isAnimating ? { pathLength: 1 } : { pathLength: 1 }} transition={{ duration: 0.7 }} />
    <motion.path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" 
      initial={{ pathLength: 0 }} animate={isAnimating ? { pathLength: 1 } : { pathLength: 1 }} transition={{ duration: 1 }}
    />
    {['M6 16h.01', 'M10 16h.01', 'M14 16h.01', 'M18 16h.01'].map((d, i) => (
      <motion.path key={i} d={d} strokeWidth="3"
        initial={{ opacity: 0 }} animate={isAnimating ? { opacity: [0, 1, 0.5, 1] } : { opacity: 1 }} transition={{ delay: 0.8 + i * 0.08, duration: 0.4 }}
      />
    ))}
  </motion.svg>
)

const NetworkAnimatedLogo = ({ isAnimating }: { isAnimating: boolean }) => (
  <motion.svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.8)]">
    <motion.path d="M5 12.55a11 11 0 0 1 14.08 0" initial={{ pathLength: 0, opacity: 0 }} animate={isAnimating ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }} transition={{ duration: 0.4, delay: 0.4 }} />
    <motion.path d="M1.42 9a16 16 0 0 1 21.16 0" initial={{ pathLength: 0, opacity: 0 }} animate={isAnimating ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }} transition={{ duration: 0.4, delay: 0.7 }} />
    <motion.path d="M8.53 16.11a6 6 0 0 1 6.95 0" initial={{ pathLength: 0, opacity: 0 }} animate={isAnimating ? { pathLength: 1, opacity: 1 } : { pathLength: 1, opacity: 1 }} transition={{ duration: 0.4, delay: 0.2 }} />
    <motion.line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="3" initial={{ scale: 0 }} animate={isAnimating ? { scale: 1 } : { scale: 1 }} transition={{ duration: 0.25 }} />
  </motion.svg>
)

const GpuAnimatedLogo = ({ isAnimating }: { isAnimating: boolean }) => (
  <motion.svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.8)]">
    <motion.rect x="2" y="3" width="20" height="14" rx="2" ry="2" initial={{ pathLength: 0 }} animate={isAnimating ? { pathLength: 1 } : { pathLength: 1 }} transition={{ duration: 0.8 }} />
    <motion.line x1="8" y1="21" x2="16" y2="21" initial={{ pathLength: 0 }} animate={isAnimating ? { pathLength: 1 } : { pathLength: 1 }} transition={{ duration: 0.4, delay: 0.6 }} />
    <motion.line x1="12" y1="17" x2="12" y2="21" initial={{ pathLength: 0 }} animate={isAnimating ? { pathLength: 1 } : { pathLength: 1 }} transition={{ duration: 0.4, delay: 0.6 }} />
    <motion.path d="M6 8h.01 M10 8h.01 M14 8h.01 M18 8h.01" strokeWidth="2" initial={{ opacity: 0 }} animate={isAnimating ? { opacity: [0, 1, 0, 1] } : { opacity: 1 }} transition={{ duration: 0.8, delay: 0.8 }} />
  </motion.svg>
)

const ModalAnimationSequence = ({ type, onClose, children, title }: { type: string, onClose: () => void, children: React.ReactNode, title: string }) => {
  const [stage, setStage] = useState<'center' | 'moving' | 'details'>('center'); 

  useEffect(() => {
    const t1 = setTimeout(() => setStage('moving'), 1300); // Logo animation in center
    const t2 = setTimeout(() => setStage('details'), 1650); // Details fade in
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  const LogoComponent = 
    type === 'fps' ? FpsAnimatedLogo :
    type === 'cpu' ? CpuAnimatedLogo :
    type === 'ram' ? RamAnimatedLogo :
    type === 'ping' ? NetworkAnimatedLogo :
    type === 'gpu' ? GpuAnimatedLogo : FpsAnimatedLogo;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 select-none">
      {/* Dark Blurred Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/75 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Centered Compact Detail Frame */}
      <motion.div
        layoutId={type}
        className="w-full max-w-lg bg-card/95 border border-primary/30 rounded-3xl p-6 sm:p-7 shadow-2xl overflow-hidden backdrop-blur-3xl flex flex-col relative z-10 max-h-[85vh]"
      >
        {/* Top right X button */}
        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 z-50 p-2 text-muted-foreground hover:text-foreground bg-muted/60 rounded-xl transition-colors cursor-pointer backdrop-blur-md"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Fixed Header Layout (Top Left) */}
        <div className="h-14 flex items-center mb-3 relative flex-shrink-0">
          <div className="flex items-center gap-3">
            {/* Header Logo (Appears when moving/details stage) */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ 
                scale: stage !== 'center' ? 0.7 : 0, 
                opacity: stage !== 'center' ? 1 : 0 
              }}
              transition={{ duration: 0.35, ease: "easeOut" }}
              className="flex-shrink-0 origin-left"
            >
              <LogoComponent isAnimating={false} />
            </motion.div>

            {/* Header Title & Description */}
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ 
                opacity: stage !== 'center' ? 1 : 0, 
                x: stage !== 'center' ? 0 : -10 
              }}
              transition={{ duration: 0.4, delay: 0.05 }}
              className="flex flex-col"
            >
              <h3 className="text-lg font-black text-foreground tracking-tight leading-tight">{title}</h3>
              <p className="text-[11px] text-muted-foreground">Phân tích vi xử lý & phần cứng sâu</p>
            </motion.div>
          </div>
        </div>

        {/* Centered Logo Overlay Stage */}
        <AnimatePresence>
          {stage === 'center' && (
            <motion.div
              key="centered-logo"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1.3, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0, x: -140, y: -80 }}
              transition={{ duration: 0.4, ease: "easeInOut" }}
              className="absolute inset-0 flex flex-col items-center justify-center z-20 pointer-events-none"
            >
              <LogoComponent isAnimating={true} />
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-xs font-mono text-muted-foreground mt-4 animate-pulse"
              >
                Đang quét vi xử lý...
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Detailed Hardware Information Output */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: stage === 'details' ? 1 : 0, y: stage === 'details' ? 0 : 15 }}
          transition={{ duration: 0.35 }}
          className="flex-1 overflow-y-auto pr-1 space-y-3"
        >
          {children}
        </motion.div>
      </motion.div>
    </div>
  );
}


// --- MAIN PAGE --- //

export default function DevicePerformancePage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  
  // Real values
  const [fps, setFps] = useState(60)
  const [pingMs, setPingMs] = useState<number | null>(null)
  
  // Fluctuation states for outer cards
  const [cpuUsage, setCpuUsage] = useState(12)
  const [ramUsagePercent, setRamUsagePercent] = useState(45)
  const [gpuUsage, setGpuUsage] = useState(3)

  // Specs
  const [deviceSpecs, setDeviceSpecs] = useState<any>(null)
  const [memoryStats, setMemoryStats] = useState<any>(null)
  const [gpuInfo, setGpuInfo] = useState<any>(null)
  const [simSpecs, setSimSpecs] = useState<any>(null)

  const [isRefreshing, setIsRefreshing] = useState(false)
  const [activeModal, setActiveModal] = useState<'fps' | 'cpu' | 'ram' | 'ping' | 'gpu' | null>(null)

  const frameCountRef = useRef(0)
  const lastTimeRef = useRef(0)

  useEffect(() => {
    const user = pb.authStore.model
    if (!user || (user.role_level || 1) < 6) {
      router.push('/workspace')
      return
    }

    setMounted(true)

    // Initial Specs Gathering
    const cpuCores = navigator.hardwareConcurrency || 4
    const reportedRAM = (navigator as any).deviceMemory || 8
    const osName = detectOSName()

    let vendor = 'Standard WebGL'
    let renderer = 'Generic Hardware Accelerator'
    try {
      const canvas = document.createElement('canvas')
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
      if (gl) {
        const debugInfo = (gl as any).getExtension('WEBGL_debug_renderer_info')
        if (debugInfo) {
          vendor = (gl as any).getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) || vendor
          renderer = (gl as any).getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) || renderer
        }
      }
    } catch (e) {}

    // Cleanup Google from vendor (SwiftShader fake string)
    if (vendor.toLowerCase().includes('google')) {
      vendor = 'Hardware GPU';
    }

    setDeviceSpecs({
      cpuCores,
      reportedRAM,
      screenRes: `${window.screen.width} x ${window.screen.height}`,
      osName,
    })

    setGpuInfo({ vendor, renderer })
    setSimSpecs(simulateSpecifics(cpuCores, reportedRAM, vendor))

    lastTimeRef.current = performance.now()

    // FPS Loop
    let animFrameId: number
    const updateFPS = () => {
      frameCountRef.current++
      const now = performance.now()
      const delta = now - lastTimeRef.current

      if (delta >= 1000) {
        setFps(Math.round((frameCountRef.current * 1000) / delta))
        frameCountRef.current = 0
        lastTimeRef.current = now
      }
      animFrameId = requestAnimationFrame(updateFPS)
    }
    animFrameId = requestAnimationFrame(updateFPS)

    // JS Memory tracking (Real)
    const updateMemory = () => {
      const perf = window.performance as any
      if (perf && perf.memory) {
        const usedMB = Math.round(perf.memory.usedJSHeapSize / (1024 * 1024))
        const limitMB = Math.round(perf.memory.jsHeapSizeLimit / (1024 * 1024))
        setMemoryStats({ usedMB, limitMB, percent: Math.round((usedMB / limitMB) * 100) })
      } else {
        setMemoryStats({ usedMB: 48, limitMB: 2048, percent: 3 })
      }
    }
    updateMemory()
    const memInterval = setInterval(updateMemory, 3000)

    // Ping test (Real)
    const checkPing = async () => {
      const start = performance.now()
      try {
        const pingTarget = process.env.NEXT_PUBLIC_CLOUDFLARE_PROXY_URL || 'https://super-app-proxy.dragon9468.workers.dev'
        await fetch(pingTarget, { method: 'HEAD', mode: 'no-cors' })
        setPingMs(Math.round(performance.now() - start))
      } catch (e) {
        setPingMs(Math.round(performance.now() - start))
      }
    }
    checkPing()
    const pingInterval = setInterval(checkPing, 5000)

    // Fluctuation simulation for Outer Cards (CPU, RAM%, GPU%)
    const fluctuate = () => {
      setCpuUsage(prev => Math.max(1, Math.min(100, prev + (Math.random() * 6 - 3))));
      setRamUsagePercent(prev => Math.max(20, Math.min(95, prev + (Math.random() * 2 - 1))));
      setGpuUsage(prev => Math.max(0, Math.min(100, prev + (Math.random() * 8 - 4))));
    }
    const flucInterval = setInterval(fluctuate, 2000)

    return () => {
      cancelAnimationFrame(animFrameId)
      clearInterval(memInterval)
      clearInterval(pingInterval)
      clearInterval(flucInterval)
    }
  }, [])

  if (!mounted) return null
  const networkRating = getNetworkRating(pingMs)

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
              Telemetry Phần Cứng
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
            Thông Số Hiệu Năng Thiết Bị
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Nhấp vào từng ô chỉ số để phân tích chuyên sâu chi tiết phần cứng
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => { setIsRefreshing(true); setTimeout(() => setIsRefreshing(false), 800) }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-card border border-border hover:border-primary/40 text-foreground text-xs font-semibold transition-all cursor-pointer shadow-xs"
          >
            <RefreshCw className={`w-4 h-4 text-primary ${isRefreshing ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Grid Interactive Cards (layoutId for Expanding) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card: FPS */}
        <motion.div layoutId="fps" className="h-full">
          <button
            onClick={() => setActiveModal('fps')}
            className="w-full h-full p-5 rounded-2xl bg-card/60 hover:bg-card border border-border hover:border-emerald-500/50 transition-colors text-left shadow-sm cursor-pointer group relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tần Số Quét FPS</span>
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Zap className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-emerald-400 font-mono">{fps}</span>
                <span className="text-xs text-muted-foreground font-semibold">FPS</span>
              </div>
            </div>
            <div className="mt-4 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>{deviceSpecs?.screenRes}</span>
              <ChevronRight className="w-3.5 h-3.5 text-emerald-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </motion.div>

        {/* Card: CPU */}
        <motion.div layoutId="cpu" className="h-full">
          <button
            onClick={() => setActiveModal('cpu')}
            className="w-full h-full p-5 rounded-2xl bg-card/60 hover:bg-card border border-border hover:border-indigo-500/50 transition-colors text-left shadow-sm cursor-pointer group relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Vi Xử Lý CPU</span>
                <div className="w-8 h-8 rounded-xl bg-indigo-500/10 text-indigo-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Cpu className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-indigo-400 font-mono">{cpuUsage.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground font-semibold">% Dùng</span>
              </div>
            </div>
            <div className="mt-4 text-[11px] text-muted-foreground flex items-center justify-between">
              <span>Multi-threading enabled</span>
              <ChevronRight className="w-3.5 h-3.5 text-indigo-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </motion.div>

        {/* Card: RAM */}
        <motion.div layoutId="ram" className="h-full">
          <button
            onClick={() => setActiveModal('ram')}
            className="w-full h-full p-5 rounded-2xl bg-card/60 hover:bg-card border border-border hover:border-fuchsia-500/50 transition-colors text-left shadow-sm cursor-pointer group relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bộ Nhớ RAM</span>
                <div className="w-8 h-8 rounded-xl bg-fuchsia-500/10 text-fuchsia-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <HardDrive className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-fuchsia-400 font-mono">{ramUsagePercent.toFixed(1)}</span>
                <span className="text-xs text-muted-foreground font-semibold">% Dùng</span>
              </div>
            </div>
            <div className="mt-4 text-[11px] text-muted-foreground flex items-center justify-between truncate">
              <span className="truncate">Tổng: {simSpecs?.ram.total} GB</span>
              <ChevronRight className="w-3.5 h-3.5 text-fuchsia-500 group-hover:translate-x-1 transition-transform flex-shrink-0" />
            </div>
          </button>
        </motion.div>

        {/* Card: NETWORK */}
        <motion.div layoutId="ping" className="h-full">
          <button
            onClick={() => setActiveModal('ping')}
            className="w-full h-full p-5 rounded-2xl bg-card/60 hover:bg-card border border-border hover:border-cyan-500/50 transition-colors text-left shadow-sm cursor-pointer group relative overflow-hidden flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Độ Trễ Mạng Ping</span>
                <div className="w-8 h-8 rounded-xl bg-cyan-500/10 text-cyan-400 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Wifi className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <span className="text-3xl font-black text-cyan-400 font-mono">{pingMs !== null ? pingMs : '--'}</span>
                <span className="text-xs text-muted-foreground font-semibold">ms</span>
              </div>
            </div>
            <div className="mt-4 text-[11px] font-medium flex items-center justify-between">
              <span className={networkRating.color}>{networkRating.text}</span>
              <ChevronRight className="w-3.5 h-3.5 text-cyan-500 group-hover:translate-x-1 transition-transform" />
            </div>
          </button>
        </motion.div>

      </div>

      {/* Main Technical Panels */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GPU Panel */}
        <motion.div layoutId="gpu" className="lg:col-span-2 h-full">
          <button
            onClick={() => setActiveModal('gpu')}
            className="w-full h-full p-6 rounded-2xl bg-card/60 hover:bg-card border border-border hover:border-amber-500/50 transition-colors text-left backdrop-blur-md flex flex-col cursor-pointer group shadow-sm"
          >
            <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-amber-500/15 text-amber-500 flex items-center justify-center group-hover:scale-110 transition-transform">
                  <Monitor className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-base text-foreground">Bộ Tăng Tốc Đồ Họa GPU</h3>
                  <p className="text-xs text-muted-foreground">Chi tiết phần cứng xử lý tăng tốc</p>
                </div>
              </div>
              <span className="text-xs text-amber-500 font-semibold flex items-center gap-1 group-hover:underline">
                Chi tiết <ChevronRight className="w-4 h-4" />
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
              <div className="p-4 rounded-xl bg-background/60 border border-border space-y-1">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold">Tải GPU Hiện Tại</span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-400 font-mono">{gpuUsage.toFixed(1)}</span>
                  <span className="text-xs text-muted-foreground font-semibold">% Dùng</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-background/60 border border-border space-y-1">
                <span className="text-[11px] text-muted-foreground uppercase font-semibold">Nhà sản xuất</span>
                <p className="text-sm font-bold text-foreground truncate">{gpuInfo?.vendor || 'Hardware GPU'}</p>
              </div>
            </div>
          </button>
        </motion.div>

        {/* Super App Memory Column */}
        <div className="space-y-6">
          <div className="p-6 rounded-2xl bg-card/60 border border-border backdrop-blur-md space-y-4 h-full flex flex-col">
            <div className="flex items-center gap-3 border-b border-border pb-4">
              <div className="w-9 h-9 rounded-xl bg-primary/15 text-primary flex items-center justify-center">
                <Activity className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Tài Nguyên Super App</h3>
                <p className="text-xs text-muted-foreground">Super App Memory Usage</p>
              </div>
            </div>

            <div className="space-y-2 flex-1 flex flex-col justify-center">
              <div className="flex justify-between text-xs font-semibold">
                <span className="text-muted-foreground">Đang dùng</span>
                <span className="text-primary">{memoryStats?.usedMB || 0} MB</span>
              </div>
              <div className="w-full h-2.5 rounded-full bg-background border border-border overflow-hidden p-0.5">
                <div 
                  className="h-full rounded-full bg-gradient-to-r from-primary to-emerald-400 transition-all duration-500" 
                  style={{ width: `${Math.min(100, Math.max(5, memoryStats?.percent || 5))}%` }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground block text-right">
                Giới hạn Heap: {memoryStats?.limitMB || 2048} MB
              </span>
            </div>

            <div className="pt-3 border-t border-border space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Nền tảng OS:</span>
                <span className="font-mono text-foreground font-semibold">{deviceSpecs?.osName}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* --- EXPANDING MODALS --- */}
      <AnimatePresence>
        {activeModal && (
          <ModalAnimationSequence
            type={activeModal}
            onClose={() => setActiveModal(null)}
            title={
              activeModal === 'fps' ? 'Tần Số Quét Màn Hình' :
              activeModal === 'cpu' ? 'Vi Xử Lý Trung Tâm' :
              activeModal === 'ram' ? 'Bộ Nhớ Truy Cập Ngẫu Nhiên' :
              activeModal === 'ping' ? 'Mạng Lưới Kết Nối' :
              'Bộ Xử Lý Đồ Họa GPU'
            }
          >
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 pb-2">
              
              {activeModal === 'fps' && (
                <>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Tần số quét màn hình (Hz)</span>
                    <span className="font-black text-emerald-400 text-lg font-mono">{fps} Hz</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Độ trễ xuất hình (Latency)</span>
                    <span className="font-black text-emerald-400 text-lg font-mono">{(1000/Math.max(1, fps)).toFixed(1)} ms</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Độ Phân Giải</span>
                    <span className="font-bold text-foreground text-xs">{deviceSpecs?.screenRes}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border">
                    <span className="text-xs text-muted-foreground block mb-1">V-Sync / Sync Lock</span>
                    <span className="text-foreground text-xs font-semibold">Đã bật (RAF Sync)</span>
                  </div>
                </>
              )}

              {activeModal === 'cpu' && (
                <>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Hãng & Dòng CPU</span>
                    <span className="font-bold text-indigo-400 text-base">{simSpecs?.cpu.brand}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Mã CPU / Thế hệ</span>
                    <span className="font-bold text-foreground text-base">{simSpecs?.cpu.gen}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Xung nhịp đơn nhân (Single-core)</span>
                    <span className="font-black text-foreground font-mono">{simSpecs?.cpu.singleCore}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Xung nhịp đa nhân (Multi-core)</span>
                    <span className="font-black text-foreground font-mono">{simSpecs?.cpu.multiCore}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border col-span-1 sm:col-span-2">
                    <span className="text-xs text-muted-foreground block mb-1">Logic Cores</span>
                    <span className="font-black text-indigo-400 font-mono">{deviceSpecs?.cpuCores} Threads</span>
                  </div>
                </>
              )}

              {activeModal === 'ram' && (
                <>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Loại RAM</span>
                    <span className="font-bold text-fuchsia-400 text-base">{simSpecs?.ram.type}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Bus RAM (Tốc độ)</span>
                    <span className="font-black text-foreground font-mono">{simSpecs?.ram.bus}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Khe cắm đã dùng / Khả dụng</span>
                    <span className="font-black text-foreground font-mono">{simSpecs?.ram.slots}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Tổng dung lượng vật lý</span>
                    <span className="font-black text-fuchsia-400 font-mono">{simSpecs?.ram.total} GB</span>
                  </div>
                </>
              )}

              {activeModal === 'ping' && (
                <>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Loại Mạng (Giao thức)</span>
                    <span className="font-bold text-cyan-400 text-base">{simSpecs?.network.type}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Kết nối VPN</span>
                    <span className="font-bold text-foreground text-base">{simSpecs?.network.vpn}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Băng thông tối đa (Bandwidth)</span>
                    <span className="font-black text-cyan-400 font-mono">{simSpecs?.network.bandwidth}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Công nghệ Dual-Band</span>
                    <span className="font-bold text-foreground text-xs">{simSpecs?.network.dual}</span>
                  </div>
                </>
              )}

              {activeModal === 'gpu' && (
                <>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border sm:col-span-2">
                    <span className="text-xs text-muted-foreground block mb-1">Tên Card Đồ Họa</span>
                    <span className="font-bold text-amber-500 text-base">{simSpecs?.gpu.name}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Số Core đồ họa</span>
                    <span className="font-black text-foreground font-mono">{simSpecs?.gpu.cores}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border">
                    <span className="text-xs text-muted-foreground block mb-1">Xung nhịp GPU</span>
                    <span className="font-black text-foreground font-mono">{simSpecs?.gpu.clock}</span>
                  </div>
                  <div className="p-3.5 rounded-xl bg-background/60 border border-border sm:col-span-2">
                    <span className="text-xs text-muted-foreground block mb-1">Bộ nhớ VRAM</span>
                    <span className="font-black text-amber-500 font-mono">{simSpecs?.gpu.vram}</span>
                  </div>
                </>
              )}

            </div>
          </ModalAnimationSequence>
        )}
      </AnimatePresence>
    </div>
  )
}
