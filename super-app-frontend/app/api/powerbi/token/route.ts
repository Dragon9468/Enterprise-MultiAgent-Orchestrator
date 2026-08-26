import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const candidatePaths = [
      path.join(process.cwd(), 'pbi_session.json'),
      path.join(process.cwd(), '..', 'pbi_session.json'),
      path.join(process.cwd(), '..', 'KPI_HUE_QTI_Extracted', 'pbi_session.json'),
    ]

    let token = ''
    let sessionData: any = null

    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        try {
          const content = fs.readFileSync(p, 'utf-8')
          sessionData = JSON.parse(content)
          token = sessionData.accessToken || sessionData.access_token || sessionData.token || ''
          if (token) break
        } catch (e) {
          console.warn(`[PowerBI API] Failed to parse session file at ${p}:`, e)
        }
      }
    }

    const reportId = process.env.NEXT_PUBLIC_POWERBI_REPORT_ID || '00000000-0000-0000-0000-000000000000'
    const ctid = process.env.NEXT_PUBLIC_AZURE_TENANT_ID || '00000000-0000-0000-0000-000000000000'
    const embedUrl = process.env.NEXT_PUBLIC_POWERBI_EMBED_URL || `https://app.powerbi.com/reportEmbed?reportId=${reportId}&autoAuth=true&ctid=${ctid}`

    return NextResponse.json({
      success: true,
      accessToken: token,
      reportId,
      embedUrl,
      isAutoAuth: !token,
      sessionData
    })
  } catch (error: any) {
    return NextResponse.json(
      {
        success: false,
        error: error.message || 'Failed to fetch Power BI token'
      },
      { status: 500 }
    )
  }
}
