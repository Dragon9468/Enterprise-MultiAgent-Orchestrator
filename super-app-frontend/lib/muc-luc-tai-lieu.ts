import { 
  Sparkles, 
  Wifi, 
  Laptop, 
  CreditCard, 
  BarChart3, 
  Building, 
  Activity, 
  FileText, 
  Ticket, 
  Tag, 
  HelpCircle, 
  Flame,
  Wrench,
  Headset,
  TrendingUp,
  ShieldCheck,
  Bot,
  Shield,
  type LucideIcon 
} from 'lucide-react'
import rawCatalog from './Muc_Luc_Tai_Lieu.json'

// 🗺️ ICON MAPPER THEO TÊN
export const ICON_MAP: Record<string, LucideIcon> = {
  Sparkles,
  Wifi,
  Laptop,
  CreditCard,
  BarChart3,
  Building,
  Activity,
  FileText,
  Ticket,
  Tag,
  HelpCircle,
  Flame,
  Wrench,
  Headset,
  TrendingUp,
  ShieldCheck,
  Bot,
  Shield
}

// 📐 TYPE DEFINITIONS CHO BẢN ĐỒ DỮ LIỆU
export interface GDriveLookupConfig {
  folder_id: string
  file_prefix: string
  file_naming_pattern: string
  file_types: string[]
  sheet_names?: string[]
  key_columns?: string[]
  update_frequency?: string
}

export interface TopicItem {
  id: string
  name: string
  iconName: string
  icon: LucideIcon
  desc: string
  target_agent?: string
  gdrive_lookup?: GDriveLookupConfig
}

export interface DepartmentCatalog {
  code: string
  name_vi: string
  aliases: string[]
  default_topic: string
  trending_prompts: string[]
  topics: TopicItem[]
}

export type DepartmentKey = 'ky_thuat' | 'cskh' | 'kinh_doanh' | 'quan_ly'

// 🤖 ĐỊNH NGHĨA 4 CHAT AGENTS CHUYÊN BIỆT
export interface ChatAgentDefinition {
  id: DepartmentKey
  code: string
  name: string
  fullName: string
  department: string
  icon: LucideIcon
  description: string
  minRoleLevel: number
  badgeColor: string
}

export const CHAT_AGENTS: Record<DepartmentKey, ChatAgentDefinition> = {
  ky_thuat: {
    id: 'ky_thuat',
    code: 'Technical',
    name: 'Agent Kỹ thuật',
    fullName: 'Agent Kỹ thuật (TIN/PNC/NVKT)',
    department: 'Kỹ thuật (NVKT)',
    icon: Wrench,
    description: 'Xử lý mạng, suy hao quang, sự cố ONT/Mesh và quy trình kỹ thuật',
    minRoleLevel: 1,
    badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/30'
  },
  cskh: {
    id: 'cskh',
    code: 'CSKH',
    name: 'Agent CSKH',
    fullName: 'Agent Chăm sóc Khách hàng',
    department: 'Chăm sóc Khách hàng (CSKH)',
    icon: Headset,
    description: 'Hỗ trợ hợp đồng, cước phí, xử lý khiếu nại và quy trình khách hàng',
    minRoleLevel: 1,
    badgeColor: 'text-purple-400 bg-purple-500/10 border-purple-500/30'
  },
  kinh_doanh: {
    id: 'kinh_doanh',
    code: 'Sales',
    name: 'Agent Kinh doanh',
    fullName: 'Agent Kinh doanh (Sales)',
    department: 'Kinh doanh (Sales)',
    icon: TrendingUp,
    description: 'Tra cứu bảng giá, gói cước dịch vụ, ưu đãi trả trước và hoa hồng',
    minRoleLevel: 1,
    badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
  },
  quan_ly: {
    id: 'quan_ly',
    code: 'Management',
    name: 'Agent Quản lý',
    fullName: 'Agent Quản lý & Điều hành',
    department: 'Ban Giám Đốc Chi Nhánh',
    icon: ShieldCheck,
    description: 'Báo cáo hợp nhất chi nhánh, so sánh khu vực, cảnh báo điểm nóng hạ tầng',
    minRoleLevel: 4,
    badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
  }
}

/**
 * 🧭 Chuẩn hóa và nhận diện DepartmentKey từ department string hoặc role_level
 */
export function resolveDepartmentKey(department?: string | string[] | null, roleLevel?: number): DepartmentKey {
  // Nếu Role Level >= 5 (Giám đốc, Admin) -> Ưu tiên bộ công cụ Quản lý nếu không chỉ định rõ phòng ban kỹ thuật đặc thù
  if (roleLevel && roleLevel >= 5) {
    return 'quan_ly'
  }

  let depStr = ''
  if (Array.isArray(department)) {
    depStr = department[0] || ''
  } else if (typeof department === 'string') {
    depStr = department
  }

  const d = depStr.toLowerCase().trim()
  if (!d) {
    if (roleLevel && roleLevel >= 4) return 'quan_ly'
    return 'ky_thuat'
  }

  // Quản lý / Giám đốc / Trưởng phòng
  if (
    d.includes('quản') || d.includes('quan') || d.includes('giám đốc') || d.includes('giam doc') || 
    d.includes('director') || d.includes('manager') || d.includes('ban giám đốc') || d.includes('ban giam doc') ||
    d.includes('kế toán') || d.includes('ke toan')
  ) {
    return 'quan_ly'
  }

  // CSKH / Dịch vụ khách hàng
  if (
    d.includes('cskh') || d.includes('chăm sóc') || d.includes('cham soc') || 
    d.includes('khách hàng') || d.includes('khach hang') || d.includes('dvkh') ||
    d.includes('thu ngân') || d.includes('quầy')
  ) {
    return 'cskh'
  }

  // Sales / Kinh doanh
  if (
    d.includes('sale') || d.includes('kinh doanh') || d.includes('kinh_doanh') || 
    d.includes('p.kd') || d.includes('phòng kinh doanh')
  ) {
    return 'kinh_doanh'
  }

  // Kỹ thuật / NVKT / TIN / PNC / Điều hành kỹ thuật
  if (
    d.includes('kỹ') || d.includes('ky') || d.includes('tech') || 
    d.includes('nvkt') || d.includes('tin') || d.includes('pnc') || 
    d.includes('hạ tầng') || d.includes('ha tang')
  ) {
    return 'ky_thuat'
  }

  // Fallback theo role level
  if (roleLevel && roleLevel >= 4) return 'quan_ly'
  return 'ky_thuat'
}

/**
 * 🛡️ PHÂN QUYỀN AGENT THEO LEVEL:
 * Lấy danh sách các Chat Agent mà User được phép sử dụng dựa trên Department & Role Level
 */
export function getAvailableAgentsForUser(
  department?: string | string[] | null,
  roleLevel?: number
): ChatAgentDefinition[] {
  const level = roleLevel || 1
  const homeKey = resolveDepartmentKey(department, level)

  // Level 5, 6, 7 (Giám đốc, Admin): Truy cập toàn bộ 4 Agents
  if (level >= 5) {
    return [
      CHAT_AGENTS.quan_ly,
      CHAT_AGENTS.ky_thuat,
      CHAT_AGENTS.kinh_doanh,
      CHAT_AGENTS.cskh
    ]
  }

  // Level 4 (Trưởng phòng): Truy cập Agent nhà mình + Agent Quản lý + các Agent nghiệp vụ khác
  if (level === 4) {
    const list: ChatAgentDefinition[] = [
      CHAT_AGENTS[homeKey] || CHAT_AGENTS.ky_thuat,
      CHAT_AGENTS.quan_ly
    ]
    Object.values(CHAT_AGENTS).forEach(a => {
      if (!list.some(item => item.id === a.id)) {
        list.push(a)
      }
    })
    return list
  }

  // Level 3 (Trưởng nhóm / Điều hành Khu vực): Truy cập Agent phòng ban + Agent nghiệp vụ liên quan
  if (level === 3) {
    if (homeKey === 'ky_thuat') {
      return [CHAT_AGENTS.ky_thuat, CHAT_AGENTS.cskh]
    }
    if (homeKey === 'kinh_doanh') {
      return [CHAT_AGENTS.kinh_doanh, CHAT_AGENTS.cskh]
    }
    if (homeKey === 'cskh') {
      return [CHAT_AGENTS.cskh, CHAT_AGENTS.ky_thuat]
    }
    return [CHAT_AGENTS[homeKey] || CHAT_AGENTS.ky_thuat, CHAT_AGENTS.cskh]
  }

  // Level 1 & 2 (Nhân viên / Chuyên viên): Chỉ được dùng Agent trực thuộc phòng ban của mình
  return [CHAT_AGENTS[homeKey] || CHAT_AGENTS.ky_thuat]
}

// 🧭 Danh sách 6 Chủ đề chuẩn hóa 100% khớp với 6 nhánh rẽ trong Chatflow Điều Phối Tổng
export const CHATFLOW_ROUTER_TOPICS: TopicItem[] = [
  { 
    id: 'Chung', 
    name: 'Chung', 
    iconName: 'Sparkles', 
    icon: Sparkles, 
    desc: 'Tra cứu quy trình & hướng dẫn chung',
    target_agent: 'General'
  },
  { 
    id: 'Doc & Sheet', 
    name: 'Doc & Sheet', 
    iconName: 'FileText', 
    icon: FileText, 
    desc: 'Truy xuất Google Drive, Doc & Google Sheet',
    target_agent: 'Technical'
  },
  { 
    id: 'Thiết bị', 
    name: 'Thiết bị', 
    iconName: 'Laptop', 
    icon: Laptop, 
    desc: 'Thiết bị ONT, Modem, AP Mesh, Box',
    target_agent: 'Technical'
  },
  { 
    id: 'Giá cước', 
    name: 'Giá cước', 
    iconName: 'CreditCard', 
    icon: CreditCard, 
    desc: 'Bảng giá & gói cước GIGA/SKY/META',
    target_agent: 'Sales'
  },
  { 
    id: 'Hành chính', 
    name: 'Hành chính', 
    iconName: 'Building', 
    icon: Building, 
    desc: 'Quy trình thủ tục & hồ sơ hành chính',
    target_agent: 'CSKH'
  },
  { 
    id: 'Chỉ số CV', 
    name: 'Chỉ số CV', 
    iconName: 'BarChart3', 
    icon: BarChart3, 
    desc: 'Chỉ số công việc & KPI cá nhân',
    target_agent: 'Technical'
  }
]

export const CHATFLOW_DEFAULT_TRENDING_PROMPTS: string[] = [
  'Tra cứu hướng dẫn xử lý suy hao quang',
  'Tra cứu bảng giá gói cước IBB mới nhất',
  'Kiểm tra chỉ số công việc & KPI cá nhân',
  'Quy trình đổi trả và bảo hành thiết bị ONT/Mesh'
]

/**
 * 📦 Lấy toàn bộ Catalog của Chatflow Điều Phối Tổng
 */
export function getDepartmentCatalog(
  departmentOrAgentKey?: string | string[] | null, 
  roleLevel?: number
): DepartmentCatalog {
  return {
    code: 'unified_chatflow',
    name_vi: 'Điều Phối Tổng',
    aliases: ['tong hop', 'da nang', 'chung'],
    default_topic: 'Chung',
    trending_prompts: CHATFLOW_DEFAULT_TRENDING_PROMPTS,
    topics: CHATFLOW_ROUTER_TOPICS
  }
}

/**
 * 🔍 Lấy danh sách Topic động theo phòng ban / agent
 */
export function getDynamicTopics(departmentOrAgentKey?: string | string[] | null, roleLevel?: number): TopicItem[] {
  return getDepartmentCatalog(departmentOrAgentKey, roleLevel).topics
}

/**
 * 🔥 Lấy danh sách Trending Prompts theo phòng ban / agent
 */
export function getDynamicTrendingPrompts(departmentOrAgentKey?: string | string[] | null, roleLevel?: number): string[] {
  return getDepartmentCatalog(departmentOrAgentKey, roleLevel).trending_prompts
}

/**
 * 📍 Tìm chi tiết 1 topic bất kỳ trong catalog
 */
export function findTopicById(
  topicId: string, 
  departmentOrAgentKey?: string | string[] | null, 
  roleLevel?: number
): TopicItem | undefined {
  const catalog = getDepartmentCatalog(departmentOrAgentKey, roleLevel)
  return catalog.topics.find(t => t.id === topicId)
}

export default rawCatalog
