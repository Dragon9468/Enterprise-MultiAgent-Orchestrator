/**
 * 👑 HỆ THỐNG PHÂN QUYỀN RBAC PHÂN CẤP (HIERARCHICAL RBAC SYSTEM) - ENTERPRISE SUPER APP
 * Chuẩn hóa kiến trúc phân quyền và liên kết danh mục Phòng ban theo từng Level.
 */

export interface RoleDefinition {
  level: number
  code: string
  title: string
  description: string
  departments: string[]
  canViewAllEmployees: boolean
  canViewAllAreas: boolean
  canAccessAdminTools: boolean
}

export const RBAC_ROLES: Record<number, RoleDefinition> = {
  1: {
    level: 1,
    code: 'EMPLOYEE',
    title: 'Nhân viên',
    description: 'Nhân viên kỹ thuật (NVKT), kinh doanh, CSKH - Chỉ xem chỉ số cá nhân của chính mình',
    departments: [
      'Kỹ thuật (NVKT)',
      'Kinh doanh (Sales)',
      'Chăm sóc Khách hàng (CSKH)',
      'Thu ngân / Quầy giao dịch'
    ],
    canViewAllEmployees: false,
    canViewAllAreas: false,
    canAccessAdminTools: false
  },
  2: {
    level: 2,
    code: 'SPECIALIST',
    title: 'Chuyên viên (Dư địa Scale-up)',
    description: 'Cấp độ dự phòng cho Chuyên viên kỹ thuật bậc cao / Cán bộ chuyên trách',
    departments: [
      'Chuyên viên Kỹ thuật Hệ thống',
      'Chuyên viên Kinh doanh Dự án',
      'Chuyên viên Quản trị Chất lượng'
    ],
    canViewAllEmployees: false,
    canViewAllAreas: false,
    canAccessAdminTools: false
  },
  3: {
    level: 3,
    code: 'TEAM_LEAD',
    title: 'Trưởng nhóm / Điều hành Khu vực',
    description: 'Quản lý đội ngũ NVKT theo từng khu vực điều hành (TAIHD, TANNVN, BinhPB, HuyTH)',
    departments: [
      'Điều hành Kỹ thuật Khu vực',
      'Trưởng nhóm Kinh doanh',
      'Trưởng nhóm Chăm sóc Khách hàng'
    ],
    canViewAllEmployees: false, // Xem nhân viên trong khu vực quản lý
    canViewAllAreas: false,     // Xem khu vực quản lý
    canAccessAdminTools: false
  },
  4: {
    level: 4,
    code: 'DEPARTMENT_HEAD',
    title: 'Trưởng phòng',
    description: 'Trưởng các phòng ban chức năng - Xem toàn bộ nhân viên và khu vực thuộc phạm vi',
    departments: [
      'Phòng Kỹ thuật (TIN/PNC)',
      'Phòng Kinh doanh',
      'Phòng Chăm sóc Khách hàng',
      'Phòng Kế toán - Tổng hợp'
    ],
    canViewAllEmployees: true,
    canViewAllAreas: true,
    canAccessAdminTools: false
  },
  5: {
    level: 5,
    code: 'DIRECTOR',
    title: 'Giám đốc',
    description: 'Ban Giám Đốc Chi nhánh - Toàn quyền xem toàn bộ số liệu và báo cáo phân tích',
    departments: [
      'Ban Giám Đốc Chi Nhánh',
      'Phó Giám Đốc Chi Nhánh'
    ],
    canViewAllEmployees: true,
    canViewAllAreas: true,
    canAccessAdminTools: false
  },
  6: {
    level: 6,
    code: 'SYS_ADMIN',
    title: 'Phó Quản trị / Kỹ thuật Hệ thống',
    description: 'Quản trị kỹ thuật SuperApp, truy cập Giám sát, Bảo mật, Sandbox',
    departments: [
      'Ban Công nghệ & Hạ tầng Hệ thống (IT/Infra)'
    ],
    canViewAllEmployees: true,
    canViewAllAreas: true,
    canAccessAdminTools: true
  },
  7: {
    level: 7,
    code: 'SUPER_ADMIN',
    title: 'Super Admin / Quản trị Tối cao',
    description: 'Toàn quyền tối cao hệ thống, quản trị Database, Metric Dictionary, RBAC',
    departments: [
      'Ban Quản trị Tối cao'
    ],
    canViewAllEmployees: true,
    canViewAllAreas: true,
    canAccessAdminTools: true
  }
}

export function getRoleDefinition(level: number): RoleDefinition {
  return RBAC_ROLES[level] || RBAC_ROLES[1]
}

/**
 * Lấy danh sách phòng ban tương ứng cho từng Level:
 * - Đối với Level 1 đến 6: Chỉ trả về danh mục phòng ban của Level đó (các phòng ban khác bị ẩn hoàn toàn).
 * - Riêng Level 7 (Super Admin): Trả về TOÀN BỘ danh sách phòng ban trên toàn hệ thống.
 */
export function getDepartmentsByLevel(level: number): string[] {
  if (level === 7) {
    const allDepts = new Set<string>()
    Object.values(RBAC_ROLES).forEach(role => {
      role.departments.forEach(dept => allDepts.add(dept))
    })
    return Array.from(allDepts)
  }
  const role = getRoleDefinition(level)
  return role.departments
}
