'use client'

import React, { useState, useMemo } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { 
  ArrowLeft, Calendar, Filter, Download, Share2, Sparkles, 
  Wrench, MapPin, Server, Radio, Star, TrendingUp, TrendingDown,
  CheckCircle2, AlertTriangle, ShieldCheck, Layers, FileSpreadsheet,
  Activity, Users, Award, ChevronRight, BarChart3, Search
} from 'lucide-react'
import { 
  ComposedChart, Line, Bar, Area, XAxis, YAxis, CartesianGrid, 
  Tooltip, Legend, ResponsiveContainer 
} from 'recharts'
import BiSidebar, { BI_REPORT_PAGES } from '@/components/bi-dashboard/bi-sidebar'
import AiInsightPanel from '@/components/bi-dashboard/ai-insight-panel'

// DETAILED DRILL-DOWN MOCK REPOSITORIES
interface MetricConfig {
  id: string
  title: string
  subtitle: string
  icon: React.ComponentType<{ className?: string }>
  badge: string
  badgeVariant: 'success' | 'warning' | 'danger' | 'purple'
  summaryStats: {
    label: string
    value: string
    subValue?: string
    trend?: 'up' | 'down'
    trendVal?: string
    colorClass: string
  }[]
  chartData: any[]
  tableData: any[]
  tableColumns: { key: string; label: string; align?: 'left' | 'right' | 'center' }[]
  aiInsights: {
    summary: string
    highlights: string[]
    bottlenecks: string[]
    recommendations: string[]
    lastUpdated: string
    confidenceScore: number
  }
}

const METRIC_CONFIGS: Record<string, MetricConfig> = {
  'chat-luong-tay-nghe': {
    id: 'chat-luong-tay-nghe',
    title: 'Chất Lượng Tay Nghề & Chuẩn Hóa Nghiệm Thu NVKT',
    subtitle: 'Phân tích chi tiết 842 kỹ thuật viên qua các tiêu chuẩn hàn nối, xử lý sự cố & tỷ lệ lặp mạng',
    icon: Wrench,
    badge: 'Đạt Chuẩn 96.8%',
    badgeVariant: 'success',
    summaryStats: [
      { label: 'Tỷ Lệ Đạt Chuẩn TB', value: '96.8%', trend: 'up', trendVal: '+2.1% MoM', colorClass: 'text-emerald-400' },
      { label: 'Tỷ Lệ Lặp Sự Cố 7N', value: '1.8%', trend: 'down', trendVal: '-0.5% MoM', colorClass: 'text-amber-400' },
      { label: 'Bậc Nghề Trung Bình', value: 'Bậc 4.2', subValue: 'Thang bậc 5', colorClass: 'text-indigo-400' },
      { label: 'Tổng Ca Đánh Giá', value: '14,820', subValue: 'Kỳ 08/2026', colorClass: 'text-foreground' },
    ],
    chartData: [
      { date: '01/08', datChuan: 94.5, tongCa: 980, caLoi: 54 },
      { date: '03/08', datChuan: 95.2, tongCa: 1040, caLoi: 50 },
      { date: '05/08', datChuan: 94.8, tongCa: 1120, caLoi: 58 },
      { date: '07/08', datChuan: 96.1, tongCa: 1050, caLoi: 41 },
      { date: '09/08', datChuan: 95.9, tongCa: 990, caLoi: 40 },
      { date: '11/08', datChuan: 96.5, tongCa: 1180, caLoi: 41 },
      { date: '13/08', datChuan: 97.1, tongCa: 1210, caLoi: 35 },
      { date: '15/08', datChuan: 96.8, tongCa: 1150, caLoi: 37 },
      { date: '17/08', datChuan: 97.4, tongCa: 1260, caLoi: 33 },
      { date: '19/08', datChuan: 97.8, tongCa: 1300, caLoi: 28 },
    ],
    tableColumns: [
      { key: 'team', label: 'Đội Kỹ Thuật / Chi Nhánh', align: 'left' },
      { key: 'empCount', label: 'Số NV', align: 'center' },
      { key: 'totalTickets', label: 'Tổng Ca', align: 'right' },
      { key: 'passRate', label: 'Đạt Chuẩn (%)', align: 'right' },
      { key: 'repeatRate', label: 'Lặp 7N (%)', align: 'right' },
      { key: 'avgScore', label: 'Điểm Tay Nghề', align: 'right' },
      { key: 'status', label: 'Xếp Loại', align: 'center' },
    ],
    tableData: [
      { team: 'Đội KT Huế 1 (Trung Tâm)', empCount: 42, totalTickets: 840, passRate: '98.2%', repeatRate: '1.2%', avgScore: '96.5', status: 'Xuất sắc' },
      { team: 'Đội KT Huế 2 (Hương Thủy)', empCount: 38, totalTickets: 720, passRate: '97.4%', repeatRate: '1.5%', avgScore: '94.8', status: 'Xuất sắc' },
      { team: 'Đội KT Đà Nẵng 1 (Hải Châu)', empCount: 65, totalTickets: 1420, passRate: '96.8%', repeatRate: '1.7%', avgScore: '93.2', status: 'Tốt' },
      { team: 'Đội KT Đà Nẵng 2 (Cẩm Lệ)', empCount: 54, totalTickets: 1180, passRate: '96.1%', repeatRate: '1.9%', avgScore: '91.8', status: 'Tốt' },
      { team: 'Đội KT Quảng Trị (Đông Hà)', empCount: 32, totalTickets: 580, passRate: '95.6%', repeatRate: '2.1%', avgScore: '89.4', status: 'Đạt chuẩn' },
      { team: 'Đội KT Quảng Bình (Đồng Hới)', empCount: 30, totalTickets: 540, passRate: '95.2%', repeatRate: '2.3%', avgScore: '88.7', status: 'Đạt chuẩn' },
    ],
    aiInsights: {
      summary: 'Kỹ năng thi công và chuẩn hóa hàn nối cáp quang của toàn bộ 842 kỹ thuật viên đang duy trì xu hướng tăng trưởng bền vững. Đội ngũ KV3 đạt hiệu quả xử lý cao nhất với tỷ lệ hoàn tất đúng chuẩn 97.4%.',
      highlights: [
        'Tỷ lệ đạt chuẩn kỹ thuật đã tăng từ 94.5% lên 97.8% sau 19 ngày áp dụng quy trình kiểm tra quang OTDR kép.',
        'Đội KT Huế 1 và Huế 2 xuất sắc dẫn đầu với tỷ lệ lặp mạng dưới 1.5% và điểm đánh giá tay nghề trung bình 96.5.',
        'Các lỗi kỹ thuật liên quan đến suy hao đầu Fast Connector giảm 42% so với tháng trước.'
      ],
      bottlenecks: [
        'Nhóm kỹ thuật viên bậc 1-2 tại Quảng Bình và Quảng Trị cần tối ưu thời gian cấu hình hệ thống Mesh Wi-Fi 6.',
        'Tỷ lệ ca nghiệm thu bị trễ vào khung giờ 17:30 - 18:30 do tập trung mật độ di chuyển cao.'
      ],
      recommendations: [
        'Tổ chức hội thảo chuyên đề chuyển giao kinh nghiệm đo kiểm suy hao vi uốn cho 35 nhân viên bậc 1-2.',
        'Tối ưu hóa thuật toán điều phối ca trên App MOB để giảm 20% quãng đường di chuyển của kỹ thuật viên.',
        'Tuyên dương và trao thưởng KPI Tháng 8 cho 2 Đội Kỹ thuật dẫn đầu khu vực.'
      ],
      lastUpdated: '19/08/2026 06:00 AM (Daily Batch)',
      confidenceScore: 98.4
    }
  },

  'chi-so-khu-vuc': {
    id: 'chi-so-khu-vuc',
    title: 'Chỉ Số Vận Hành & Năng Suất 4 Khu Vực Điều Hành',
    subtitle: 'Tổng hợp chi tiết ca tiếp nhận, tỷ lệ hoàn tất đúng hẹn SLA và năng suất lao động',
    icon: MapPin,
    badge: 'SLA Toàn Quốc 96.8%',
    badgeVariant: 'purple',
    summaryStats: [
      { label: 'Tổng Sản Lượng Ca', value: '4,720', trend: 'up', trendVal: '+8.4% MoM', colorClass: 'text-foreground' },
      { label: 'Hoàn Tất Đúng SLA', value: '96.8%', trend: 'up', trendVal: '+0.6% MoM', colorClass: 'text-purple-400' },
      { label: 'Nhân Lực Trực Tiếp', value: '842 NV', subValue: 'Toàn quốc', colorClass: 'text-cyan-400' },
      { label: 'Thời Gian Xử Lý TB', value: '1.85h', trend: 'down', trendVal: '-0.3h', colorClass: 'text-emerald-400' },
    ],
    chartData: [
      { date: 'Khu vực 1 (HN)', tiepNhan: 1240, hoanTat: 1198, sla: 96.6 },
      { date: 'Khu vực 2 (HCM)', tiepNhan: 1680, hoanTat: 1625, sla: 96.7 },
      { date: 'Khu vực 3 (MT)', tiepNhan: 840, hoanTat: 818, sla: 97.4 },
      { date: 'Khu vực 4 (MN)', tiepNhan: 960, hoanTat: 928, sla: 96.6 },
    ],
    tableColumns: [
      { key: 'region', label: 'Khu Vực Điều Hành', align: 'left' },
      { key: 'branches', label: 'Số Chi Nhánh', align: 'center' },
      { key: 'totalReq', label: 'Tổng Tiếp Nhận', align: 'right' },
      { key: 'doneSla', label: 'Đúng Hẹn SLA', align: 'right' },
      { key: 'slaRate', label: 'Tỷ Lệ SLA (%)', align: 'right' },
      { key: 'avgTime', label: 'Thời Gian TB', align: 'right' },
      { key: 'status', label: 'Tình Trạng', align: 'center' },
    ],
    tableData: [
      { region: 'Khu vực 3 (Miền Trung - Tây Nguyên)', branches: 8, totalReq: 840, doneSla: 818, slaRate: '97.4%', avgTime: '1.72h', status: 'Dẫn đầu SLA' },
      { region: 'Khu vực 2 (TP. Hồ Chí Minh)', branches: 12, totalReq: 1680, doneSla: 1625, slaRate: '96.7%', avgTime: '1.84h', status: 'Tải trọng lớn' },
      { region: 'Khu vực 1 (Hà Nội & ĐB Sông Hồng)', branches: 10, totalReq: 1240, doneSla: 1198, slaRate: '96.6%', avgTime: '1.88h', status: 'Ổn định' },
      { region: 'Khu vực 4 (Miền Nam & ĐBSCL)', branches: 9, totalReq: 960, doneSla: 928, slaRate: '96.6%', avgTime: '1.86h', status: 'Ổn định' },
    ],
    aiInsights: {
      summary: 'Khu vực 3 tiếp tục duy trì vị thế dẫn đầu về chất lượng cam kết SLA (97.4%), trong khi Khu vực 2 chịu tải cao nhất (1,680 ca) với tốc độ giải phóng tồn đọng vượt mức kỳ vọng.',
      highlights: [
        'Tổng số ca xử lý toàn quốc đạt 4,720 ca, vượt 8.4% so với cùng kỳ tháng trước.',
        'Thời gian xử lý trung bình toàn mạng giảm còn 1.85 giờ/ca.',
        'Tỷ lệ điều phối ca thành công tự động trên AI Dispatcher đạt 92.1%.'
      ],
      bottlenecks: [
        'Khu vực 2 có mật độ ca phát sinh đột biến vào các ngày mưa bão (trung bình tăng 32%).',
        'Một số địa bàn vùng ven KV4 gặp khó khăn về di chuyển do hạ tầng giao thông.'
      ],
      recommendations: [
        'Tăng cường 20% lượng vật tư cáp dự phòng tại các kho đệm trung chuyển của KV2.',
        'Mở rộng mô hình điều phối tự động sang các huyện vùng ven để giảm độ trễ phản hồi.'
      ],
      lastUpdated: '19/08/2026 06:00 AM (Daily Batch)',
      confidenceScore: 99.1
    }
  },

  'chat-luong-ha-tang': {
    id: 'chat-luong-ha-tang',
    title: 'Chất Lượng Hạ Tầng Cáp Quang & Cổng OLT/PON',
    subtitle: 'Giám sát độ suy hao quang dBm, khả dụng cổng OLT và cảnh báo suy giảm tín hiệu',
    icon: Server,
    badge: 'Khả Dụng 99.94%',
    badgeVariant: 'warning',
    summaryStats: [
      { label: 'Cổng OLT Online', value: '16,470', subValue: '99.94% Uptime', colorClass: 'text-emerald-400' },
      { label: 'Suy Hao TB Tuyến', value: '-19.4 dBm', subValue: 'Ngưỡng tốt: < -24', colorClass: 'text-foreground' },
      { label: 'Cảnh Báo Cáp Quang', value: '3 sự cố', trend: 'down', trendVal: '-2 sự cố', colorClass: 'text-rose-400' },
      { label: 'Tỷ Lệ Cổng Tốt (< -24dBm)', value: '86.2%', trend: 'up', trendVal: '+1.4%', colorClass: 'text-emerald-400' },
    ],
    chartData: [
      { date: '01/08', congTot: 13800, congCanhBao: 1950, congNguyCo: 520 },
      { date: '05/08', congTot: 13950, congCanhBao: 1910, congNguyCo: 490 },
      { date: '10/08', congTot: 14100, congCanhBao: 1870, congNguyCo: 450 },
      { date: '15/08', congTot: 14180, congCanhBao: 1860, congNguyCo: 430 },
      { date: '19/08', congTot: 14200, congCanhBao: 1850, congNguyCo: 420 },
    ],
    tableColumns: [
      { key: 'oltId', label: 'Mã Trạm OLT', align: 'left' },
      { key: 'location', label: 'Địa Điểm / Tuyến Cáp', align: 'left' },
      { key: 'activePorts', label: 'Cổng Active', align: 'right' },
      { key: 'avgDbm', label: 'Suy Hao TB (dBm)', align: 'right' },
      { key: 'warningCount', label: 'Cảnh Báo', align: 'center' },
      { key: 'status', label: 'Trạng Thái', align: 'center' },
    ],
    tableData: [
      { oltId: 'OLT-HUE-01', location: 'Trạm 16 Lê Lợi, TP Huế', activePorts: 512, avgDbm: '-18.2 dBm', warningCount: 0, status: 'Hoạt động tối ưu' },
      { oltId: 'OLT-HUE-02', location: 'Trạm Hương Thủy, TT Huế', activePorts: 384, avgDbm: '-19.1 dBm', warningCount: 1, status: 'Ổn định' },
      { oltId: 'OLT-DNG-04', location: 'Trạm Hải Châu, Đà Nẵng', activePorts: 1024, avgDbm: '-18.8 dBm', warningCount: 0, status: 'Hoạt động tối ưu' },
      { oltId: 'OLT-QTI-01', location: 'Trạm Đông Hà, Quảng Trị', activePorts: 256, avgDbm: '-22.4 dBm', warningCount: 2, status: 'Cần bảo dưỡng' },
      { oltId: 'OLT-QBH-02', location: 'Trạm Đồng Hới, Quảng Bình', activePorts: 256, avgDbm: '-23.1 dBm', warningCount: 3, status: 'Cần bảo dưỡng' },
    ],
    aiInsights: {
      summary: 'Mạng lưới 16,470 cổng OLT đang hoạt động ở mức ổn định cao. 86.2% cổng đạt mức suy hao tiêu chuẩn cao (< -24 dBm). 3 điểm cảnh báo cáp quang đang được các đội bảo trì xử lý dự phòng.',
      highlights: [
        'Mức độ suy hao toàn mạng trung bình đạt -19.4 dBm, cải thiện 0.8 dBm so với đầu quý.',
        'Không ghi nhận sự cố gián đoạn dịch vụ diện rộng (Critical Outage) trong 30 ngày qua.'
      ],
      bottlenecks: [
        'Trạm OLT-QTI-01 và OLT-QBH-02 có 5 cổng suy hao tiệm cận ngưỡng -24 dBm do tuyến cáp đi qua vùng độ ẩm cao.'
      ],
      recommendations: [
        'Thực hiện bảo dưỡng định kỳ và vệ sinh đầu Fast Connector tại trạm Đông Hà và Đồng Hới trước ngày 25/08.',
        'Lắp đặt thêm module cảm biến nhiệt độ và độ ẩm tự động tại 12 phòng máy nhánh.'
      ],
      lastUpdated: '19/08/2026 06:00 AM (Daily Batch)',
      confidenceScore: 97.9
    }
  },

  'suy-hao': {
    id: 'suy-hao',
    title: 'Chỉ Số Suy Hao Tuyến Quang & Khảo Sát CSAT Lần 2',
    subtitle: 'Mối tương quan giữa tỷ lệ suy hao tín hiệu quang và điểm hài lòng khách hàng sau xử lý',
    icon: Radio,
    badge: 'CSAT 4.92 ⭐',
    badgeVariant: 'success',
    summaryStats: [
      { label: 'Tỷ Lệ Suy Hao Cao', value: '1.8%', trend: 'down', trendVal: '-1.0% MoM', colorClass: 'text-emerald-400' },
      { label: 'Điểm CSAT Khảo Sát L2', value: '4.92 / 5', subValue: 'Xuất sắc', colorClass: 'text-amber-400' },
      { label: 'Độ Trễ Trung Bình (Ping)', value: '4.2 ms', subValue: 'Tối ưu Gaming', colorClass: 'text-cyan-400' },
      { label: 'Tỷ Lệ Khách Hài Lòng', value: '98.5%', trend: 'up', trendVal: '+1.2%', colorClass: 'text-emerald-400' },
    ],
    chartData: [
      { date: '01/08', suyHao: 2.8, csat: 4.82, phanHoiTot: 95.2 },
      { date: '04/08', suyHao: 2.6, csat: 4.84, phanHoiTot: 95.8 },
      { date: '07/08', suyHao: 2.9, csat: 4.81, phanHoiTot: 95.0 },
      { date: '10/08', suyHao: 2.4, csat: 4.86, phanHoiTot: 96.4 },
      { date: '13/08', suyHao: 2.1, csat: 4.89, phanHoiTot: 97.2 },
      { date: '16/08', suyHao: 1.9, csat: 4.92, phanHoiTot: 98.1 },
      { date: '19/08', suyHao: 1.8, csat: 4.94, phanHoiTot: 98.5 },
    ],
    tableColumns: [
      { key: 'route', label: 'Tuyến Cáp / Khu Vực Đo', align: 'left' },
      { key: 'testsCount', label: 'Số Mẫu Đo', align: 'right' },
      { key: 'lossRate', label: 'Tỷ Lệ Suy Hao (%)', align: 'right' },
      { key: 'csatScore', label: 'Điểm CSAT L2', align: 'right' },
      { key: 'sentiment', label: 'Phản Hồi Khách Hàng', align: 'center' },
    ],
    tableData: [
      { route: 'Tuyến Quang TP Huế - Hương Thủy', testsCount: 420, lossRate: '1.2%', csatScore: '4.96 ⭐', sentiment: 'Rất hài lòng (99%)' },
      { route: 'Tuyến Quang Hải Châu - Sơn Trà (ĐN)', testsCount: 680, lossRate: '1.5%', csatScore: '4.94 ⭐', sentiment: 'Rất hài lòng (98%)' },
      { route: 'Tuyến Quang Cẩm Lệ - Hòa Vang (ĐN)', testsCount: 520, lossRate: '1.8%', csatScore: '4.91 ⭐', sentiment: 'Hài lòng (97%)' },
      { route: 'Tuyến Quang Đông Hà - Triệu Phong', testsCount: 310, lossRate: '2.4%', csatScore: '4.86 ⭐', sentiment: 'Hài lòng (95%)' },
      { route: 'Tuyến Quang Đồng Hới - Bố Trạch', testsCount: 290, lossRate: '2.6%', csatScore: '4.83 ⭐', sentiment: 'Hài lòng (94%)' },
    ],
    aiInsights: {
      summary: 'Mối tương quan nghịch giữa tỷ lệ suy hao tuyến cáp và điểm CSAT Lần 2 thể hiện rõ rệt: Khi suy hao giảm dưới 2.0%, điểm đánh giá hài lòng của khách hàng tăng vọt lên trên 4.92 sao.',
      highlights: [
        'Tỷ lệ phản hồi tích cực từ khách hàng sau khảo sát nghiệm thu đạt mức kỷ lục 98.5%.',
        'Tuyến quang TP Huế - Hương Thủy đạt điểm CSAT cao nhất toàn quốc (4.96 ⭐).'
      ],
      bottlenecks: [
        'Vẫn còn 1.5% khách hàng tại vùng ven phản ánh về việc suy giảm băng thông vào giờ cao điểm 20:00 - 22:00.'
      ],
      recommendations: [
        'Khai báo tự động nâng băng thông đệm trong khung giờ vàng cho các thuê bao có kết nối Wi-Fi 6.',
        'Mở rộng chương trình chăm sóc khách hàng chủ động (Proactive Care) sau 24h nghiệm thu.'
      ],
      lastUpdated: '19/08/2026 06:00 AM (Daily Batch)',
      confidenceScore: 98.7
    }
  },

  'csat-lan-2': {
    id: 'csat-lan-2',
    title: 'Khảo Sát Đánh Giá Khách Hàng CSAT Lần 2',
    subtitle: 'Đo lường mức độ hài lòng khách hàng sau 48h nghiệm thu và bảo trì dịch vụ',
    icon: Star,
    badge: 'Hài Lòng 98.5%',
    badgeVariant: 'success',
    summaryStats: [
      { label: 'Điểm CSAT Trung Bình', value: '4.92 / 5', trend: 'up', trendVal: '+0.12', colorClass: 'text-amber-400' },
      { label: 'Chỉ Số NPS', value: '+78', subValue: 'Xuất sắc', colorClass: 'text-emerald-400' },
      { label: 'Tổng Khảo Sát Đạt', value: '8,450', subValue: 'Tỷ lệ phản hồi 91%', colorClass: 'text-foreground' },
      { label: 'Tỷ Lệ 5 Sao', value: '94.2%', trend: 'up', trendVal: '+3.1%', colorClass: 'text-emerald-400' },
    ],
    chartData: [
      { date: '01/08', star5: 91.2, star4: 6.2, star123: 2.6 },
      { date: '05/08', star5: 92.4, star4: 5.5, star123: 2.1 },
      { date: '10/08', star5: 93.1, star4: 5.1, star123: 1.8 },
      { date: '15/08', star5: 93.8, star4: 4.8, star123: 1.4 },
      { date: '19/08', star5: 94.2, star4: 4.6, star123: 1.2 },
    ],
    tableColumns: [
      { key: 'branch', label: 'Chi Nhánh / Đơn Vị', align: 'left' },
      { key: 'totalSurveys', label: 'Số Khảo Sát', align: 'right' },
      { key: 'score5Star', label: 'Tỷ Lệ 5 Sao (%)', align: 'right' },
      { key: 'csatAvg', label: 'Điểm TB', align: 'right' },
      { key: 'nps', label: 'NPS', align: 'right' },
      { key: 'status', label: 'Đánh Giá', align: 'center' },
    ],
    tableData: [
      { branch: 'Chi nhánh Huế', totalSurveys: 1850, score5Star: '96.2%', csatAvg: '4.95 ⭐', nps: '+82', status: 'Top 1 Xuất sắc' },
      { branch: 'Chi nhánh Đà Nẵng', totalSurveys: 3200, score5Star: '94.8%', csatAvg: '4.93 ⭐', nps: '+79', status: 'Top 2 Xuất sắc' },
      { branch: 'Chi nhánh Quảng Trị', totalSurveys: 980, score5Star: '93.2%', csatAvg: '4.89 ⭐', nps: '+74', status: 'Tốt' },
      { branch: 'Chi nhánh Quảng Bình', totalSurveys: 920, score5Star: '92.6%', csatAvg: '4.87 ⭐', nps: '+72', status: 'Tốt' },
    ],
    aiInsights: {
      summary: 'Khảo sát CSAT Lần 2 ghi nhận mức độ hài lòng ấn tượng của khách hàng với 94.2% đánh giá 5 sao. Chỉ số NPS đạt +78 khẳng định niềm tin và uy tín chất lượng dịch vụ doanh nghiệp.',
      highlights: [
        'Chi nhánh Huế và Đà Nẵng duy trì điểm số CSAT trên 4.93 sao và tỷ lệ phản hồi 5 sao trên 94%.',
        'Thái độ phục vụ tận tâm và tác phong chuyên nghiệp của kỹ thuật viên được khách hàng khen ngợi nhiều nhất.'
      ],
      bottlenecks: [
        '1.2% đánh giá 1-3 sao chủ yếu xuất phát từ việc khách hàng mong muốn thời gian hẹn lắp đặt linh hoạt hơn vào buổi tối.'
      ],
      recommendations: [
        'Mở rộng khung giờ hẹn nghiệm thu ca tối (18:30 - 20:30) cho khách hàng có nhu cầu đặc thù.',
        'Gửi tin nhắn Zalo ZNS cảm ơn kèm voucher dịch vụ số cho các khách hàng hoàn thành khảo sát.'
      ],
      lastUpdated: '19/08/2026 06:00 AM (Daily Batch)',
      confidenceScore: 99.3
    }
  }
}

/**
 * 🏭 Generator: Tự động sinh cấu hình chuẩn cho tất cả 19 chuyên trang Power BI
 */
function getMetricConfig(id: string): MetricConfig {
  if (METRIC_CONFIGS[id]) {
    return METRIC_CONFIGS[id]
  }

  // Tra cứu thông tin từ Sidebar Dictionary
  const sideItem = BI_REPORT_PAGES.find(p => p.id === id)
  const title = sideItem ? sideItem.name : id.replace(/-/g, ' ').toUpperCase()
  const icon = sideItem ? sideItem.icon : BarChart3
  const badge = 'Hoạt động'

  return {
    id,
    title: `Báo Cáo Chi Tiết: ${title.toUpperCase()}`,
    subtitle: `Phân tích dữ liệu vận hành chuyên sâu cho chỉ số ${title}`,
    icon,
    badge,
    badgeVariant: 'purple',
    summaryStats: [
      { label: 'Tổng Sản Lượng', value: '4,720 ca', trend: 'up', trendVal: '+5.4%', colorClass: 'text-foreground' },
      { label: 'Tỷ Lệ Hoàn Tất Đúng Hạn', value: '96.8%', trend: 'up', trendVal: '+1.2%', colorClass: 'text-emerald-400' },
      { label: 'Chỉ Số SLA Cam Kết', value: '97.4%', subValue: 'Mục tiêu: 95%', colorClass: 'text-purple-400' },
      { label: 'Nhân Lực Trực Tiếp', value: '842 NV', subValue: '4 Khu vực', colorClass: 'text-cyan-400' },
    ],
    chartData: [
      { date: '01/08', tiepNhan: 980, hoanTat: 950, dungHen: 96.2 },
      { date: '05/08', tiepNhan: 1040, hoanTat: 1010, dungHen: 96.5 },
      { date: '10/08', tiepNhan: 1120, hoanTat: 1090, dungHen: 97.1 },
      { date: '15/08', tiepNhan: 1180, hoanTat: 1150, dungHen: 96.8 },
      { date: '19/08', tiepNhan: 1240, hoanTat: 1210, dungHen: 97.4 },
    ],
    tableColumns: [
      { key: 'khuVuc', label: 'Khu Vực / Chi Nhánh', align: 'left' },
      { key: 'tongCa', label: 'Tổng Ca', align: 'right' },
      { key: 'hoanTat', label: 'Hoàn Tất', align: 'right' },
      { key: 'tyLe', label: 'Đúng Hẹn (%)', align: 'right' },
      { key: 'status', label: 'Trạng Thái', align: 'center' },
    ],
    tableData: [
      { khuVuc: 'Khu vực 1 (Hà Nội)', tongCa: 1240, hoanTat: 1198, tyLe: '96.6%', status: 'Tốt' },
      { khuVuc: 'Khu vực 2 (TP.HCM)', tongCa: 1680, hoanTat: 1625, tyLe: '96.7%', status: 'Tốt' },
      { khuVuc: 'Khu vực 3 (Miền Trung)', tongCa: 840, hoanTat: 818, tyLe: '97.4%', status: 'Xuất sắc' },
      { khuVuc: 'Khu vực 4 (Miền Nam)', tongCa: 960, hoanTat: 928, tyLe: '96.6%', status: 'Đạt chuẩn' },
    ],
    aiInsights: {
      summary: `Báo cáo chuyên trang [${title}] được trích xuất trực tiếp từ hệ thống Power BI backend. Các chỉ số hoạt động ổn định và đáp ứng các tiêu chuẩn chất lượng cam kết SLA.`,
      highlights: [
        'Tỷ lệ hoàn thành công việc và tiến độ xử lý duy trì trên 96.5%.',
        'Các đội kỹ thuật chủ động phối hợp giải phóng ca tồn đọng nhanh chóng.'
      ],
      bottlenecks: [
        'Cần tiếp tục tối ưu hóa thời gian di chuyển và mật độ ca vào giờ cao điểm.'
      ],
      recommendations: [
        'Duy trì giám sát và kiểm tra định kỳ các bảng số liệu thời gian thực.',
        'Bố trí nhân sự trực ca linh hoạt giữa các địa bàn liền kề.'
      ],
      lastUpdated: '19/08/2026 06:00 AM (Daily Batch)',
      confidenceScore: 98.2
    }
  }
}

export default function MetricDetailPage() {
  const params = useParams()
  const router = useRouter()
  const [selectedPeriod, setSelectedPeriod] = useState<string>('thang_nay')
  const [selectedRegion, setSelectedRegion] = useState<string>('all')
  const [searchTableQuery, setSearchTableQuery] = useState('')
  const [chartViewMode, setChartViewMode] = useState<'combo' | 'bar' | 'line'>('combo')

  const metricId = String(params?.metricId || 'chat-luong-tay-nghe')

  // Find metric configuration or dynamically generate tailored config
  const config = useMemo(() => {
    return getMetricConfig(metricId)
  }, [metricId])

  const IconComp = config.icon

  // Filter Table Data based on search query
  const filteredTableData = useMemo(() => {
    if (!searchTableQuery.trim()) return config.tableData
    const q = searchTableQuery.toLowerCase().trim()
    return config.tableData.filter((row) => {
      return Object.values(row).some((val) => 
        String(val).toLowerCase().includes(q)
      )
    })
  }, [config.tableData, searchTableQuery])

  return (
    <div className="flex-1 flex flex-col md:flex-row w-full h-full min-h-0 relative overflow-hidden bg-background">
      
      {/* 1. LEFT POWER BI SIDEBAR */}
      <BiSidebar
        activePageId={config.id}
        onSelectPage={(id) => {
          if (id === 'tong-hop') {
            router.push('/thong-so')
          } else {
            router.push(`/thong-so/${id}`)
          }
        }}
        isCollapsed={false}
        onToggleCollapse={() => {}}
      />

      {/* 2. MAIN DRILL-DOWN REPORT CANVAS */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-y-auto overflow-x-hidden">
        
        {/* 🧭 DRILL-DOWN HEADER WITH BACK BUTTON & SLICERS */}
        <div className="w-full bg-card/75 backdrop-blur-xl border-b border-border/80 px-3 py-2.5 sm:px-6 sm:py-3 flex flex-wrap items-center justify-between gap-3 sticky top-0 z-20 select-none flex-shrink-0">
          
          {/* Left: Back Button & Title */}
          <div className="flex items-center gap-3 overflow-hidden">
            <Link
              href="/thong-so"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-muted/80 hover:bg-primary/20 text-foreground hover:text-primary border border-border/80 hover:border-primary/30 text-xs font-bold transition-all shadow-xs cursor-pointer group"
              title="Quay lại Báo cáo Tổng Hợp"
            >
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
              <span>Quay lại Tổng Hợp</span>
            </Link>

            <div className="h-4 w-px bg-border/60 hidden sm:block" />

            <div className="flex items-center gap-2 overflow-hidden">
              <div className="p-1.5 rounded-lg bg-primary/10 text-primary border border-primary/20 flex-shrink-0">
                <IconComp className="w-4 h-4" />
              </div>
              <div className="flex flex-col overflow-hidden">
                <div className="flex items-center gap-2">
                  <h1 className="text-xs sm:text-sm font-black text-foreground truncate">
                    {config.title}
                  </h1>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hidden sm:inline">
                    {config.badge}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Slicers & Export Actions */}
          <div className="flex items-center flex-wrap gap-2">
            
            {/* Slicer Kỳ Báo Cáo */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-background/80 border border-border/80 text-xs text-foreground shadow-xs">
              <Calendar className="w-3.5 h-3.5 text-primary" />
              <select 
                value={selectedPeriod}
                onChange={(e) => setSelectedPeriod(e.target.value)}
                aria-label="Kỳ Báo Cáo"
                className="bg-transparent text-xs font-semibold focus:outline-hidden cursor-pointer text-foreground"
              >
                <option value="thang_nay" className="bg-card text-foreground">Tháng 08/2026</option>
                <option value="7_ngay" className="bg-card text-foreground">7 Ngày Gần Nhất</option>
                <option value="quy_3" className="bg-card text-foreground">Quý 3/2026</option>
              </select>
            </div>

          </div>

        </div>

        {/* 📊 DRILL-DOWN MAIN CONTENT CONTAINER */}
        <div className="p-3.5 sm:p-5 space-y-4 max-w-7xl w-full mx-auto">
          
          {/* 1. TOP SUMMARY METRIC STAT CARDS */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {config.summaryStats.map((stat, idx) => (
              <div 
                key={idx}
                className="p-3.5 rounded-2xl bg-card/80 backdrop-blur-xl border border-border/80 shadow-md flex flex-col justify-between"
              >
                <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
                <div className="flex items-baseline justify-between mt-1">
                  <span className={`text-xl sm:text-2xl font-black ${stat.colorClass}`}>
                    {stat.value}
                  </span>
                  {stat.trendVal && (
                    <span className={`text-xs font-bold flex items-center gap-0.5 ${
                      stat.trend === 'up' ? 'text-emerald-400' : 'text-amber-400'
                    }`}>
                      {stat.trend === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                      {stat.trendVal}
                    </span>
                  )}
                  {stat.subValue && (
                    <span className="text-[11px] text-muted-foreground font-mono">
                      {stat.subValue}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* 2. MAIN REPORT SECTION (CHART & DATA TABLE ON LEFT / AI INSIGHT ON RIGHT) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            
            {/* LEFT 2 COLUMNS: LARGE DRILL-DOWN CHART & DATA TABLE */}
            <div className="lg:col-span-2 space-y-4">
              
              {/* 📈 SECTION A: HIGH-RESOLUTION RECHARTS DRILL-DOWN */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card/85 backdrop-blur-xl border border-border/80 shadow-lg space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div>
                    <h3 className="font-bold text-sm text-foreground">
                      Biểu Đồ Chi Tiết Diễn Biến Theo Thời Gian
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      Dữ liệu đo kiểm thực tế theo từng ngày trong kỳ báo cáo
                    </p>
                  </div>

                  {/* Chart view mode toggles */}
                  <div className="flex items-center gap-1 p-0.5 rounded-xl bg-muted/80 border border-border/60 text-xs">
                    <button
                      onClick={() => setChartViewMode('combo')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        chartViewMode === 'combo' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Kết hợp
                    </button>
                    <button
                      onClick={() => setChartViewMode('bar')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        chartViewMode === 'bar' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Cột
                    </button>
                    <button
                      onClick={() => setChartViewMode('line')}
                      className={`px-2.5 py-1 rounded-lg font-semibold transition-all cursor-pointer ${
                        chartViewMode === 'line' ? 'bg-primary text-primary-foreground shadow-xs' : 'text-muted-foreground hover:text-foreground'
                      }`}
                    >
                      Đường
                    </button>
                  </div>
                </div>

                {/* Recharts Canvas */}
                <div className="h-72 sm:h-80 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={config.chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.06)" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <YAxis 
                        tick={{ fill: 'var(--muted-foreground)', fontSize: 11 }} 
                        axisLine={false} 
                        tickLine={false} 
                      />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'rgba(15, 23, 42, 0.95)', 
                          borderColor: 'rgba(255, 255, 255, 0.1)', 
                          borderRadius: '12px',
                          fontSize: '12px',
                          boxShadow: '0 10px 25px rgba(0,0,0,0.5)'
                        }} 
                      />
                      <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />

                      {chartViewMode !== 'line' && (
                        <Bar 
                          dataKey={Object.keys(config.chartData[0])[1]} 
                          fill="#6366f1" 
                          radius={[4, 4, 0, 0]} 
                          barSize={18} 
                        />
                      )}
                      
                      {chartViewMode !== 'bar' && Object.keys(config.chartData[0])[2] && (
                        <Line 
                          type="monotone" 
                          dataKey={Object.keys(config.chartData[0])[2]} 
                          stroke="#10b981" 
                          strokeWidth={2.5} 
                          dot={{ r: 3, fill: '#10b981' }} 
                        />
                      )}

                      {chartViewMode === 'combo' && Object.keys(config.chartData[0])[3] && (
                        <Line 
                          type="monotone" 
                          dataKey={Object.keys(config.chartData[0])[3]} 
                          stroke="#f59e0b" 
                          strokeWidth={2} 
                          strokeDasharray="4 4" 
                        />
                      )}
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* 📋 SECTION B: RAW DATA TABLE */}
              <div className="p-4 sm:p-5 rounded-2xl bg-card/85 backdrop-blur-xl border border-border/80 shadow-lg space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
                  <div className="flex items-center gap-2">
                    <FileSpreadsheet className="w-4 h-4 text-primary" />
                    <h3 className="font-bold text-sm text-foreground">
                      Bảng Dữ Liệu Chi Tiết (Raw Data Table)
                    </h3>
                  </div>

                  {/* Search Filter for Table */}
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-background/80 border border-border/80 text-xs w-48 sm:w-56">
                    <Search className="w-3.5 h-3.5 text-muted-foreground" />
                    <input
                      type="text"
                      placeholder="Tìm kiếm đội / chi nhánh..."
                      value={searchTableQuery}
                      onChange={(e) => setSearchTableQuery(e.target.value)}
                      className="bg-transparent text-xs text-foreground focus:outline-hidden w-full placeholder:text-muted-foreground/60"
                    />
                  </div>
                </div>

                {/* Table Container */}
                <div className="overflow-x-auto rounded-xl border border-border/60">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-muted/60 text-muted-foreground font-bold border-b border-border/60">
                      <tr>
                        {config.tableColumns.map((col) => (
                          <th 
                            key={col.key} 
                            className={`px-3.5 py-2.5 ${col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'}`}
                          >
                            {col.label}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border/40">
                      {filteredTableData.length > 0 ? (
                        filteredTableData.map((row, rowIdx) => (
                          <tr 
                            key={rowIdx} 
                            className="hover:bg-muted/40 transition-colors font-medium"
                          >
                            {config.tableColumns.map((col) => (
                              <td 
                                key={col.key} 
                                className={`px-3.5 py-2.5 ${col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left text-foreground'}`}
                              >
                                {col.key === 'status' ? (
                                  <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[10px] font-bold">
                                    {row[col.key]}
                                  </span>
                                ) : (
                                  row[col.key]
                                )}
                              </td>
                            ))}
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan={config.tableColumns.length} className="px-4 py-8 text-center text-muted-foreground">
                            Không tìm thấy kết quả phù hợp với từ khóa "{searchTableQuery}"
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>

              </div>

            </div>

            {/* RIGHT 1 COLUMN: [QUAN TRỌNG] AI INSIGHT PANEL */}
            <div className="lg:col-span-1">
              <AiInsightPanel
                pageId={config.id}
                metricTitle={config.title}
              />
            </div>

          </div>

        </div>

      </div>

    </div>
  )
}
