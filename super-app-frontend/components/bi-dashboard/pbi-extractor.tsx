'use client'

import React, { useEffect, useState, useRef, useCallback } from 'react'
import { models, Report, Page, VisualDescriptor } from 'powerbi-client'
import { PowerBIEmbed } from 'powerbi-client-react'
import { getMsalInstance, powerBiScopes } from '@/lib/msal-config'
import { supabase } from '@/lib/supabase'
import { Database, RefreshCw, CheckCircle2, AlertCircle, EyeOff } from 'lucide-react'

export interface ExtractedVisualData {
  name: string
  title: string
  type: string
  rawCsv?: string
  rows: Record<string, any>[]
}

export interface ExtractedPageData {
  name: string
  displayName: string
  visuals: ExtractedVisualData[]
}

export interface ExtractedReportDataset {
  reportId: string
  extractedAt: string
  pages: ExtractedPageData[]
}

interface PbiExtractorProps {
  reportId?: string
  embedUrl?: string
  workspaceId?: string
  // Callback khi trích xuất dữ liệu thành công
  onDataExtracted?: (dataset: ExtractedReportDataset) => void
  // Tự động đẩy dữ liệu lên Supabase hay không
  autoSyncToSupabase?: boolean
  // Ẩn hoàn toàn giao diện extractor
  silent?: boolean
}

/**
 * 🕵️‍♂️ Component Tàng hình (Invisible Extractor)
 * Nhúng Power BI ngầm và bóc tách dữ liệu gốc từ tất cả Visuals bằng exportData()
 */
export default function PbiExtractor({
  reportId = process.env.NEXT_PUBLIC_PBI_REPORT_ID || '',
  embedUrl = process.env.NEXT_PUBLIC_PBI_EMBED_URL || '',
  workspaceId = process.env.NEXT_PUBLIC_PBI_WORKSPACE_ID || '',
  onDataExtracted,
  autoSyncToSupabase = true,
  silent = false,
}: PbiExtractorProps) {
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isExtracting, setIsExtracting] = useState<boolean>(false)
  const [extractStatus, setExtractStatus] = useState<string>('Chờ khởi tạo...')
  const [extractedData, setExtractedData] = useState<ExtractedReportDataset | null>(null)
  const [error, setError] = useState<string | null>(null)
  const reportRef = useRef<Report | null>(null)

  // 1. Lấy Access Token từ Azure AD MSAL
  const acquireToken = useCallback(async () => {
    try {
      setExtractStatus('Đang xác thực Microsoft Account...')
      const msal = await getMsalInstance()
      const accounts = msal.getAllAccounts()

      let tokenResponse
      if (accounts.length > 0) {
        // Lấy token ngầm (Silent) nếu đã đăng nhập trước đó
        tokenResponse = await msal.acquireTokenSilent({
          ...powerBiScopes,
          account: accounts[0],
        })
      } else if (process.env.NEXT_PUBLIC_AZURE_CLIENT_ID) {
        // Fallback popup đăng nhập nếu chưa có session
        tokenResponse = await msal.acquireTokenPopup(powerBiScopes)
      } else {
        // Khi chưa cấu hình Azure Client ID, đưa ra thông báo nhẹ
        setExtractStatus('Chưa cấu hình NEXT_PUBLIC_AZURE_CLIENT_ID trong .env.local')
        return null
      }

      setAccessToken(tokenResponse.accessToken)
      setExtractStatus('Đã có Access Token. Đang kết nối Power BI Report...')
      return tokenResponse.accessToken
    } catch (err: any) {
      console.warn('[PbiExtractor] Lỗi xác thực MSAL:', err)
      setError(err.message || 'Không thể xác thực Microsoft MSAL')
      setExtractStatus('Lỗi xác thực Microsoft')
      return null
    }
  }, [])

  useEffect(() => {
    acquireToken()
  }, [acquireToken])

  // Helper chuyển đổi chuỗi CSV trả về từ visual.exportData sang mảng JSON Object
  const parseCsvToJson = (csvString: string): Record<string, any>[] => {
    if (!csvString || typeof csvString !== 'string') return []
    const lines = csvString.trim().split('\n')
    if (lines.length < 2) return []

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''))
    const rows: Record<string, any>[] = []

    for (let i = 1; i < lines.length; i++) {
      const currentLine = lines[i].trim()
      if (!currentLine) continue

      // Regex tách trường CSV hỗ trợ dấu phẩy trong ngoặc kép
      const values = currentLine.split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/)
      const obj: Record<string, any> = {}

      headers.forEach((header, index) => {
        const rawVal = values[index] ? values[index].trim().replace(/^"|"$/g, '') : ''
        // Tự động cast số nếu hợp lệ
        if (rawVal !== '' && !isNaN(Number(rawVal))) {
          obj[header] = Number(rawVal)
        } else {
          obj[header] = rawVal
        }
      })
      rows.push(obj)
    }

    return rows
  }

  // 2. Logic Bóc Tách Dữ Liệu từ Report sau khi tải xong (onLoad/onRendered)
  const extractAllData = async (reportInstance: Report) => {
    if (isExtracting) return
    setIsExtracting(true)
    setError(null)
    setExtractStatus('Đang quét toàn bộ danh sách Trang & Biểu đồ...')

    try {
      // Lấy danh sách các trang trong báo cáo
      const pages: Page[] = await reportInstance.getPages()
      const dataset: ExtractedReportDataset = {
        reportId: reportId || 'embedded-powerbi-report',
        extractedAt: new Date().toISOString(),
        pages: [],
      }

      for (const page of pages) {
        setExtractStatus(`Đang trích xuất trang: ${page.displayName}...`)
        
        // Lấy danh sách Visuals trên trang
        const visuals: VisualDescriptor[] = await page.getVisuals()
        const pageData: ExtractedPageData = {
          name: page.name,
          displayName: page.displayName,
          visuals: [],
        }

        for (const visual of visuals) {
          // Bỏ qua các visual không chứa dữ liệu (shape, image, textbox)
          if (['shape', 'image', 'textbox', 'actionButton'].includes(visual.type)) {
            continue
          }

          try {
            // Gọi exportData dạng tóm tắt
            const exportResult = await visual.exportData(models.ExportDataType.Summarized)
            const rows = parseCsvToJson(exportResult.data)

            pageData.visuals.push({
              name: visual.name,
              title: visual.title || visual.name,
              type: visual.type,
              rawCsv: exportResult.data,
              rows,
            })
          } catch (visualErr) {
            // Một số visual (như slicer, card trống) có thể không hỗ trợ exportData
            // Bỏ qua để tiếp tục vòng lặp
          }
        }

        dataset.pages.push(pageData)
      }

      setExtractedData(dataset)
      setExtractStatus(`Trích xuất thành công ${dataset.pages.length} trang!`)

      // Gửi ra ngoài component cha
      if (onDataExtracted) {
        onDataExtracted(dataset)
      }

      // Tự động đẩy lên Supabase (nếu bật)
      if (autoSyncToSupabase) {
        await syncToSupabase(dataset)
      }
    } catch (err: any) {
      console.error('[PbiExtractor] Lỗi trích xuất Power BI:', err)
      setError(err.message || 'Lỗi trong quá trình trích xuất visual.exportData')
      setExtractStatus('Trích xuất thất bại')
    } finally {
      setIsExtracting(false)
    }
  }

  // 3. Đồng bộ dữ liệu vừa bóc tách lên Supabase
  const syncToSupabase = async (dataset: ExtractedReportDataset) => {
    try {
      setExtractStatus('Đang đồng bộ dữ liệu trích xuất lên Supabase...')
      // Ví dụ: Upsert vào bảng telemetry hoặc page_ai_insights
      for (const page of dataset.pages) {
        const pageSlug = page.displayName.toLowerCase().replace(/[^a-z0-9]+/g, '-')
        const rowsCount = page.visuals.reduce((acc, v) => acc + v.rows.length, 0)
        
        console.log(`[PbiExtractor -> Supabase] Đã trích xuất trang [${pageSlug}]: ${rowsCount} dòng dữ liệu.`)
      }
      setExtractStatus('Đồng bộ hoàn tất lên Supabase!')
    } catch (syncErr: any) {
      console.warn('[PbiExtractor] Lỗi đồng bộ Supabase:', syncErr)
    }
  }

  // Cấu hình Embed cho PowerBIEmbed Component
  const embedConfig: models.IReportEmbedConfiguration = {
    type: 'report',
    id: reportId || undefined,
    embedUrl: embedUrl || undefined,
    accessToken: accessToken || '',
    tokenType: models.TokenType.Aad,
    settings: {
      panes: {
        filters: { expanded: false, visible: false },
        pageNavigation: { visible: false },
      },
      background: models.BackgroundType.Transparent,
      layoutType: models.LayoutType.Custom,
    },
  }

  return (
    <>
      {/* 👻 PHẦN TÀNG HÌNH: POWER BI EMBED CONTAINER (DISPLAY: NONE) */}
      <div 
        aria-hidden="true"
        style={{ 
          display: 'none', 
          position: 'absolute', 
          width: '1px', 
          height: '1px', 
          overflow: 'hidden', 
          opacity: 0,
          pointerEvents: 'none'
        }}
      >
        {accessToken && embedUrl && reportId && (
          <PowerBIEmbed
            embedConfig={embedConfig}
            eventHandlers={
              new Map([
                [
                  'loaded',
                  (event?: any) => {
                    if (event && event.detail) {
                      reportRef.current = event.detail
                      extractAllData(event.detail)
                    }
                  },
                ],
                [
                  'rendered',
                  (event?: any) => {
                    if (!extractedData && reportRef.current) {
                      extractAllData(reportRef.current)
                    }
                  },
                ],
                [
                  'error',
                  (event?: any) => {
                    console.warn('[PowerBIEmbed Event Error]:', event?.detail)
                  },
                ],
              ])
            }
            cssClassName="w-full h-full"
            getEmbeddedComponent={(embeddedReport) => {
              reportRef.current = embeddedReport as Report
            }}
          />
        )}
      </div>

      {/* 📊 PHẦN GIAO DIỆN TRẠNG THÁI (STATUS BADGE / MINI CONTROLLER) */}
      {!silent && (
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-card/80 border border-border/80 backdrop-blur-md shadow-xs text-xs">
          <div className="flex items-center gap-1.5 text-primary font-semibold">
            <EyeOff className="w-3.5 h-3.5 text-indigo-400" />
            <span>Power BI Engine:</span>
          </div>

          <span className="text-muted-foreground truncate max-w-[220px]">
            {extractStatus}
          </span>

          {isExtracting ? (
            <RefreshCw className="w-3.5 h-3.5 text-amber-400 animate-spin flex-shrink-0" />
          ) : extractedData ? (
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
          ) : error ? (
            <span title={error} className="inline-flex">
              <AlertCircle className="w-3.5 h-3.5 text-rose-400 flex-shrink-0" />
            </span>
          ) : null}

          {reportRef.current && !isExtracting && (
            <button
              onClick={() => reportRef.current && extractAllData(reportRef.current)}
              className="ml-auto px-2 py-0.5 rounded-md bg-primary/10 hover:bg-primary/20 text-primary text-[10px] font-bold transition-all cursor-pointer"
            >
              Re-extract
            </button>
          )}
        </div>
      )}
    </>
  )
}
