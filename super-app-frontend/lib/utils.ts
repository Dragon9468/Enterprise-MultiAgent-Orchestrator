import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * 🧹 Lọc bỏ tiền tố 'HUETI.' (không phân biệt hoa thường) khỏi mã nhân viên để hiển thị UI gọn gàng.
 * Ví dụ: 'HUETI.ANHNV21' -> 'ANHNV21', 'hueti.huyhc' -> 'HUYHC', 'ANHNV21' -> 'ANHNV21'
 */
export function cleanEmpId(id?: string | null): string {
  if (!id) return ''
  return String(id).replace(/^HUETI\./i, '').trim().toUpperCase()
}

/**
 * 🗄️ Chuẩn hóa mã nhân viên về định dạng CSDL Supabase (luôn có tiền tố 'HUETI.').
 * Ví dụ: 'ANHNV21' -> 'HUETI.ANHNV21', 'HUETI.ANHNV21' -> 'HUETI.ANHNV21'
 */
export function toDbEmpId(id?: string | null): string {
  if (!id) return ''
  const clean = cleanEmpId(id)
  return clean ? `HUETI.${clean}` : ''
}

