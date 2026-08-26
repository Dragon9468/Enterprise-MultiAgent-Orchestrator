'use client'

import React from 'react'
import { BarChart2 } from 'lucide-react'

interface BiHeaderProps {
  reportTitle: string
}

export default function BiHeader({
  reportTitle
}: BiHeaderProps) {
  return (
    <div className="w-full bg-card/90 border-b border-border/80 px-3 py-2 sm:px-4 flex items-center justify-between gap-2 z-10 select-none flex-shrink-0">
      
      {/* Left: Report Title & Breadcrumb */}
      <div className="flex items-center gap-2 overflow-hidden">
        <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
          <BarChart2 className="w-4 h-4" />
        </div>
        <div className="flex items-center gap-1.5 overflow-hidden">
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Báo Cáo BI
          </span>
          <span className="text-muted-foreground/40 text-xs">/</span>
          <h1 className="text-xs sm:text-sm font-extrabold text-foreground truncate">
            {reportTitle}
          </h1>
        </div>
      </div>

    </div>
  )
}
