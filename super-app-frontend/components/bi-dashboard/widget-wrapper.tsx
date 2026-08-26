'use client'

import React, { ReactNode } from 'react'
import { GripHorizontal, RefreshCw } from 'lucide-react'

interface WidgetWrapperProps {
  id: string
  title: string
  subtitle?: string
  badge?: string
  badgeVariant?: 'default' | 'success' | 'warning' | 'danger' | 'purple'
  children: ReactNode
  onRefresh?: () => void
  isDraggable?: boolean
  metricId?: string
  detailHref?: string
}

export default function WidgetWrapper({
  id,
  title,
  subtitle,
  badge,
  badgeVariant = 'default',
  children,
  onRefresh,
  isDraggable = true
}: WidgetWrapperProps) {
  return (
    <div className="w-full h-full flex flex-col bg-card/95 border border-border/70 rounded-none shadow-xs overflow-hidden select-none group relative">
      
      {/* 🧭 ULTRA-COMPACT WIDGET HEADER (POWER BI NATIVE HEADER STYLE) */}
      <div className="flex items-center justify-between px-2 py-1 bg-muted/40 border-b border-border/50 flex-shrink-0">
        
        {/* Left: Drag Handle & Title */}
        <div className="flex items-center gap-1.5 overflow-hidden">
          {isDraggable && (
            <div 
              className="drag-handle p-0.5 text-muted-foreground/60 hover:text-primary cursor-grab active:cursor-grabbing rounded transition-colors flex-shrink-0"
              title="Kéo thả vị trí"
            >
              <GripHorizontal className="w-3.5 h-3.5" />
            </div>
          )}

          <div className="flex items-center gap-1.5 overflow-hidden">
            <h3 className="font-bold text-xs text-foreground truncate tracking-tight">
              {title}
            </h3>
            {badge && (
              <span className="text-[10px] font-semibold text-primary/80 truncate">
                • {badge}
              </span>
            )}
          </div>
        </div>

        {/* Right: Refresh button if provided */}
        {onRefresh && (
          <button
            onClick={onRefresh}
            className="p-0.5 text-muted-foreground hover:text-foreground transition-colors cursor-pointer flex-shrink-0"
            title="Làm mới"
          >
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* 📊 WIDGET BODY CONTENT (ZERO PADDING, 100% FILL) */}
      <div className="flex-1 p-1 overflow-hidden min-h-0 flex flex-col">
        {children}
      </div>

    </div>
  )
}
