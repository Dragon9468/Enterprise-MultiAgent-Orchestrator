import React, { ReactNode } from 'react'

export const metadata = {
  title: 'Power BI Dashboard — Thông số Vận hành',
  description: 'Hệ thống BI Dashboard phân tích chỉ số kỹ thuật và vận hành Doanh nghiệp',
}

export default function ThongSoLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex-1 flex flex-col w-full h-full min-h-0 relative overflow-hidden">
      {children}
    </div>
  )
}
