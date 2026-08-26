/// <reference path="../pb_data/types.d.ts" />

/**
 * 🛡️ POCKETBASE RBAC VALIDATION HOOK
 * Ràng buộc nghiêm ngặt: Department bắt buộc phải phụ thuộc và tương thích với Role Level (1 -> 7).
 * - Ngoại trừ Level 7 (Super Admin) có thể set thành MỌI department.
 * - Các level từ 1 đến 6 bắt buộc phải chọn đúng danh mục phòng ban của level đó.
 */

const ROLE_DEPARTMENTS = {
  1: [
    'Kỹ thuật (NVKT)',
    'Kinh doanh (Sales)',
    'Chăm sóc Khách hàng (CSKH)',
    'Thu ngân / Quầy giao dịch',
    'Kỹ thuật',
    'Kinh doanh',
    'CSKH'
  ],
  2: [
    'Chuyên viên Kỹ thuật Hệ thống',
    'Chuyên viên Kinh doanh Dự án',
    'Chuyên viên Quản trị Chất lượng'
  ],
  3: [
    'Điều hành Kỹ thuật Khu vực',
    'Trưởng nhóm Kinh doanh',
    'Trưởng nhóm Chăm sóc Khách hàng'
  ],
  4: [
    'Phòng Kỹ thuật (TIN/PNC)',
    'Phòng Kinh doanh',
    'Phòng Chăm sóc Khách hàng',
    'Phòng Kế toán - Tổng hợp'
  ],
  5: [
    'Ban Giám Đốc Chi Nhánh',
    'Phó Giám Đốc Chi Nhánh'
  ],
  6: [
    'Ban Công nghệ & Hạ tầng Hệ thống (IT/Infra)'
  ],
  7: [
    'Ban Quản trị Tối cao'
  ]
};

onRecordValidate((e) => {
  const roleLevel = e.record.getInt("role_level") || 1;
  const dept = e.record.getString("department");
  
  // 👑 NGOẠI TRỪ LEVEL 7: ĐƯỢC PHÉP CHỌN MỌI PHÒNG BAN
  if (roleLevel === 7) {
    e.next();
    return;
  }
  
  if (dept) {
    const allowed = ROLE_DEPARTMENTS[roleLevel] || [];
    const isMatch = allowed.some((d) => d.toLowerCase() === dept.trim().toLowerCase());
    
    if (!isMatch) {
      throw new BadRequestError(
        `Phòng ban "${dept}" không tương thích với Level ${roleLevel}. Các phòng ban hợp lệ cho Level ${roleLevel} là: ${allowed.join(' | ')}`
      );
    }
  }
  
  e.next();
}, "users");
