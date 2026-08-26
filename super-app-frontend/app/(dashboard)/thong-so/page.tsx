'use client'

import React, { useState, useMemo, useCallback, useRef } from 'react'
import { Report } from 'powerbi-client'
import BiSidebar, { BI_REPORT_PAGES } from '@/components/bi-dashboard/bi-sidebar'
import BiHeader from '@/components/bi-dashboard/bi-header'
import AiInsightPanel from '@/components/bi-dashboard/ai-insight-panel'
import LandscapeOverlay from '@/components/bi-dashboard/landscape-overlay'
import PowerBIReportEmbed from '@/components/bi-dashboard/powerbi-report-embed'
import { getSectionIdBySlug, getSlugBySectionId } from '@/lib/powerbi-config'

export default function BiDashboardPage() {
  const [activePageId, setActivePageId] = useState<string>('tong-hop')
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(false)
  const reportInstanceRef = useRef<Report | null>(null)

  // Active Report Page Info
  const activeReport = useMemo(() => {
    return BI_REPORT_PAGES.find((p) => p.id === activePageId) || BI_REPORT_PAGES[5] // 'tong-hop'
  }, [activePageId])

  // Active Section ID for Power BI SDK
  const activeSectionId = useMemo(() => {
    return getSectionIdBySlug(activePageId)
  }, [activePageId])

  // Handle seamless page selection from Sidebar without full page reload
  const handleSelectPage = useCallback((slug: string) => {
    setActivePageId(slug)
    const targetSectionId = getSectionIdBySlug(slug)

    if (reportInstanceRef.current) {
      reportInstanceRef.current.setPage(targetSectionId).catch((err) => {
        console.warn(`[PowerBI] report.setPage(${targetSectionId}) failed:`, err)
      })
    }
  }, [])

  // Handle internal Power BI page change event to keep UI state in sync
  const handlePageChanged = useCallback((newPageSectionId: string) => {
    const slug = getSlugBySectionId(newPageSectionId)
    setActivePageId(slug)
  }, [])

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full h-full min-h-0 relative overflow-hidden bg-background">
      
      {/* 📱 CẢNH BÁO XOAY NGANG THIẾT BỊ DI ĐỘNG/TABLET CHẾ ĐỘ DỌC */}
      <LandscapeOverlay />

      {/* 1. LEFT POWER BI SIDEBAR (COLLAPSIBLE ON PC & MOBILE) */}
      <BiSidebar
        activePageId={activePageId}
        onSelectPage={handleSelectPage}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
      />

      {/* 2. MAIN REPORT CANVAS AREA */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        
        {/* TOP BI HEADER (DECOUPLED - KHÔNG CHỨA BỘ LỌC DUAL-TRIGGER) */}
        <BiHeader
          reportTitle={activeReport.name}
        />

        {/* WORKSPACE CANVAS */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden p-2 sm:p-2.5 bg-muted/20 space-y-2.5 flex flex-col">
          
          {/* 🤖 KHỐI AI EXECUTIVE ANALYTICS (MINIAPP ĐỘC LẬP VỚI HỆ THỐNG PHÂN QUYỀN RBAC NỘI BỘ) */}
          <div className="w-full flex-shrink-0">
            <AiInsightPanel
              pageId={activePageId}
              metricTitle={`Báo Cáo ${activeReport.name} - Vận Hành Hệ Thống`}
              initialUserLevel={4}
            />
          </div>

          {/* 📊 POWER BI EMBED COMPONENT (MINIAPP ĐỘC LẬP TƯƠNG TÁC THEO SECTION BÁO CÁO) */}
          <div className="w-full aspect-[16/9] min-h-[200px] max-h-[300px] sm:aspect-[16/9] sm:min-h-[320px] sm:max-h-[460px] md:flex-1 md:aspect-[2/1] md:min-h-[540px] md:max-h-[820px] rounded-xl overflow-hidden bg-card border border-border/80 shadow-md flex-shrink-0 md:flex-shrink">
            <PowerBIReportEmbed
              activeSectionId={activeSectionId}
              onReportReady={(report) => {
                reportInstanceRef.current = report
              }}
              onPageChanged={handlePageChanged}
              className="w-full h-full border-none"
            />
          </div>
        </div>

      </div>

    </div>
  )
}
