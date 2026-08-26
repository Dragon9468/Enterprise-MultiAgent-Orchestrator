'use client'

import React from 'react'
import { 
  X, Check, Eye, EyeOff, SlidersHorizontal, RotateCcw, 
  Wrench, MapPin, Server, Radio, BarChart3, Sparkles 
} from 'lucide-react'
import { ALL_AVAILABLE_WIDGETS, AvailableWidgetInfo } from '@/lib/layout-utils'

interface WidgetCustomizerModalProps {
  isOpen: boolean
  onClose: () => void
  visibleWidgetIds: string[]
  onToggleWidget: (id: string) => void
  onResetDefaults: () => void
}

const WIDGET_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  'widget-tay-nghe': Wrench,
  'widget-khu-vuc': MapPin,
  'widget-ha-tang': Server,
  'widget-suy-hao': Radio
}

export default function WidgetCustomizerModal({
  isOpen,
  onClose,
  visibleWidgetIds,
  onToggleWidget,
  onResetDefaults
}: WidgetCustomizerModalProps) {
  if (!isOpen) return null

  const totalActive = visibleWidgetIds.length
  const totalWidgets = ALL_AVAILABLE_WIDGETS.length

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-200">
      
      {/* Backdrop click to close */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Card */}
      <div className="relative w-full max-w-lg bg-card/95 backdrop-blur-2xl border border-primary/30 rounded-2xl shadow-2xl overflow-hidden flex flex-col z-10 animate-in zoom-in-95 duration-200">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border/80 bg-primary/10">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-primary text-primary-foreground shadow-md shadow-primary/30">
              <SlidersHorizontal className="w-4 h-4" />
            </div>
            <div>
              <h2 className="font-extrabold text-sm text-foreground">
                Tùy chỉnh Hiển thị Biểu đồ
              </h2>
              <p className="text-[11px] text-muted-foreground">
                Bật hoặc tắt các khối báo cáo trên trang Tổng Hợp ({totalActive}/{totalWidgets} đang hiển thị)
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-xl text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body: List of Widgets with Switches */}
        <div className="p-4 sm:p-5 space-y-3 overflow-y-auto max-h-[420px]">
          {ALL_AVAILABLE_WIDGETS.map((widget) => {
            const isVisible = visibleWidgetIds.includes(widget.id)
            const IconComp = WIDGET_ICONS[widget.id] || BarChart3

            return (
              <div
                key={widget.id}
                onClick={() => onToggleWidget(widget.id)}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isVisible
                    ? 'bg-card border-primary/40 shadow-xs hover:border-primary/60'
                    : 'bg-muted/30 border-border/60 opacity-60 hover:opacity-100'
                }`}
              >
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className={`p-2 rounded-xl border flex-shrink-0 ${
                    isVisible
                      ? 'bg-primary/10 text-primary border-primary/30'
                      : 'bg-muted text-muted-foreground border-border/60'
                  }`}>
                    <IconComp className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col overflow-hidden">
                    <span className={`text-xs font-bold truncate ${isVisible ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {widget.name}
                    </span>
                    <span className="text-[11px] text-muted-foreground line-clamp-1">
                      {widget.description}
                    </span>
                  </div>
                </div>

                {/* Custom Toggle Switch */}
                <div className="flex items-center pl-3 flex-shrink-0">
                  <div className={`w-11 h-6 flex items-center rounded-full p-1 transition-colors ${
                    isVisible ? 'bg-primary justify-end' : 'bg-muted-foreground/30 justify-start'
                  }`}>
                    <div className="w-4 h-4 rounded-full bg-white shadow-md transition-transform" />
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-5 py-3.5 border-t border-border/80 bg-muted/20">
          <button
            onClick={onResetDefaults}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Mặc định (Hiện tất cả)</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-primary text-primary-foreground font-bold text-xs shadow-md shadow-primary/30 hover:bg-primary/90 transition-all cursor-pointer"
          >
            Xong
          </button>
        </div>

      </div>

    </div>
  )
}
