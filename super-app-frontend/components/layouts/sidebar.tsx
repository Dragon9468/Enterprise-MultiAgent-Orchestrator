'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { 
  FileText, PlayCircle, BarChart3, Activity, UserCircle, LogOut, Menu, X, 
  Laptop, PanelLeftClose, Settings, User, ShieldCheck, Sparkles, FlaskConical, Archive 
} from 'lucide-react'
import { useEffect, useState, useRef } from 'react'
import { pb } from '@/lib/pocketbase'
import ThemePicker from '@/components/blocks/theme-picker'
import { motion, AnimatePresence } from 'framer-motion'

// Logo chữ E cách điệu phong cách Enterprise Orchestrator
const EnterpriseLogo = ({ className = "text-xl" }: { className?: string }) => (
  <span
    className={`font-black italic text-primary-foreground tracking-tighter leading-none select-none ${className}`}
    style={{ fontFamily: '"Inter", system-ui, sans-serif', fontStyle: 'italic', fontWeight: 900 }}
  >
    E
  </span>
)

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const [user, setUser] = useState<any>(() => (typeof window !== 'undefined' ? pb.authStore.model : null))
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isCollapsed, setIsCollapsed] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [showAuthorModal, setShowAuthorModal] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setUser(pb.authStore.model)
    const unsubscribe = pb.authStore.onChange((token, model) => {
      setUser(model)
    })

    // Load collapsed state from localStorage
    const savedCollapsed = localStorage.getItem('app_sidebar_collapsed')
    if (savedCollapsed === 'true') {
      setIsCollapsed(true)
    }

    // Close user mini menu when clicking outside
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      unsubscribe()
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Store recent active app
  useEffect(() => {
    if (pathname && pathname !== '/login') {
      localStorage.setItem('app_last_active_app', pathname)
    }
  }, [pathname])

  const toggleCollapse = () => {
    const nextState = !isCollapsed
    setIsCollapsed(nextState)
    localStorage.setItem('app_sidebar_collapsed', String(nextState))
  }

  if (pathname === '/login') return null;

  // Phân cấp Super App: Main Apps trên Left Sidebar
  // Ngoại trừ 'Tài liệu' + 'Thực thi' + 'Thông số', toàn bộ app khác chỉ dành cho Level 6 & 7
  const userLevel = user?.role_level || 1
  const isAdmin = userLevel >= 6

  const navItems = [
    { 
      name: 'Tài liệu', 
      href: '/workspace', 
      icon: FileText, 
      show: true,
      miniapps: ['Trò chuyện', 'Tra cứu']
    },
    { 
      name: 'Thực thi', 
      href: '/execute', 
      icon: PlayCircle, 
      show: true 
    },
    { 
      name: 'Thông số', 
      href: '/thong-so', 
      icon: BarChart3, 
      show: true 
    },
    { 
      name: 'Chỉ số V1', 
      href: '/metrics-v1', 
      icon: Archive, 
      show: userLevel >= 7 
    },
    { 
      name: 'Thiết bị', 
      href: '/device', 
      icon: Laptop, 
      show: isAdmin 
    },
    { 
      name: 'Giám sát', 
      href: '/monitor', 
      icon: Activity, 
      show: isAdmin 
    },
    { 
      name: 'Bảo mật', 
      href: '/security', 
      icon: ShieldCheck, 
      show: isAdmin 
    },
    { 
      name: 'Sandbox', 
      href: '/sandbox', 
      icon: FlaskConical, 
      show: isAdmin 
    },
  ]

  const handleLogout = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('app_remember_session')
      localStorage.removeItem('app_auth_token')
      localStorage.removeItem('app_user_data')
    }
    pb.authStore.clear()
    router.push('/login')
  }

  return (
    <>
      {/* Mobile Top Navigation Bar (Compact Height & Icon-Only Theme Button) */}
      <div className="md:hidden flex items-center justify-between px-3 py-1.5 h-11 min-h-11 safe-top bg-card/80 backdrop-blur-md border-b border-border text-foreground z-30 w-full">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-xl bg-primary flex items-center justify-center shadow-md">
            <EnterpriseLogo className="text-sm" />
          </div>
          <span className="font-bold text-xs tracking-tight text-foreground">Enterprise AI</span>
        </div>

        <div className="flex items-center gap-2">
          <ThemePicker iconOnly />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-1.5 text-foreground bg-muted hover:bg-muted/80 rounded-xl transition-colors cursor-pointer"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Dropdown Navigation Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed top-14 left-0 right-0 bg-card/95 backdrop-blur-xl border-b border-border p-4 z-20 space-y-3 shadow-2xl">
          <nav className="space-y-1">
            {navItems.filter(item => item.show).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <div key={item.name} className="space-y-1">
                  <Link
                    href={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive
                      ? 'bg-primary/20 text-primary border border-primary/30 shadow-xs'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    <span>{item.name}</span>
                  </Link>
                </div>
              )
            })}
          </nav>

          <div className="pt-3 border-t border-border flex items-center justify-between">
            <div className="flex items-center gap-2.5 text-xs text-muted-foreground">
              <UserCircle className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="truncate max-w-[180px] font-medium text-foreground">{user ? user.full_name : 'Guest User'}</span>
            </div>
            <button
              onClick={handleLogout}
              className="text-xs text-destructive hover:underline font-medium cursor-pointer"
            >
              Đăng xuất
            </button>
          </div>
        </div>
      )}

      {/* Desktop Sidebar (Compact Proportional Width: w-56 vs w-16) */}
      <aside className={`${isCollapsed ? 'w-16' : 'w-56'} transition-all duration-300 hidden md:flex flex-col justify-between p-3 bg-card/60 backdrop-blur-md border-r border-border text-foreground relative z-20`}>
        <div>
          {/* Header Logo & Collapse Toggle Button */}
          <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'justify-between'} mb-4 px-1 mt-1`}>
            <div className="flex items-center gap-2">
              {isCollapsed ? (
                <button
                  onClick={toggleCollapse}
                  className="w-8.5 h-8.5 rounded-xl bg-primary flex-shrink-0 flex items-center justify-center shadow-md hover:scale-110 active:scale-95 transition-transform cursor-pointer"
                  title="Mở rộng Sidebar"
                >
                  <EnterpriseLogo className="text-lg" />
                </button>
              ) : (
                <>
                  <div className="w-8.5 h-8.5 rounded-xl bg-primary flex-shrink-0 flex items-center justify-center shadow-md">
                    <EnterpriseLogo className="text-lg" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <h1 className="font-bold text-sm tracking-tight leading-none text-foreground truncate">Enterprise AI</h1>
                      <button
                        onClick={() => setShowAuthorModal(true)}
                        className="w-3.5 h-3.5 rounded-full bg-primary/20 hover:bg-primary text-primary hover:text-primary-foreground flex items-center justify-center text-[9px] font-extrabold transition-all cursor-pointer shadow-xs border border-primary/30 hover:scale-110"
                        title="Bản quyền & Thông tin Tác giả"
                      >
                        ?
                      </button>
                    </div>
                    <span className="text-[9.5px] font-medium text-muted-foreground mt-0.5 tracking-wider uppercase">Super App Platform</span>
                  </div>
                </>
              )}
            </div>

            {!isCollapsed && (
              <button
                onClick={toggleCollapse}
                className="p-1 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-all cursor-pointer"
                title="Thu gọn Sidebar"
              >
                <PanelLeftClose className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Nav Items */}
          <nav className="space-y-1">
            {navItems.filter(item => item.show).map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
              return (
                <div key={item.name} className="space-y-1">
                  <Link
                    href={item.href}
                    title={isCollapsed ? item.name : undefined}
                    className={`flex items-center gap-2.5 px-2.5 py-2 rounded-xl text-xs font-medium transition-all ${
                      isCollapsed ? 'justify-center px-0' : ''
                    } ${
                      isActive 
                        ? 'bg-primary/20 text-primary border border-primary/30 shadow-xs' 
                        : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  >
                    <item.icon className="w-4 h-4 flex-shrink-0" />
                    {!isCollapsed && <span className="truncate">{item.name}</span>}
                  </Link>

                  {/* Sub miniapps indicator */}
                  {!isCollapsed && item.miniapps && isActive && (
                    <div className="pl-8 pr-2 py-0.5 space-y-0.5">
                      {item.miniapps.map(sub => (
                        <div key={sub} className="text-[10.5px] font-medium text-primary/80 flex items-center gap-1.5">
                          <span className="w-1 h-1 rounded-full bg-primary" />
                          <span>{sub}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </nav>
        </div>

        {/* Footer Area with Theme Picker & User Account */}
        <div className="space-y-2.5 pt-2.5 border-t border-border/80">
          <ThemePicker isCollapsed={isCollapsed} />

          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className={`w-full flex items-center justify-between p-1.5 rounded-xl border border-border/60 bg-muted/40 hover:bg-muted transition-all text-xs font-medium cursor-pointer ${
                isCollapsed ? 'justify-center p-1.5' : ''
              }`}
            >
              <div className="flex items-center gap-2 truncate">
                <div className="w-6.5 h-6.5 rounded-lg bg-primary/20 text-primary border border-primary/30 flex items-center justify-center font-bold text-xs flex-shrink-0">
                  {(user?.fullname || user?.full_name || user?.email || 'U').charAt(0).toUpperCase()}
                </div>
                {!isCollapsed && (
                  <div className="flex flex-col text-left truncate">
                    <span className="font-semibold text-foreground truncate text-xs">{user?.fullname || user?.full_name || 'Người dùng'}</span>
                    <span className="text-[9.5px] text-muted-foreground truncate">{user ? user.email : 'guest@enterprise.com'}</span>
                  </div>
                )}
              </div>
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className={`absolute bottom-full mb-2 ${isCollapsed ? 'left-0 w-44' : 'w-full'} bg-card/95 border border-border p-1.5 rounded-xl shadow-xl backdrop-blur-md z-50 space-y-1 text-xs`}
                >
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 text-destructive hover:bg-destructive/10 rounded-lg font-medium transition-colors cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Đăng xuất</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </aside>

      {/* Author / Copyright Info Modal */}
      <AnimatePresence>
        {showAuthorModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full shadow-2xl relative space-y-4"
            >
              <button
                onClick={() => setShowAuthorModal(false)}
                className="absolute top-4 right-4 p-1 text-muted-foreground hover:text-foreground rounded-lg cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-md">
                  <EnterpriseLogo className="text-2xl" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-foreground">Enterprise Multi-Agent Platform</h3>
                  <p className="text-xs text-muted-foreground">Phiên bản 1.0.0 (Build 2026)</p>
                </div>
              </div>

              <div className="text-xs space-y-2 text-foreground/90 border-t border-border pt-3 font-medium">
                <p><strong>Phát triển bởi:</strong> Đội ngũ Kỹ Thuật AI Orchestrator</p>
                <p><strong>Bản quyền:</strong> © 2026 Enterprise Multi-Agent System. MIT License.</p>
                <p className="text-muted-foreground text-[11px] leading-relaxed pt-1">
                  Nền tảng Super App đa tác vụ tích hợp trí tuệ nhân tạo Multi-Agent phục vụ vận hành, phân tích số liệu và trích xuất tài liệu tự động.
                </p>
              </div>

              <button
                onClick={() => setShowAuthorModal(false)}
                className="w-full py-2 bg-primary text-primary-foreground font-bold rounded-xl text-xs cursor-pointer hover:bg-primary/90 transition-colors"
              >
                Đóng
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}
