'use client'

import React, { useState, useEffect } from 'react'
import { pb } from '@/lib/pocketbase'
import { RBAC_ROLES, getRoleDefinition, getDepartmentsByLevel } from '@/lib/rbac'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { 
  Users, 
  ShieldCheck, 
  UserPlus, 
  Edit3, 
  Trash2, 
  Search, 
  Lock, 
  Mail, 
  User, 
  Building2, 
  CheckCircle2, 
  AlertTriangle,
  X,
  RefreshCw
} from 'lucide-react'

interface UserRecord {
  id: string
  email: string
  fullname?: string
  username?: string
  role_level?: number
  department?: string
  created?: string
  updated?: string
}

export default function UserManagementTab({ currentUserRole = 7 }: { currentUserRole?: number }) {
  const [users, setUsers] = useState<UserRecord[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [roleFilter, setRoleFilter] = useState<number | 'ALL'>('ALL')
  
  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [modalMode, setModalMode] = useState<'create' | 'edit'>('create')
  const [editingUserId, setEditingUserId] = useState<string | null>(null)
  
  // Form state
  const [formData, setFormData] = useState({
    email: '',
    fullname: '',
    password: '',
    passwordConfirm: '',
    role_level: 1,
    department: 'Kỹ thuật (NVKT)'
  })
  const [formError, setFormError] = useState('')
  const [formSuccess, setFormSuccess] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Fetch users from PocketBase
  const fetchUsers = async () => {
    setIsLoading(true)
    try {
      const records = await pb.collection('users').getFullList<UserRecord>({
        sort: '-created'
      })
      setUsers(records)
    } catch (err: any) {
      console.error('[PocketBase fetch users error]:', err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // Khi thay đổi Role Level trong Form -> Tự động tính toán lại danh mục phòng ban và reset department hợp lệ
  const handleRoleChange = (newLevel: number) => {
    const availableDepts = getDepartmentsByLevel(newLevel)
    const currentDeptValid = availableDepts.includes(formData.department)
    
    setFormData(prev => ({
      ...prev,
      role_level: newLevel,
      department: currentDeptValid ? prev.department : (availableDepts[0] || '')
    }))
  }

  // Mở modal tạo mới
  const handleOpenCreate = () => {
    setModalMode('create')
    setEditingUserId(null)
    setFormData({
      email: '',
      fullname: '',
      password: '',
      passwordConfirm: '',
      role_level: 1,
      department: 'Kỹ thuật (NVKT)'
    })
    setFormError('')
    setFormSuccess('')
    setIsModalOpen(true)
  }

  // Mở modal chỉnh sửa
  const handleOpenEdit = (user: UserRecord) => {
    setModalMode('edit')
    setEditingUserId(user.id)
    const userRole = user.role_level || 1
    const availableDepts = getDepartmentsByLevel(userRole)
    const dept = user.department && availableDepts.includes(user.department) 
      ? user.department 
      : (availableDepts[0] || user.department || '')

    setFormData({
      email: user.email || '',
      fullname: user.fullname || '',
      password: '',
      passwordConfirm: '',
      role_level: userRole,
      department: dept
    })
    setFormError('')
    setFormSuccess('')
    setIsModalOpen(true)
  }

  // Xử lý Lưu Form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setFormError('')
    setFormSuccess('')
    setIsSubmitting(true)

    try {
      // 1. Kiểm tra validation phòng ban phụ thuộc vào level
      const availableDepts = getDepartmentsByLevel(formData.role_level)
      if (formData.role_level !== 7 && !availableDepts.includes(formData.department)) {
        throw new Error(`Phòng ban "${formData.department}" không hợp lệ cho Level ${formData.role_level}.`)
      }

      if (modalMode === 'create') {
        if (!formData.password || formData.password.length < 8) {
          throw new Error('Mật khẩu bắt buộc tối thiểu 8 ký tự.')
        }
        if (formData.password !== formData.passwordConfirm) {
          throw new Error('Mật khẩu xác nhận không khớp.')
        }

        await pb.collection('users').create({
          email: formData.email,
          fullname: formData.fullname,
          password: formData.password,
          passwordConfirm: formData.passwordConfirm,
          role_level: formData.role_level,
          department: formData.department,
          emailVisibility: true
        })

        setFormSuccess('Tạo tài khoản người dùng thành công!')
      } else if (modalMode === 'edit' && editingUserId) {
        const updatePayload: any = {
          fullname: formData.fullname,
          role_level: formData.role_level,
          department: formData.department
        }

        // Đổi mật khẩu nếu có nhập
        if (formData.password) {
          if (formData.password.length < 8) {
            throw new Error('Mật khẩu mới bắt buộc tối thiểu 8 ký tự.')
          }
          if (formData.password !== formData.passwordConfirm) {
            throw new Error('Mật khẩu xác nhận không khớp.')
          }
          updatePayload.password = formData.password
          updatePayload.passwordConfirm = formData.passwordConfirm
        }

        await pb.collection('users').update(editingUserId, updatePayload)
        setFormSuccess('Cập nhật thông tin phân quyền thành công!')
      }

      await fetchUsers()
      setTimeout(() => {
        setIsModalOpen(false)
      }, 1000)
    } catch (err: any) {
      console.error('[User save error]:', err)
      setFormError(err.message || 'Thao tác thất bại. Vui lòng kiểm tra lại thông tin.')
    } finally {
      setIsSubmitting(false)
    }
  }

  // Xóa user
  const handleDeleteUser = async (userId: string, userEmail: string) => {
    if (confirm(`Bạn có chắc chắn muốn xóa tài khoản ${userEmail}?`)) {
      try {
        await pb.collection('users').delete(userId)
        await fetchUsers()
      } catch (err: any) {
        alert('Xóa tài khoản thất bại: ' + err.message)
      }
    }
  }

  // Lọc danh sách
  const filteredUsers = users.filter(u => {
    const matchesSearch = 
      (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.fullname && u.fullname.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (u.department && u.department.toLowerCase().includes(searchQuery.toLowerCase()))
    
    const matchesRole = roleFilter === 'ALL' || u.role_level === roleFilter
    return matchesSearch && matchesRole
  })

  // Lấy danh sách phòng ban tương ứng với Level đang chọn trong Form
  const currentAvailableDepts = getDepartmentsByLevel(formData.role_level)

  return (
    <div className="space-y-5 select-none animate-in fade-in duration-300">
      {/* HEADER CARD */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-lg rounded-2xl">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/15 text-primary">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <CardTitle className="text-lg font-bold text-foreground">
                  Quản Trị Người Dùng & Phân Quyền 7 Cấp
                </CardTitle>
              </div>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                Phân quyền theo cấp bậc (Level 1 - 7). Danh mục phòng ban được tự động lọc và ẩn hoàn toàn các lựa chọn không tương thích.
              </CardDescription>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchUsers}
                disabled={isLoading}
                className="h-9 px-3 rounded-xl border-border hover:bg-muted/50 cursor-pointer text-xs font-semibold gap-1.5"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                <span>Làm mới</span>
              </Button>

              <Button
                size="sm"
                onClick={handleOpenCreate}
                className="h-9 px-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground cursor-pointer text-xs font-bold gap-1.5 shadow-md shadow-primary/20"
              >
                <UserPlus className="w-4 h-4" />
                <span>Thêm User Mới</span>
              </Button>
            </div>
          </div>
        </CardHeader>

        {/* SEARCH & FILTER BAR */}
        <CardContent className="pt-0">
          <div className="flex flex-col sm:flex-row items-center gap-3">
            <div className="relative flex-1 w-full">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Tìm theo email, họ tên, phòng ban..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-9 rounded-xl text-xs bg-background/80 border-border"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <span className="text-xs text-muted-foreground whitespace-nowrap font-medium">Cấp bậc:</span>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value === 'ALL' ? 'ALL' : Number(e.target.value))}
                className="h-9 px-3 rounded-xl text-xs bg-background border border-border text-foreground font-medium focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer w-full sm:w-auto"
              >
                <option value="ALL">Tất cả cấp bậc (1 - 7)</option>
                {Object.values(RBAC_ROLES).map(r => (
                  <option key={r.level} value={r.level}>
                    Level {r.level}: {r.title}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* USERS LIST TABLE */}
      <Card className="border-border/60 bg-card/60 backdrop-blur-md shadow-lg rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/40 text-muted-foreground font-bold border-b border-border/50 uppercase tracking-wider">
              <tr>
                <th className="p-3.5 pl-5">Người Dùng</th>
                <th className="p-3.5">Cấp Bậc (Role Level)</th>
                <th className="p-3.5">Phòng Ban (Department)</th>
                <th className="p-3.5">Trạng Thái Phân Quyền</th>
                <th className="p-3.5 pr-5 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/30">
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    <div className="flex items-center justify-center gap-2">
                      <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                      <span>Đang tải danh sách người dùng...</span>
                    </div>
                  </td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">
                    Không tìm thấy người dùng nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredUsers.map((user) => {
                  const roleDef = getRoleDefinition(user.role_level || 1)
                  return (
                    <tr key={user.id} className="hover:bg-muted/20 transition-colors">
                      <td className="p-3.5 pl-5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center font-bold text-primary text-xs">
                            {(user.fullname || user.email || 'U')[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="font-bold text-foreground">{user.fullname || 'Chưa đặt tên'}</div>
                            <div className="text-[11px] text-muted-foreground font-mono">{user.email}</div>
                          </div>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          user.role_level === 7 ? 'bg-amber-500/15 border-amber-500/30 text-amber-400' :
                          user.role_level === 6 ? 'bg-purple-500/15 border-purple-500/30 text-purple-400' :
                          user.role_level === 5 ? 'bg-indigo-500/15 border-indigo-500/30 text-indigo-400' :
                          user.role_level === 4 ? 'bg-blue-500/15 border-blue-500/30 text-blue-400' :
                          user.role_level === 3 ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400' :
                          'bg-muted border-border text-muted-foreground'
                        }`}>
                          <ShieldCheck className="w-3.5 h-3.5" />
                          Level {user.role_level || 1}: {roleDef.title}
                        </span>
                      </td>

                      <td className="p-3.5">
                        <div className="flex items-center gap-1.5 font-medium text-foreground">
                          <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
                          <span>{user.department || 'Chưa gán'}</span>
                        </div>
                      </td>

                      <td className="p-3.5">
                        <div className="text-[11px] text-muted-foreground">
                          {roleDef.canViewAllEmployees ? 'Toàn quyền NV chi nhánh' : 'Xem NV nhóm/cá nhân'}
                        </div>
                      </td>

                      <td className="p-3.5 pr-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenEdit(user)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-primary/15 hover:text-primary cursor-pointer"
                            title="Chỉnh sửa phân quyền"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteUser(user.id, user.email)}
                            className="h-8 w-8 p-0 rounded-lg hover:bg-destructive/15 hover:text-destructive cursor-pointer"
                            title="Xóa tài khoản"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* 🚀 MODAL TẠO / SỬA USER VỚI DROPDOWN PHÒNG BAN TỰ ĐỘNG ẨN TUYỆT ĐỐI */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="bg-card border border-border shadow-2xl rounded-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="px-5 py-4 border-b border-border flex items-center justify-between bg-muted/20">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-primary/15 text-primary">
                  {modalMode === 'create' ? <UserPlus className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                </div>
                <div>
                  <h3 className="font-bold text-foreground text-sm">
                    {modalMode === 'create' ? 'Tạo Tài Khoản & Phân Quyền Mới' : 'Cập Nhật Tài Khoản & Phân Quyền'}
                  </h3>
                  <p className="text-[11px] text-muted-foreground">
                    {modalMode === 'create' ? 'Điền thông tin và chọn cấp bậc' : `Đang sửa: ${formData.email}`}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted/50 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* Họ tên & Email */}
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
                    <User className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Họ và tên</span>
                  </label>
                  <Input
                    placeholder="Nguyễn Văn A"
                    value={formData.fullname}
                    onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                    required
                    className="h-9 rounded-xl text-xs bg-background border-border"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Email tài khoản</span>
                  </label>
                  <Input
                    type="email"
                    placeholder="user@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={modalMode === 'edit'}
                    required
                    className="h-9 rounded-xl text-xs bg-background border-border disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Mật khẩu */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>{modalMode === 'create' ? 'Mật khẩu' : 'Đổi mật khẩu mới (nếu có)'}</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="Tối thiểu 8 ký tự"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={modalMode === 'create'}
                    className="h-9 rounded-xl text-xs bg-background border-border"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-foreground flex items-center gap-1.5 mb-1">
                    <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Xác nhận mật khẩu</span>
                  </label>
                  <Input
                    type="password"
                    placeholder="Nhập lại mật khẩu"
                    value={formData.passwordConfirm}
                    onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                    required={modalMode === 'create' || !!formData.password}
                    className="h-9 rounded-xl text-xs bg-background border-border"
                  />
                </div>
              </div>

              {/* 👑 CẤP BẬC (ROLE LEVEL 1 -> 7) */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-primary" />
                    <span>Cấp bậc Phân quyền (Role Level)</span>
                  </span>
                  <span className="text-[10px] text-primary font-bold">Level {formData.role_level}</span>
                </label>
                <select
                  value={formData.role_level}
                  onChange={(e) => handleRoleChange(Number(e.target.value))}
                  className="w-full h-9 px-3 rounded-xl text-xs bg-background border border-primary/40 text-foreground font-bold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {Object.values(RBAC_ROLES).map(r => (
                    <option key={r.level} value={r.level}>
                      Level {r.level}: {r.title} - {r.code}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-muted-foreground italic">
                  {getRoleDefinition(formData.role_level).description}
                </p>
              </div>

              {/* 🏢 PHÒNG BAN (DEPARTMENT) - CHỈ HIỆN PHÒNG BAN THUỘC LEVEL NÀY, ẨN TẤT CẢ PHÒNG BAN KHÁC */}
              <div className="space-y-1.5 p-3 rounded-xl bg-muted/20 border border-border/60">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                    <span>Phòng Ban tương ứng (Department)</span>
                  </span>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                    {formData.role_level === 7 ? 'Toàn quyền (Level 7)' : `${currentAvailableDepts.length} lựa chọn`}
                  </span>
                </label>

                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  required
                  className="w-full h-9 px-3 rounded-xl text-xs bg-background border border-border text-foreground font-semibold focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
                >
                  {currentAvailableDepts.map(dept => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>

                <p className="text-[10px] text-muted-foreground">
                  {formData.role_level === 7 
                    ? '✨ Super Admin (Level 7) có thể chọn mọi phòng ban trên toàn hệ thống.'
                    : `🔒 Đã ẩn toàn bộ các phòng ban không thuộc Level ${formData.role_level}.`}
                </p>
              </div>

              {/* Error & Success Messages */}
              {formError && (
                <div className="p-2.5 rounded-xl bg-destructive/15 border border-destructive/30 text-destructive text-xs font-medium flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{formError}</span>
                </div>
              )}
              {formSuccess && (
                <div className="p-2.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-medium flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  <span>{formSuccess}</span>
                </div>
              )}

              {/* Modal Actions */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setIsModalOpen(false)}
                  className="h-9 px-4 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Hủy bỏ
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={isSubmitting}
                  className="h-9 px-5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs cursor-pointer shadow-md"
                >
                  {isSubmitting ? 'Đang lưu...' : (modalMode === 'create' ? 'Tạo Người Dùng' : 'Lưu Thay Đổi')}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
