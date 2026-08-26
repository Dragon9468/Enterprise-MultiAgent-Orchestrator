'use client'

import React, { useEffect, useState, useRef } from 'react'
import { PBI_REPORT_CONFIG } from '@/lib/powerbi-config'

interface PowerBIReportEmbedProps {
  activeSectionId: string
  activeFilter?: string
  activeEmployee?: string
  onReportReady?: (report: any) => void
  onPageChanged?: (newPageName: string) => void
  className?: string
}

export default function PowerBIReportEmbed({
  activeSectionId,
  activeFilter = 'All',
  activeEmployee = 'All',
  onReportReady,
  onPageChanged,
  className = 'w-full h-full'
}: PowerBIReportEmbedProps) {
  const [tokenData, setTokenData] = useState<{
    accessToken: string
    reportId: string
    embedUrl: string
    isAutoAuth: boolean
  } | null>(null)
  const [loading, setLoading] = useState(true)
  const iframeRef = useRef<HTMLIFrameElement | null>(null)

  // 1. Fetch Power BI token / config from API Route
  useEffect(() => {
    let isCancelled = false

    async function fetchToken() {
      try {
        const res = await fetch('/api/powerbi/token')
        if (res.ok) {
          const json = await res.json()
          if (!isCancelled && json.success) {
            setTokenData({
              accessToken: json.accessToken || '',
              reportId: json.reportId || PBI_REPORT_CONFIG.reportId,
              embedUrl: json.embedUrl || PBI_REPORT_CONFIG.embedUrl,
              isAutoAuth: json.isAutoAuth ?? !json.accessToken
            })
            setLoading(false)
            return
          }
        }
      } catch (err) {
        console.warn('[PowerBIEmbed] Token fetch failed, falling back to autoAuth:', err)
      }

      if (!isCancelled) {
        setTokenData({
          accessToken: '',
          reportId: PBI_REPORT_CONFIG.reportId,
          embedUrl: PBI_REPORT_CONFIG.embedUrl,
          isAutoAuth: true
        })
        setLoading(false)
      }
    }

    fetchToken()

    return () => {
      isCancelled = true
    }
  }, [])

  // 2. Seamless postMessage dispatch on Page Switch or Filter change (Viên đạn số 1)
  useEffect(() => {
    if (!iframeRef.current || !iframeRef.current.contentWindow) return

    try {
      const targetWindow = iframeRef.current.contentWindow

      // A. Đổi trang qua postMessage chuẩn Microsoft Developer Playground
      if (activeSectionId) {
        targetWindow.postMessage(
          JSON.stringify({
            action: 'setPage',
            pageName: activeSectionId
          }),
          '*'
        )

        targetWindow.postMessage(
          {
            method: 'PUT',
            url: '/report/pages/active',
            headers: {},
            body: {
              name: activeSectionId,
              displayName: null,
              isActive: true
            }
          },
          '*'
        )
      }

      // B. Áp dụng Bộ Lọc qua postMessage (Table: "Nhân Sự", Column: "Điều Hành")
      const pbiFilters: any[] = []
      if (activeFilter && activeFilter !== 'All' && activeFilter !== '') {
        pbiFilters.push({
          $schema: 'http://powerbi.com/product/schema#basic',
          target: {
            table: 'Nhân Sự',
            column: 'Điều Hành'
          },
          operator: 'In',
          values: [activeFilter],
          filterType: 1
        })
      }
      if (activeEmployee && activeEmployee !== 'All' && activeEmployee !== '') {
        pbiFilters.push({
          $schema: 'http://powerbi.com/product/schema#basic',
          target: {
            table: 'Nhân Sự',
            column: 'Nhân Viên'
          },
          operator: 'In',
          values: [activeEmployee],
          filterType: 1
        })
      }

      targetWindow.postMessage(
        JSON.stringify({
          action: 'setFilters',
          filters: pbiFilters
        }),
        '*'
      )

      targetWindow.postMessage(
        {
          method: 'PUT',
          url: '/report/filters',
          headers: {},
          body: pbiFilters
        },
        '*'
      )
    } catch (e) {
      console.warn('[PowerBIEmbed] postMessage to iframe failed:', e)
    }
  }, [activeSectionId, activeFilter, activeEmployee])

  // Build the complete embed URL with &pageName and &filter parameter (chuẩn Microsoft &filter=)
  const currentEmbedUrl = React.useMemo(() => {
    const reportId = tokenData?.reportId || PBI_REPORT_CONFIG.reportId
    let url = `https://app.powerbi.com/reportEmbed?reportId=${reportId}&autoAuth=true&ctid=a4422c98-da53-4ae3-8295-f80b5642762f&navContentPaneEnabled=false&filterPaneEnabled=false`

    if (activeSectionId) {
      url += `&pageName=${activeSectionId}`
    }

    // Cú pháp chuẩn xác Microsoft: &filter=TableName/ColumnName eq 'Value'
    const filterClauses: string[] = []
    if (activeFilter && activeFilter !== 'All' && activeFilter !== '') {
      filterClauses.push(`Nhân Sự/Điều Hành eq '${activeFilter}'`)
    }
    if (activeEmployee && activeEmployee !== 'All' && activeEmployee !== '') {
      filterClauses.push(`Nhân Sự/Nhân Viên eq '${activeEmployee}'`)
    }

    if (filterClauses.length > 0) {
      const filterString = filterClauses.join(' and ')
      url += `&filter=${encodeURIComponent(filterString)}`
    }

    return url
  }, [tokenData, activeSectionId, activeFilter, activeEmployee])

  if (loading || !tokenData) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-card/40 backdrop-blur-sm animate-pulse">
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-xs text-muted-foreground font-medium">Đang tải báo cáo Power BI...</span>
        </div>
      </div>
    )
  }

  return (
    <div className={`relative w-full h-full border-none ${className}`}>
      <iframe
        key={`${activeSectionId}_${activeFilter}_${activeEmployee}`}
        ref={iframeRef}
        title="KPI_HUE_QTI7"
        className="w-full h-full border-none"
        src={currentEmbedUrl}
        frameBorder="0"
        allowFullScreen={true}
      />
    </div>
  )
}
