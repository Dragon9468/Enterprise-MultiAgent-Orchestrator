'use client'

import { useTheme } from 'next-themes'
import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { 
  Palette, X, RotateCw, RotateCcw, Check, Sparkles, Keyboard, 
  MousePointer, Smartphone, Gamepad2, ChevronLeft, ChevronRight 
} from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { THEMES, ThemeOption, isLightColor } from '@/lib/themes'

const CATEGORIES: ('Light' | 'Dark' | 'Gradient' | 'Classic')[] = ['Light', 'Dark', 'Gradient', 'Classic']

// OPTIMIZED WEB AUDIO SYNTHESIZER ENGINE WITH SINGLETON AUDIO CONTEXT
let audioCtxSingleton: AudioContext | null = null
const getAudioCtx = () => {
  if (typeof window === 'undefined') return null
  if (!audioCtxSingleton) {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
    if (AudioCtx) {
      audioCtxSingleton = new AudioCtx()
    }
  }
  if (audioCtxSingleton && audioCtxSingleton.state === 'suspended') {
    audioCtxSingleton.resume()
  }
  return audioCtxSingleton
}

const playRotarySound = () => {
  try {
    const ctx = getAudioCtx()
    if (!ctx) return
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    const filter = ctx.createBiquadFilter()

    osc.type = 'sine'
    osc.frequency.setValueAtTime(240, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.05)

    filter.type = 'lowpass'
    filter.frequency.setValueAtTime(450, ctx.currentTime)

    gain.gain.setValueAtTime(0.001, ctx.currentTime)
    gain.gain.linearRampToValueAtTime(0.14, ctx.currentTime + 0.008)
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.055)

    osc.connect(filter)
    filter.connect(gain)
    gain.connect(ctx.destination)

    osc.start()
    osc.stop(ctx.currentTime + 0.06)
  } catch (e) {}
}

const playConfirmSound = () => {
  try {
    const ctx = getAudioCtx()
    if (!ctx) return
    const freqs = [130.81, 164.81, 196.00, 246.94]
    freqs.forEach((freq, idx) => {
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      const filter = ctx.createBiquadFilter()

      osc.type = 'triangle'
      osc.frequency.setValueAtTime(freq, ctx.currentTime)
      filter.type = 'lowpass'
      filter.frequency.setValueAtTime(600, ctx.currentTime)

      const startTime = ctx.currentTime + idx * 0.025
      gain.gain.setValueAtTime(0.001, startTime)
      gain.gain.linearRampToValueAtTime(0.12, startTime + 0.02)
      gain.gain.exponentialRampToValueAtTime(0.0001, startTime + 0.42)

      osc.connect(filter)
      filter.connect(gain)
      gain.connect(ctx.destination)

      osc.start(startTime)
      osc.stop(startTime + 0.43)
    })
  } catch (e) {}
}

export default function ThemePicker({ isCollapsed = false, iconOnly = false }: { isCollapsed?: boolean, iconOnly?: boolean }) {
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)
  const [isOpen, setIsOpen] = useState(false)
  
  // State 4 Vòng Tròn Xoay Riêng Biệt (4 Separate Wheels)
  const [activeCategoryIndex, setActiveCategoryIndex] = useState<number>(3) // Mặc định Classic (Index 3)
  const [planetThemeIndex, setPlanetThemeIndex] = useState<number>(7) // Index của classic-paperback trong Classic category
  const [rotationAngle, setRotationAngle] = useState(0)
  const [wheelCooldown, setWheelCooldown] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  // Mobile Touch & Rotary Gesture Refs (XOR Action Lock & Center Origin Check)
  const centerCircleRef = useRef<HTMLDivElement>(null)
  const wheelRef = useRef<HTMLDivElement>(null)
  const touchModeRef = useRef<'NONE' | 'ROTATE_THEME' | 'SWIPE_CATEGORY'>('NONE')
  const touchStartPosRef = useRef<{ x: number; y: number } | null>(null)
  const touchStartAngleRef = useRef<number>(0)
  const initialRotationAngleRef = useRef<number>(0)

  const activeCategory = CATEGORIES[activeCategoryIndex]
  const currentCategoryThemes = THEMES.filter(t => t.category === activeCategory)
  const activeThemeObj = currentCategoryThemes[planetThemeIndex] || currentCategoryThemes[0] || THEMES[0]

  const stateRef = useRef({ activeCategoryIndex, planetThemeIndex, rotationAngle, isOpen })
  useEffect(() => {
    stateRef.current = { activeCategoryIndex, planetThemeIndex, rotationAngle, isOpen }
  }, [activeCategoryIndex, planetThemeIndex, rotationAngle, isOpen])

  useEffect(() => {
    setMounted(true)
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 640)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // Đồng bộ theme hiện tại khi mở modal
  useEffect(() => {
    if (theme && !isOpen) {
      const globalIdx = THEMES.findIndex(t => t.id === theme)
      if (globalIdx !== -1) {
        const foundObj = THEMES[globalIdx]
        const catIdx = CATEGORIES.indexOf(foundObj.category)
        const themesInCat = THEMES.filter(t => t.category === foundObj.category)
        const inCatIdx = themesInCat.findIndex(t => t.id === theme)
        if (catIdx !== -1 && inCatIdx !== -1) {
          setActiveCategoryIndex(catIdx)
          setPlanetThemeIndex(inCatIdx)
          setRotationAngle(-inCatIdx * 36)
        }
      }
    }
  }, [theme, isOpen])

  // Chuyển Theme trong vòng tròn hiện tại
  const selectThemeInPlanet = (inCatIdx: number, playSound = true) => {
    const currentAngle = stateRef.current.rotationAngle
    const currentIdx = stateRef.current.planetThemeIndex

    let diff = inCatIdx - currentIdx
    const total = 10
    if (diff > total / 2) diff -= total
    if (diff < -total / 2) diff += total

    const newAngle = currentAngle - diff * 36
    setPlanetThemeIndex(inCatIdx)
    setRotationAngle(newAngle)

    if (playSound) playRotarySound()
  }

  // Chuyển Cụm Theme / Vòng Tròn (Light -> Dark -> Gradient -> Classic)
  const nextPlanetWheel = () => {
    const nextCatIdx = (stateRef.current.activeCategoryIndex + 1) % CATEGORIES.length
    setActiveCategoryIndex(nextCatIdx)
    setPlanetThemeIndex(0)
    setRotationAngle(0)
    playRotarySound()
  }

  const prevPlanetWheel = () => {
    const prevCatIdx = (stateRef.current.activeCategoryIndex - 1 + CATEGORIES.length) % CATEGORIES.length
    setActiveCategoryIndex(prevCatIdx)
    setPlanetThemeIndex(0)
    setRotationAngle(0)
    playRotarySound()
  }

  // Xoay các Theme đơn lẻ trong cụm
  const rotateRight = () => {
    const currIdx = stateRef.current.planetThemeIndex
    const nextIdx = (currIdx + 1) % 10
    selectThemeInPlanet(nextIdx)
  }

  const rotateLeft = () => {
    const currIdx = stateRef.current.planetThemeIndex
    const prevIdx = (currIdx - 1 + 10) % 10
    selectThemeInPlanet(prevIdx)
  }

  // Áp dụng Theme toàn cục
  const handleApplyTheme = () => {
    if (activeThemeObj) {
      setTheme(activeThemeObj.id)
    }
    playConfirmSound()
    setIsOpen(false)
  }

  // Điều khiển bằng Bàn Phím
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault()
        if (e.shiftKey) {
          prevPlanetWheel()
        } else {
          nextPlanetWheel()
        }
      } else if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault()
        rotateRight()
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault()
        rotateLeft()
      } else if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        handleApplyTheme()
      } else if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [isOpen])

  // OPTIMIZED GAMEPAD POLLING ENGINE
  useEffect(() => {
    if (!isOpen) return

    let animFrameId: number
    let gamepadCooldown = false

    const pollGamepad = () => {
      const gamepads = navigator.getGamepads ? navigator.getGamepads() : []
      const hasGamepad = Array.from(gamepads).some(Boolean)
      
      if (hasGamepad) {
        for (const gp of gamepads) {
          if (!gp) continue

          const buttonLeft = gp.buttons[14]?.pressed || gp.buttons[12]?.pressed
          const buttonRight = gp.buttons[15]?.pressed || gp.buttons[13]?.pressed
          const buttonTabNext = gp.buttons[5]?.pressed || gp.buttons[7]?.pressed
          const buttonTabPrev = gp.buttons[4]?.pressed || gp.buttons[6]?.pressed
          const stickLeft = gp.axes[0] < -0.5
          const stickRight = gp.axes[0] > 0.5
          const buttonConfirm = gp.buttons[0]?.pressed
          const buttonClose = gp.buttons[1]?.pressed

          if (!gamepadCooldown) {
            if (buttonTabNext) {
              nextPlanetWheel()
              gamepadCooldown = true
              setTimeout(() => { gamepadCooldown = false }, 250)
            } else if (buttonTabPrev) {
              prevPlanetWheel()
              gamepadCooldown = true
              setTimeout(() => { gamepadCooldown = false }, 250)
            } else if (buttonRight || stickRight) {
              rotateRight()
              gamepadCooldown = true
              setTimeout(() => { gamepadCooldown = false }, 180)
            } else if (buttonLeft || stickLeft) {
              rotateLeft()
              gamepadCooldown = true
              setTimeout(() => { gamepadCooldown = false }, 180)
            } else if (buttonConfirm) {
              handleApplyTheme()
              gamepadCooldown = true
              setTimeout(() => { gamepadCooldown = false }, 300)
            } else if (buttonClose) {
              setIsOpen(false)
              gamepadCooldown = true
              setTimeout(() => { gamepadCooldown = false }, 300)
            }
          }
        }
      }

      animFrameId = requestAnimationFrame(pollGamepad)
    }

    animFrameId = requestAnimationFrame(pollGamepad)
    return () => cancelAnimationFrame(animFrameId)
  }, [isOpen])

  // Wheel Scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (wheelCooldown) return
    if (e.deltaY > 0 || e.deltaX > 0) {
      rotateRight()
    } else if (e.deltaY < 0 || e.deltaX < 0) {
      rotateLeft()
    }
    setWheelCooldown(true)
    setTimeout(() => setWheelCooldown(false), 160)
  }

  // Touch Gesture Handling with XOR Action Lock & Center Origin Rule
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length !== 1) return
    const touch = e.touches[0]
    const touchX = touch.clientX
    const touchY = touch.clientY

    // 1. Check if touch originated from inside the Center Circle
    if (centerCircleRef.current) {
      const rect = centerCircleRef.current.getBoundingClientRect()
      const isInsideCenter = (
        touchX >= rect.left &&
        touchX <= rect.right &&
        touchY >= rect.top &&
        touchY <= rect.bottom
      )

      if (isInsideCenter) {
        // Locked mode: SWIPE_CATEGORY (Only swipe category allowed from center)
        touchModeRef.current = 'SWIPE_CATEGORY'
        touchStartPosRef.current = { x: touchX, y: touchY }
        return
      }
    }

    // 2. Otherwise, touch originated from wheel/outer area -> ROTATE_THEME mode
    touchModeRef.current = 'ROTATE_THEME'
    touchStartPosRef.current = { x: touchX, y: touchY }
    initialRotationAngleRef.current = stateRef.current.rotationAngle

    if (wheelRef.current) {
      const rect = wheelRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const rad = Math.atan2(touchY - cy, touchX - cx)
      touchStartAngleRef.current = rad * (180 / Math.PI)
    }
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchModeRef.current === 'NONE' || !touchStartPosRef.current) return
    const touch = e.touches[0]
    const touchX = touch.clientX
    const touchY = touch.clientY

    if (touchModeRef.current === 'ROTATE_THEME' && wheelRef.current) {
      // Circular Rotary Drag on Theme Wheel
      const rect = wheelRef.current.getBoundingClientRect()
      const cx = rect.left + rect.width / 2
      const cy = rect.top + rect.height / 2
      const currentRad = Math.atan2(touchY - cy, touchX - cx)
      const currentAngle = currentRad * (180 / Math.PI)
      
      let deltaAngle = currentAngle - touchStartAngleRef.current
      if (deltaAngle > 180) deltaAngle -= 360
      if (deltaAngle < -180) deltaAngle += 360

      const nextAngle = initialRotationAngleRef.current + deltaAngle
      setRotationAngle(nextAngle)

      let norm = ((-nextAngle % 360) + 360) % 360
      let liveIdx = Math.round(norm / 36) % 10
      if (liveIdx !== stateRef.current.planetThemeIndex) {
        setPlanetThemeIndex(liveIdx)
        playRotarySound()
      }
    }
  }

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchModeRef.current === 'SWIPE_CATEGORY' && touchStartPosRef.current) {
      const touch = e.changedTouches[0]
      const deltaX = touch.clientX - touchStartPosRef.current.x
      const SWIPE_THRESHOLD = 40

      if (deltaX < -SWIPE_THRESHOLD) {
        nextPlanetWheel() // Swipe left -> Next category group
      } else if (deltaX > SWIPE_THRESHOLD) {
        prevPlanetWheel() // Swipe right -> Prev category group
      }
    } else if (touchModeRef.current === 'ROTATE_THEME') {
      const currentAngle = stateRef.current.rotationAngle
      let norm = ((-currentAngle % 360) + 360) % 360
      let snapIdx = Math.round(norm / 36) % 10
      setPlanetThemeIndex(snapIdx)
      setRotationAngle(-snapIdx * 36)
    }

    touchModeRef.current = 'NONE'
    touchStartPosRef.current = null
  }

  if (!mounted) return null

  const currentThemeObj = THEMES.find(t => t.id === theme) || THEMES[0]
  const radius = isMobile ? 125 : 205
  const isPreviewLight = isLightColor(activeThemeObj?.bg || '')

  return (
    <>
      {/* Sidebar Trigger Button */}
      {iconOnly ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{ borderRadius: '10px' }}
          className="w-8.5 h-8.5 border border-border bg-card/80 hover:bg-card text-primary flex items-center justify-center transition-all shadow-xs cursor-pointer group"
          title={`Theme: ${currentThemeObj.name}`}
        >
          <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform text-primary" />
        </button>
      ) : isCollapsed ? (
        <button
          onClick={() => setIsOpen(true)}
          style={{ borderRadius: '12px' }}
          className="w-10 h-10 mx-auto border border-border bg-card/60 hover:bg-card hover:border-primary/50 text-primary flex items-center justify-center transition-all shadow-xs cursor-pointer group"
          title={`Theme Vault: ${currentThemeObj.name}`}
        >
          <Sparkles className="w-4 h-4 group-hover:scale-110 transition-transform" />
        </button>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          style={{ borderRadius: '12px' }}
          className="w-full flex items-center justify-between px-3.5 py-2.5 border border-border bg-card/60 hover:bg-card hover:border-primary/40 text-foreground text-xs font-medium transition-all shadow-xs group cursor-pointer"
        >
          <div className="flex items-center gap-2.5 truncate">
            <div style={{ borderRadius: '8px' }} className="w-6 h-6 bg-primary/15 text-primary flex items-center justify-center group-hover:scale-110 transition-transform">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div className="flex flex-col text-left truncate">
              <span className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none">Theme Vault</span>
              <span className="font-semibold text-xs text-foreground truncate mt-0.5">{currentThemeObj.name}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 flex-shrink-0 ml-2">
            <span style={{ borderRadius: '9999px', backgroundColor: currentThemeObj.primary }} className="w-2.5 h-2.5 border border-black/20 shadow-xs" />
            <span style={{ borderRadius: '9999px', backgroundColor: currentThemeObj.secondary }} className="w-2.5 h-2.5 border border-black/20 shadow-xs" />
          </div>
        </button>
      )}

      {/* Fullscreen Rotary Dial Modal */}
      {mounted && createPortal(
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onWheel={handleWheel}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="fixed inset-0 z-[9999] flex flex-col items-center justify-between bg-black/90 backdrop-blur-2xl p-4 overflow-hidden select-none text-white"
            >
              {/* Background Ambient Glow */}
              <div 
                className="absolute inset-0 pointer-events-none opacity-35 transition-all duration-700 blur-3xl"
                style={{
                  background: `radial-gradient(circle at center, ${activeThemeObj.primary} 0%, ${activeThemeObj.secondary} 45%, transparent 75%)`
                }}
              />

              {/* Top Bar: Header & Close Button */}
              <div className="w-full max-w-6xl flex items-center justify-between z-20 pt-2 px-2">
                <div className="flex items-center gap-3">
                  <div style={{ borderRadius: '16px' }} className="w-10 h-10 bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center shadow-lg">
                    <Palette className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black text-white tracking-tight">Theme Vault</h2>
                    <p className="text-xs text-zinc-400">4 Cụm Theme: Light • Dark • Gradient • Classic</p>
                  </div>
                </div>

                <button
                  onClick={() => setIsOpen(false)}
                  style={{ borderRadius: '16px' }}
                  className="p-3 text-zinc-400 hover:text-white bg-zinc-900/90 hover:bg-zinc-800 border border-zinc-700/80 transition-all cursor-pointer shadow-lg"
                  title="Đóng (Esc / Nút B Gamepad)"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* 🎮 DEVICE HELPER ICONS BAR (DESKTOP) */}
              {!isMobile && (
                <div style={{ borderRadius: '9999px' }} className="z-20 my-1 flex items-center justify-center gap-4 bg-zinc-900/80 border border-zinc-800/90 px-5 py-2 backdrop-blur-md shadow-lg text-zinc-300">
                  <span title="Tay cầm Console / Gamepad"><Gamepad2 className="w-4 h-4 text-indigo-400" /></span>
                  <span className="opacity-20 text-zinc-600">|</span>
                  <span title="Phím Bàn phím PC (Tab đổi cụm, Mũi tên đổi theme)"><Keyboard className="w-4 h-4 text-indigo-400" /></span>
                  <span className="opacity-20 text-zinc-600">|</span>
                  <span title="Con trỏ & Cuộn chuột"><MousePointer className="w-4 h-4 text-indigo-400" /></span>
                  <span className="opacity-20 text-zinc-600">|</span>
                  <span title="Vuốt cảm ứng Mobile"><Smartphone className="w-4 h-4 text-indigo-400" /></span>
                </div>
              )}

              {/* MAIN WORKSPACE */}
              <div className="relative w-full max-w-6xl flex-1 flex flex-col sm:flex-row items-center justify-between z-10 px-2 sm:px-6">
                
                {/* 👈 DESKTOP ONLY: NÚT BÊN NGOÀI BÊN TRÁI */}
                {!isMobile && (
                  <button
                    onClick={prevPlanetWheel}
                    style={{ borderRadius: '24px' }}
                    className="w-12 h-12 sm:w-16 sm:h-16 bg-zinc-900/90 hover:bg-zinc-800 border-2 border-zinc-700/80 hover:border-indigo-500 text-white flex items-center justify-center transition-all shadow-2xl cursor-pointer hover:scale-110 active:scale-95 flex-shrink-0 z-30 group"
                    title="Đổi Cụm Theme Trực Tiếp (Shift+Tab)"
                  >
                    <ChevronLeft className="w-7 h-7 sm:w-9 sm:h-9 group-hover:-translate-x-0.5 transition-transform text-indigo-400" />
                  </button>
                )}

                {/* 🎡 WHEEL CONTAINER */}
                <div ref={wheelRef} className="relative flex-1 h-[360px] sm:h-[520px] flex items-center justify-center overflow-visible w-full">
                  
                  {/* 🔄 DESKTOP ONLY: MŨI TÊN CONG BÊN TRÁI */}
                  {!isMobile && (
                    <button
                      onClick={rotateLeft}
                      style={{ borderRadius: '16px' }}
                      className="absolute left-2 sm:left-6 z-30 p-3 sm:p-4 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white transition-all shadow-xl cursor-pointer hover:scale-110 active:scale-95"
                      title="Xoay Theme Trái (Phím Trái ←)"
                    >
                      <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                    </button>
                  )}

                  {/* Decorative Outer Orbit Rings */}
                  <div style={{ borderRadius: '9999px' }} className="absolute w-[270px] h-[270px] sm:w-[440px] sm:h-[440px] border border-zinc-800/80 pointer-events-none" />
                  <div style={{ borderRadius: '9999px' }} className="absolute w-[210px] h-[210px] sm:w-[350px] sm:h-[350px] border border-dashed border-zinc-800/60 pointer-events-none animate-spin-slow" />

                  {/* Dynamic Planet Circle Wheel */}
                  <AnimatePresence mode="wait">
                    <motion.div 
                      key={activeCategory}
                      initial={{ scale: 0.35, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1, rotate: rotationAngle }}
                      exit={{ scale: 1.8, opacity: 0 }}
                      transition={touchModeRef.current === 'ROTATE_THEME' ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 20 }}
                      className="relative w-[270px] h-[270px] sm:w-[440px] sm:h-[440px] flex items-center justify-center overflow-visible"
                    >
                      {currentCategoryThemes.map((t, i) => {
                        const angle = (i * 36) * (Math.PI / 180)
                        const x = radius * Math.cos(angle)
                        const y = radius * Math.sin(angle)
                        const isSelected = planetThemeIndex === i
                        const offset = isMobile ? 18 : 24
                        const isNodeLight = isLightColor(t.bg)

                        return (
                          <button
                            key={t.id}
                            onClick={() => selectThemeInPlanet(i, true)}
                            style={{
                              position: 'absolute',
                              left: `calc(50% + ${x}px - ${offset}px)`,
                              top: `calc(50% + ${y}px - ${offset}px)`,
                              transform: `rotate(${-rotationAngle}deg)`,
                              transition: touchModeRef.current === 'ROTATE_THEME' ? 'none' : 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
                              backgroundColor: t.bg,
                              borderRadius: '9999px'
                            }}
                            className={`w-9 h-9 sm:w-12 sm:h-12 flex flex-col items-center justify-center p-1 transition-all cursor-pointer shadow-xl border ${
                              isSelected
                                ? 'ring-4 ring-indigo-500 scale-125 z-20 border-white shadow-2xl'
                                : isNodeLight
                                    ? 'opacity-90 hover:opacity-100 hover:scale-110 z-10 border-slate-400/80 shadow-md'
                                    : 'opacity-80 hover:opacity-100 hover:scale-110 z-10 border-zinc-700/80 shadow-md'
                            }`}
                          >
                            <div className="flex gap-0.5 items-center justify-center">
                              <span style={{ borderRadius: '9999px', backgroundColor: t.primary }} className="w-2.5 h-2.5 sm:w-3 sm:h-3 border border-black/30 shadow-xs" />
                              <span style={{ borderRadius: '9999px', backgroundColor: t.secondary }} className="w-2.5 h-2.5 sm:w-3 sm:h-3 border border-black/30 shadow-xs" />
                            </div>
                          </button>
                        )
                      })}
                    </motion.div>
                  </AnimatePresence>

                  {/* CENTER HUB PREVIEW CARD (CLICKABLE ON MOBILE & DESKTOP) */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div 
                      ref={centerCircleRef}
                      onClick={handleApplyTheme}
                      style={{ 
                        borderRadius: '9999px',
                        backgroundColor: activeThemeObj?.bg || '#090d16'
                      }}
                      className={`w-48 h-48 sm:w-64 sm:h-64 border-2 transition-all duration-300 flex flex-col items-center justify-center p-3 sm:p-4 text-center pointer-events-auto backdrop-blur-md relative overflow-hidden shadow-2xl cursor-pointer hover:scale-105 active:scale-95 group ${
                        isPreviewLight ? 'text-zinc-950 border-slate-400/80 hover:border-zinc-900' : 'text-white border-zinc-700/80 hover:border-white'
                      }`}
                      title="Bấm vào hình tròn trung tâm để Áp Dụng Theme"
                    >
                      {/* Active Category Badge */}
                      <span 
                        style={{ borderRadius: '9999px' }} 
                        className={`text-[9px] sm:text-xs font-black uppercase tracking-widest px-2.5 py-0.5 sm:py-1 border mb-1 ${
                          isPreviewLight
                            ? 'bg-black/10 border-black/20 text-zinc-900'
                            : 'bg-white/10 border-white/20 text-white'
                        }`}
                      >
                        {activeCategory}
                      </span>

                      {/* Theme Title */}
                      <h3 className="text-sm sm:text-lg font-black tracking-tight mb-0.5 truncate max-w-[150px] sm:max-w-[180px]">
                        {activeThemeObj?.name}
                      </h3>

                      {/* Description */}
                      <p className="text-[8.5px] sm:text-[11px] opacity-80 max-w-[140px] sm:max-w-[160px] leading-tight mb-1.5 sm:mb-2 line-clamp-2">
                        {activeThemeObj?.desc}
                      </p>

                      {/* Primary & Secondary Hex Badges */}
                      <div className="flex items-center gap-1 sm:gap-1.5 mb-2 sm:mb-3">
                        <div 
                          style={{ borderRadius: '8px' }} 
                          className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 border ${
                            isPreviewLight ? 'bg-black/10 border-black/15' : 'bg-white/10 border-white/15'
                          }`}
                        >
                          <span style={{ borderRadius: '9999px', backgroundColor: activeThemeObj?.primary }} className="w-2 h-2 sm:w-2.5 sm:h-2.5 border border-black/20" />
                          <span className="text-[8px] sm:text-[9px] font-mono font-bold opacity-90">{activeThemeObj?.primary}</span>
                        </div>
                        <div 
                          style={{ borderRadius: '8px' }} 
                          className={`flex items-center gap-1 px-1.5 sm:px-2 py-0.5 border ${
                            isPreviewLight ? 'bg-black/10 border-black/15' : 'bg-white/10 border-white/15'
                          }`}
                        >
                          <span style={{ borderRadius: '9999px', backgroundColor: activeThemeObj?.secondary }} className="w-2 h-2 sm:w-2.5 sm:h-2.5 border border-black/20" />
                          <span className="text-[8px] sm:text-[9px] font-mono font-bold opacity-90">{activeThemeObj?.secondary}</span>
                        </div>
                      </div>

                      {/* Touch / Click Hint */}
                      <div className={`flex items-center gap-1 text-[9px] sm:text-xs font-black uppercase tracking-wider px-3 py-1.5 rounded-full shadow-md transition-transform group-hover:scale-105 ${
                        isPreviewLight ? 'bg-zinc-950 text-white' : 'bg-white text-zinc-950'
                      }`}>
                        <Check className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Chạm Để Áp Dụng
                      </div>
                    </div>
                  </div>

                  {/* 🔄 DESKTOP ONLY: MŨI TÊN CONG BÊN PHẢI */}
                  {!isMobile && (
                    <button
                      onClick={rotateRight}
                      style={{ borderRadius: '16px' }}
                      className="absolute right-2 sm:right-6 z-30 p-3 sm:p-4 bg-zinc-900/80 hover:bg-zinc-800 border border-zinc-700/80 text-zinc-300 hover:text-white transition-all shadow-xl cursor-pointer hover:scale-110 active:scale-95"
                      title="Xoay Theme Phải (Phím Phải →)"
                    >
                      <RotateCw className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-400" />
                    </button>
                  )}

                </div>

                {/* 👉 DESKTOP ONLY: NÚT BÊN NGOÀI BÊN PHẢI */}
                {!isMobile && (
                  <button
                    onClick={nextPlanetWheel}
                    style={{ borderRadius: '24px' }}
                    className="w-12 h-12 sm:w-16 sm:h-16 bg-zinc-900/90 hover:bg-zinc-800 border-2 border-zinc-700/80 hover:border-indigo-500 text-white flex items-center justify-center transition-all shadow-2xl cursor-pointer hover:scale-110 active:scale-95 flex-shrink-0 z-30 group"
                    title="Đổi Cụm Theme Trực Tiếp (Tab)"
                  >
                    <ChevronRight className="w-7 h-7 sm:w-9 sm:h-9 group-hover:translate-x-0.5 transition-transform text-indigo-400" />
                  </button>
                )}
              </div>

              {/* 📱 MOBILE BOTTOM CONTROLS BAR (CHUYỂN HẾT NÚT XUỐNG DƯỚI CHO GIAO DIỆN DỌC) */}
              {isMobile && (
                <div className="w-full max-w-sm flex items-center justify-around gap-1 bg-zinc-900/90 border border-zinc-800 p-2 rounded-2xl z-30 shadow-2xl mb-1">
                  <button
                    type="button"
                    onClick={prevPlanetWheel}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-indigo-400 active:scale-95 border border-zinc-700/60 cursor-pointer flex-1"
                    title="Nhóm trước"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span className="text-[8.5px] font-extrabold truncate">Nhóm Cũ</span>
                  </button>

                  <button
                    type="button"
                    onClick={rotateLeft}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 active:scale-95 border border-zinc-700/60 cursor-pointer flex-1"
                    title="Xoay Trái"
                  >
                    <RotateCcw className="w-4 h-4 text-indigo-400" />
                    <span className="text-[8.5px] font-extrabold truncate">Lùi Theme</span>
                  </button>

                  <button
                    type="button"
                    onClick={rotateRight}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 active:scale-95 border border-zinc-700/60 cursor-pointer flex-1"
                    title="Xoay Phải"
                  >
                    <RotateCw className="w-4 h-4 text-indigo-400" />
                    <span className="text-[8.5px] font-extrabold truncate">Tiến Theme</span>
                  </button>

                  <button
                    type="button"
                    onClick={nextPlanetWheel}
                    className="flex flex-col items-center gap-1 p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-indigo-400 active:scale-95 border border-zinc-700/60 cursor-pointer flex-1"
                    title="Nhóm tiếp"
                  >
                    <ChevronRight className="w-4 h-4" />
                    <span className="text-[8.5px] font-extrabold truncate">Nhóm Mới</span>
                  </button>
                </div>
              )}

              {/* Spacing padding */}
              <div className="py-0.5" />
            </motion.div>
          )}
        </AnimatePresence>,
        document.body
      )}
    </>
  )
}
