'use client'

import React from 'react'
import BaseDashboard, { BaseDashboardProps } from '@/components/blocks/base-dashboard'

export interface ChiNhanhMiniappProps extends Partial<BaseDashboardProps> {
  userLevel?: number
}

/**
 * 🌐 CHI NHÁNH MINIAPP COMPONENT (KẾ THỪA BASE DASHBOARD)
 * Hiển thị Dashboard toàn Chi Nhánh (Không có bộ lọc cá nhân).
 */
export default function ChiNhanhMiniapp({
  userLevel = 1,
  ...props
}: ChiNhanhMiniappProps) {
  return (
    <BaseDashboard
      viewType="chi_nhanh"
      userLevel={userLevel}
      {...props}
    />
  )
}
