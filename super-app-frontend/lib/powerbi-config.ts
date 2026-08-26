export interface PbiPageDef {
  slug: string
  name: string
  sectionId: string
}

export const PBI_REPORT_CONFIG = {
  reportId: process.env.NEXT_PUBLIC_POWERBI_REPORT_ID || '00000000-0000-0000-0000-000000000000',
  ctid: process.env.NEXT_PUBLIC_AZURE_TENANT_ID || '00000000-0000-0000-0000-000000000000',
  embedUrl: process.env.NEXT_PUBLIC_POWERBI_EMBED_URL || 'https://app.powerbi.com/reportEmbed',
  defaultPageSectionId: 'ReportSection_Summary',
}

export const PBI_PAGE_MAPPINGS: Record<string, PbiPageDef> = {
  'chi-tiet': { slug: 'chi-tiet', name: 'chi tiết', sectionId: 'ReportSection78088f6b3c2473283731' },
  'kpi': { slug: 'kpi', name: 'KPI', sectionId: 'ReportSectionfe8f73ce045e10004253' },
  'lap-2': { slug: 'lap-2', name: 'Lặp 2', sectionId: 'ReportSectionbc6c95add77f19945283' },
  'lap-3': { slug: 'lap-3', name: 'Lặp 3', sectionId: 'a5886d1928b7341e3ed5' },
  'suy-hao': { slug: 'suy-hao', name: 'suy hao', sectionId: 'ReportSection6a7f3db20ff54ca9ebbf' },
  'tong-hop': { slug: 'tong-hop', name: 'Tổng Hợp', sectionId: 'ReportSection440abe5a4400422f2e52' },
  'csat-lan-2': { slug: 'csat-lan-2', name: 'Csat Lần 2', sectionId: 'a3ca6f968fad379d29ec' },
  'nkn': { slug: 'nkn', name: 'NKN', sectionId: 'ed60dbf2003b7366e669' },
  'xep-loai': { slug: 'xep-loai', name: 'Xếp Loại', sectionId: '799477d61d10c4084230' },
  'yeu-cau-huy': { slug: 'yeu-cau-huy', name: 'yêu cầu hủy', sectionId: 'ReportSection3470094148bf8a1e020a' },
  'chu-dong': { slug: 'chu-dong', name: 'chủ động', sectionId: 'ReportSection0b58c0386a0b1989d49d' },
  'luong-tam-tinh': { slug: 'luong-tam-tinh', name: 'Lương Tạm Tính', sectionId: 'ReportSection73cc1a894b2216ca47e7' },
  'tien-do': { slug: 'tien-do', name: 'Tiến độ', sectionId: 'ReportSection496f52aa964a77b43246' },
  'time-tk-bt': { slug: 'time-tk-bt', name: 'Time TK-BT', sectionId: 'ReportSection' },
  'roi-mang': { slug: 'roi-mang', name: 'Rời Mạng', sectionId: 'ReportSection687d284b1cfa550d8826' },
  'respontime': { slug: 'respontime', name: 'Respontime', sectionId: 'ReportSection00087c2a6554692e8bcb' },
  'hoa-hong': { slug: 'hoa-hong', name: 'Hoa Hồng', sectionId: 'ba5d931a14787d1bf29f' },
  'ton-kho': { slug: 'ton-kho', name: 'Tồn Kho', sectionId: '7b50cddbe6fbd3d04875' },
  'cheo': { slug: 'cheo', name: 'Chéo', sectionId: 'cb9d288fc15473a6b1e4' },
}

export function getSectionIdBySlug(slug: string): string {
  return PBI_PAGE_MAPPINGS[slug]?.sectionId || PBI_REPORT_CONFIG.defaultPageSectionId
}

export function getSlugBySectionId(sectionId: string): string {
  const found = Object.values(PBI_PAGE_MAPPINGS).find(p => p.sectionId === sectionId)
  return found?.slug || 'tong-hop'
}
