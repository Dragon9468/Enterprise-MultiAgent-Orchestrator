'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck, Lock, CheckCircle2, Key, ShieldAlert, Cpu, Server, Activity, Users } from 'lucide-react'
import { motion } from 'framer-motion'
import { pb } from '@/lib/pocketbase'
import UserManagementTab from '@/components/blocks/user-management-tab'

export default function SecurityPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [currentUserRole, setCurrentUserRole] = useState(7)

  useEffect(() => {
    const user = pb.authStore.model
    const role = user?.role_level || 1
    if (!user || role < 6) {
      router.push('/workspace')
      return
    }
    setMounted(true)
    setCurrentUserRole(role)
  }, [router])

  if (!mounted) return null

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-8 space-y-6 max-w-7xl mx-auto w-full">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
              Admin Level 6 - 7 Security & RBAC Governance
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <ShieldCheck className="w-8 h-8 text-emerald-400" /> Trung Tâm Bảo Mật & Phân Quyền Nhân Sự
          </h1>
          <p className="text-xs sm:text-sm text-muted-foreground mt-1">
            Quản trị phân quyền 7 cấp độ, ràng buộc danh mục phòng ban tự động và phòng thủ hệ thống dành cho Ban Quản trị
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-emerald-950/60 border border-emerald-800/60 text-emerald-400 text-xs font-semibold">
          <Lock className="w-4 h-4" /> System Protected
        </div>
      </div>

      {/* 👑 BẢNG ĐIỀU KHIỂN QUẢN TRỊ NGƯỜI DÙNG & PHÂN QUYỀN 7 CẤP */}
      <UserManagementTab currentUserRole={currentUserRole} />

      {/* Security Status Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} className="p-5 rounded-2xl bg-card/60 border border-border backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Phân Quyền 7 Cấp</span>
            <Lock className="w-4 h-4 text-emerald-400" />
          </div>
          <p className="text-2xl font-black text-emerald-400 font-mono">RBAC 7-Tier</p>
          <p className="text-[11px] text-muted-foreground">Phân bổ quyền hạn chi tiết từ NVKT đến Ban Quản trị Tối cao</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="p-5 rounded-2xl bg-card/60 border border-border backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Ràng Buộc Phòng Ban</span>
            <ShieldAlert className="w-4 h-4 text-primary" />
          </div>
          <p className="text-2xl font-black text-primary font-mono">Strict Filter</p>
          <p className="text-[11px] text-muted-foreground">Ẩn tuyệt đối các phòng ban không khớp với Level được chọn</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="p-5 rounded-2xl bg-card/60 border border-border backdrop-blur-md space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase">Server-Side Hooks</span>
            <Activity className="w-4 h-4 text-purple-400" />
          </div>
          <p className="text-2xl font-black text-purple-400 font-mono">Auto Reject</p>
          <p className="text-[11px] text-muted-foreground">PocketBase Hooks từ chối lưu nếu sai lệch cấu hình RBAC</p>
        </motion.div>
      </div>

      {/* Main Governance Content */}
      <div className="p-6 rounded-2xl bg-card/60 border border-border backdrop-blur-md space-y-4">
        <h3 className="font-bold text-lg text-foreground flex items-center gap-2">
          <Key className="w-5 h-5 text-primary" /> Quy Trình Kiểm Soát An Ninh & Phân Quyền Đa Tác Tử
        </h3>

        <div className="space-y-3 pt-2 text-xs text-muted-foreground leading-relaxed">
          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-background/60 border border-border">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground block font-semibold mb-0.5">Xác thực Trực tiếp PocketBase & Supabase RBAC:</strong>
              Tất cả phiên đăng nhập được duy trì an toàn và phân quyền dữ liệu động qua bảng `khu_vuc_nvkt` trên Supabase.
            </div>
          </div>

          <div className="flex items-start gap-3 p-3.5 rounded-xl bg-background/60 border border-border">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="text-foreground block font-semibold mb-0.5">Giám sát Truy vấn Real-Time:</strong>
              Toàn bộ lịch sử thực thi và tư vấn AI được ghi log vào Supabase `usage_logs` ngay lập tức để phục vụ kiểm toán an ninh.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
