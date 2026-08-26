'use client'

import { useState, useEffect, useMemo, useRef } from 'react'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
  SendHorizontal, RefreshCcw, Activity, Ticket, X, Plus,
  MessageSquare, Pin, Archive, ArchiveRestore, PanelLeftClose, PanelLeftOpen,
  ChevronDown, ChevronUp, Trash2, Search, HelpCircle, Tag, Sparkles,
  Flame, Wifi, Laptop, CreditCard, Building, CheckCircle2, FileText, BarChart3,
  Mic, MicOff, Volume2, Shield, Bot, Check, Wrench, Headset, TrendingUp, ShieldCheck,
  Brain, Loader2, AlertTriangle
} from 'lucide-react'
import { pb } from '@/lib/pocketbase'
import {
  sendClientChat,
  fetchClientConversations,
  fetchClientMessages,
  deleteClientConversation,
  renameClientConversation,
  STANDARD_RATE_LIMIT_MSG,
  isRateLimitError,
  type ThoughtStep
} from '@/lib/dify'
import { useSpeechRecognition } from '@/hooks'
import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import DOMPurify from 'dompurify'
import {
  getDepartmentCatalog,
  getAvailableAgentsForUser,
  resolveDepartmentKey,
  CHAT_AGENTS,
  type TopicItem,
  type ChatAgentDefinition,
  type DepartmentKey
} from '@/lib/muc-luc-tai-lieu'

// OWASP Top 10 for LLM (LLM02: Insecure Output Handling / XSS):
// Tự động lọc sạch các thẻ <script>, <iframe>, <object>, inline handlers nguy hiểm từ luồng phản hồi AI
const sanitizeMarkdownContent = (rawText: string): string => {
  if (!rawText) return ''
  if (typeof window !== 'undefined') {
    return DOMPurify.sanitize(rawText, {
      FORBID_TAGS: ['script', 'iframe', 'object', 'embed', 'form', 'input', 'button', 'meta', 'link', 'style'],
      FORBID_ATTR: ['onerror', 'onload', 'onclick', 'onmouseover', 'onfocus', 'onblur', 'style'],
      ALLOWED_URI_REGEXP: /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i
    })
  }
  return rawText
}

// Hàm bỏ dấu tiếng Việt chuẩn để hỗ trợ search không dấu
const removeAccents = (str: string): string => {
  if (!str) return ''
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toLowerCase()
    .trim()
}

// Data Mẫu Bộ Hỏi - Đáp Nhanh
interface QAItem {
  id: string
  category: 'mang' | 'thiet-bi' | 'gia-cuoc' | 'tu-van'
  categoryLabel: string
  tag: string
  question: string
  answer: string
}

const SAMPLE_QA_DATA: QAItem[] = [
  {
    id: 'qa-1',
    category: 'mang',
    categoryLabel: 'Mạng',
    tag: '#WiFiChậm',
    question: 'Làm thế nào khi đường truyền mạng WiFi bị chậm hoặc chập chờn bất thường?',
    answer: 'Bạn hãy thử rút dây nguồn Modem trong 30 giây rồi cắm lại. Ngoài ra, thử chuyển sang kết nối băng tần WiFi 5GHz để giảm thiểu nhiễu sóng từ các thiết bị xung quanh.'
  },
  {
    id: 'qa-2',
    category: 'mang',
    categoryLabel: 'Mạng',
    tag: '#SuyHaoQuang',
    question: 'Chỉ số công suất quang (Rx Power) lý tưởng trên Modem quang là bao nhiêu?',
    answer: 'Chỉ số suy hao quang chuẩn trên modem ONT doanh nghiệp nằm trong khoảng từ -15 dBm đến -25 dBm. Nếu chỉ số dưới -27 dBm, đường dây quang có thể bị gập gãy hoặc dơ đầu kết nối.'
  },
  {
    id: 'qa-3',
    category: 'mang',
    categoryLabel: 'Mạng',
    tag: '#ĐổiDNS',
    question: 'Cách cài đặt DNS Google (8.8.8.8) trên máy tính để tối ưu tốc độ truy cập web?',
    answer: 'Vào Control Panel > Network and Sharing Center > Change adapter settings. Nhấp chuột phải vào Ethernet/WiFi > Properties > chọn Internet Protocol Version 4 (TCP/IPv4) > nhập Preferred DNS: 8.8.8.8 và Alternate DNS: 8.8.4.4.'
  },
  {
    id: 'qa-4',
    category: 'thiet-bi',
    categoryLabel: 'Thiết bị',
    tag: '#ĐènModem',
    question: 'Đèn PON trên Modem sáng đỏ hoặc nhấp nháy liên tục nghĩa là gì?',
    answer: 'Đèn PON báo đỏ/tắt có nghĩa là Modem mất hoàn toàn tín hiệu cáp quang từ đài trạm. Vui lòng kiểm tra lại dây cáp màu vàng cắm vào Modem hoặc sử dụng ứng dụng Thực thi để tạo Ticket hỗ trợ.'
  },
  {
    id: 'qa-5',
    category: 'thiet-bi',
    categoryLabel: 'Thiết bị',
    tag: '#WiFiMesh',
    question: 'Bộ phát Access Point / WiFi Mesh mất kết nối với Router chính?',
    answer: 'Kiểm tra đèn trạng thái trên bộ Mesh. Nếu đèn báo màu đỏ, hãy di chuyển bộ Mesh lại gần Router chính trong bán kính 3m, bấm nút WPS trên cả 2 thiết bị trong 3 giây để đồng bộ lại.'
  },
  {
    id: 'qa-6',
    category: 'thiet-bi',
    categoryLabel: 'Thiết bị',
    tag: '#SmartTVBox',
    question: 'Thiết bị Smart Media Box bị đứng hình, giật lag hoặc xem video không có tiếng?',
    answer: 'Đảm bảo dây cáp HDMI/AV cắm chặt. Khởi động lại Box bằng cách rút nguồn. Nếu ứng dụng bị giật, hãy vào Cài đặt > Ứng dụng > Quản lý ứng dụng > Xóa bộ nhớ đệm (Clear Cache).'
  },
  {
    id: 'qa-7',
    category: 'gia-cuoc',
    categoryLabel: 'Giá cước',
    tag: '#GóiCướcFiber',
    question: 'Sự khác biệt giữa gói cước Internet Fiber 150M và gói Gigabit là gì?',
    answer: 'Gói Fiber 150M đáp ứng tốc độ Download/Upload đối xứng 150 Mbps. Gói Gigabit cung cấp tốc độ Download không giới hạn lên tới 1 Gbps (phụ thuộc thiết bị) và tốc độ Upload 150 Mbps, phù hợp cho doanh nghiệp và văn phòng đông người.'
  },
  {
    id: 'qa-8',
    category: 'gia-cuoc',
    categoryLabel: 'Giá cước',
    tag: '#ThanhToánCước',
    question: 'Các kênh thanh toán cước Internet hàng tháng không mất phí?',
    answer: 'Khách hàng có thể thanh toán trực tiếp qua Cổng thông tin khách hàng, Ví điện tử MoMo, VNPay, ZaloPay, dịch vụ Auto-banking của các Ngân hàng hoặc thanh toán tại Quầy giao dịch gần nhất.'
  },
  {
    id: 'qa-9',
    category: 'gia-cuoc',
    categoryLabel: 'Giá cước',
    tag: '#ƯuĐãiTrảTrước',
    question: 'Khuyến mãi khi tham gia chính sách thanh toán trả trước 6 tháng hoặc 12 tháng?',
    answer: 'Trả trước 6 tháng: Tặng ngay 1 tháng cước sử dụng thứ 7. Trả trước 12 tháng: Tặng ngay 2 tháng cước thứ 13 & 14, miễn phí hòa mạng và trang bị Modem WiFi 6 hiện đại.'
  },
  {
    id: 'qa-10',
    category: 'tu-van',
    categoryLabel: 'Tư vấn',
    tag: '#ChuyểnĐịaĐiểm',
    question: 'Quy trình và thủ tục chuyển địa điểm lắp đặt đường truyền sang địa chỉ mới?',
    answer: 'Chủ hợp đồng chỉ cần mang CCCD đến điểm giao dịch hoặc gửi yêu cầu di chuyển địa điểm trên ứng dụng Portal chăm sóc khách hàng. Kỹ thuật viên sẽ hỗ trợ khảo sát và hạ tầng đường truyền mới miễn phí.'
  },
  {
    id: 'qa-11',
    category: 'tu-van',
    categoryLabel: 'Tư vấn',
    tag: '#ĐổiPassWiFi',
    question: 'Hướng dẫn đổi tên và mật khẩu WiFi tại văn phòng đơn giản nhất?',
    answer: 'Đăng nhập ứng dụng quản lý mạng bằng số điện thoại hợp đồng > Chọn mục "Quản lý thiết bị" > Chọn "Đổi mật khẩu WiFi" > Nhập mật khẩu mới và bấm "Lưu". Modem sẽ tự khởi động lại và cập nhật mật khẩu mới.'
  }
]

const ALL_TAGS = Array.from(new Set(SAMPLE_QA_DATA.map(i => i.tag)))

interface Message {
  role: string
  content: string
  thoughts?: ThoughtStep[]
  isStreaming?: boolean
  isError?: boolean
  isRateLimit?: boolean
}

// Sub-component Khối Giao diện "Dòng suy nghĩ" (Thought Stream Accordion & Live Progress)
const ThoughtStreamView = ({
  thoughts,
  isStreaming,
  currentStatus
}: {
  thoughts?: ThoughtStep[]
  isStreaming?: boolean
  currentStatus?: string
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(true)

  if (!thoughts || thoughts.length === 0) {
    if (!isStreaming) return null
    return (
      <div className="mb-3 p-2.5 rounded-xl bg-primary/10 border border-primary/20 text-xs text-primary flex items-center gap-2 animate-pulse">
        <Sparkles className="w-4 h-4 text-primary animate-spin flex-shrink-0" />
        <span className="font-medium">{currentStatus || 'Đang khởi động điều phối tiến trình AI...'}</span>
      </div>
    )
  }

  const hasError = thoughts.some(t => t.status === 'error')
  const completedCount = thoughts.filter(t => t.status === 'completed').length
  const activeStep = thoughts.find(t => t.status === 'running') || thoughts[thoughts.length - 1]

  // Tắt hiệu ứng quay/nhấp nháy ngay khi gặp lỗi/quá tải
  const effectiveIsStreaming = isStreaming && !hasError

  return (
    <div
      className={`mb-3 rounded-xl border overflow-hidden text-xs shadow-xs transition-all ${
        hasError
          ? 'border-amber-500/30 bg-amber-500/5 backdrop-blur-md'
          : 'border-border/80 bg-background/70 backdrop-blur-md'
      }`}
    >
      {/* Header Accordion Bar */}
      <div
        onClick={() => setIsExpanded(prev => !prev)}
        className={`flex items-center justify-between px-3 py-2 cursor-pointer select-none transition-colors border-b ${
          hasError
            ? 'bg-amber-500/10 hover:bg-amber-500/15 border-amber-500/20'
            : 'bg-muted/40 hover:bg-muted/70 border-border/40'
        }`}
      >
        <div className="flex items-center gap-2 overflow-hidden flex-1">
          <div
            className={`w-5 h-5 rounded-lg flex items-center justify-center flex-shrink-0 ${
              hasError
                ? 'bg-amber-500/20 text-amber-600 dark:text-amber-400'
                : 'bg-primary/15 text-primary'
            }`}
          >
            {effectiveIsStreaming ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
            ) : hasError ? (
              <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
            ) : (
              <Brain className="w-3.5 h-3.5 text-primary" />
            )}
          </div>
          <div className="flex items-center gap-2 truncate">
            {effectiveIsStreaming ? (
              <span className="font-semibold text-foreground truncate flex items-center gap-1.5">
                <span className="inline-block w-2 h-2 rounded-full bg-primary animate-ping" />
                <span className="truncate">{activeStep?.title || currentStatus || 'Đang thực thi các bước...'}</span>
              </span>
            ) : hasError ? (
              <span className="font-medium text-amber-700 dark:text-amber-400 truncate flex items-center gap-1.5">
                <span className="font-bold">⚠️</span>
                <span className="truncate">{activeStep?.title || 'Tiến trình tạm dừng do quá tải/lỗi'}</span>
              </span>
            ) : (
              <span className="font-medium text-muted-foreground truncate flex items-center gap-1.5">
                <span className="text-emerald-500 font-bold">✓</span>
                <span>Đã hoàn tất {thoughts.length} bước xử lý dữ liệu</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0 ml-2">
          {effectiveIsStreaming ? (
            <span className="px-1.5 py-0.5 rounded-md bg-primary/20 text-primary text-[10px] font-bold uppercase tracking-wider animate-pulse">
              Live
            </span>
          ) : hasError ? (
            <span className="px-1.5 py-0.5 rounded-md bg-amber-500/20 text-amber-700 dark:text-amber-400 text-[10px] font-bold uppercase tracking-wider">
              Cảnh báo
            </span>
          ) : null}
          <span className="text-[11px] text-muted-foreground font-mono">
            {completedCount}/{thoughts.length}
          </span>
          <button className="text-muted-foreground hover:text-foreground">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Expanded Step Timeline List */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="p-2.5 space-y-2 bg-card/40"
          >
            {thoughts.map((step, idx) => (
              <div key={step.id || idx} className="flex items-start gap-2 text-[11.5px] leading-relaxed">
                <div className="mt-0.5 flex-shrink-0">
                  {step.status === 'running' ? (
                    <Loader2 className="w-3.5 h-3.5 text-primary animate-spin" />
                  ) : step.status === 'error' ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  ) : (
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={`font-medium truncate ${step.status === 'running' ? 'text-primary font-semibold' : 'text-muted-foreground'}`}>
                      {step.title}
                    </span>
                    <span className="text-[10px] text-muted-foreground/60 font-mono ml-2 flex-shrink-0">
                      {new Date(step.timestamp).toLocaleTimeString('vi-VN', { minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  {step.detail && (
                    <div className="mt-1 p-1.5 rounded-lg bg-background/90 border border-border/50 text-[10.5px] font-mono text-muted-foreground overflow-x-auto whitespace-pre-wrap max-h-24 custom-scrollbar">
                      {step.detail}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  isPinned?: boolean
  isArchived?: boolean
  difyConversationId?: string | null
}

const getEmployeeId = (userModel: any): string => {
  if (!userModel) return 'anonymous'
  if (userModel.emp_id) return String(userModel.emp_id)
  if (userModel.employee_id) return String(userModel.employee_id)
  if (userModel.username) return String(userModel.username).split('@')[0].toUpperCase()
  if (userModel.email) return String(userModel.email).split('@')[0].toUpperCase()
  return userModel.id || 'anonymous'
}

// Sub-component Item Lịch Sử Chat
const ChatItemItem = ({
  session,
  isActive,
  onSelect,
  onTogglePin,
  onToggleArchive
}: {
  session: ChatSession
  isActive: boolean
  onSelect: () => void
  onTogglePin: (e: React.MouseEvent) => void
  onToggleArchive: (e: React.MouseEvent) => void
}) => {
  return (
    <div
      onClick={onSelect}
      className={`flex items-center justify-between p-2 rounded-xl cursor-pointer text-[11.5px] transition-all group relative ${isActive
        ? 'bg-primary/15 text-primary border border-primary/30 font-semibold'
        : 'text-muted-foreground hover:bg-muted/80 hover:text-foreground'
        }`}
    >
      <button
        onClick={onTogglePin}
        className="w-5.5 h-5.5 rounded-lg hover:bg-primary/20 hover:text-primary flex items-center justify-center transition-all flex-shrink-0 mr-1.5 group/pin cursor-pointer relative"
        title={session.isPinned ? "Bỏ ghim" : "Ghim đoạn chat"}
      >
        {session.isPinned ? (
          <Pin className="w-3 h-3 text-primary fill-primary rotate-45 transition-transform" />
        ) : (
          <div className="relative w-3 h-3 flex items-center justify-center">
            <MessageSquare className="w-3 h-3 opacity-70 group-hover/pin:opacity-0 transition-opacity absolute" />
            <Pin className="w-3 h-3 opacity-0 group-hover/pin:opacity-100 transition-opacity absolute text-primary rotate-45" />
          </div>
        )}
      </button>

      <span className="truncate leading-tight flex-1 mr-1.5">{session.title}</span>

      <button
        onClick={onToggleArchive}
        className="opacity-0 group-hover:opacity-100 p-1 hover:text-amber-400 hover:bg-amber-500/10 rounded-lg transition-all flex-shrink-0 cursor-pointer"
        title="Lưu trữ cuộc trò chuyện"
      >
        <Archive className="w-3 h-3" />
      </button>
    </div>
  )
}

export default function WorkspacePage() {
  const [activeTab, setActiveTab] = useState<'tro-chuyen' | 'tra-cuu'>('tro-chuyen')
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState<Message[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [user, setUser] = useState<any>(null)

  // 🛡️ State User Role Level (Mặc định lấy từ user.role_level hoặc 1, hỗ trợ chuyển đổi level giả lập L1-L5)
  const [userLevel, setUserLevel] = useState<number>(1)

  // 🤖 Danh sách các Agent được phân quyền theo Level & Department của User
  const availableAgents = useMemo(() => {
    return getAvailableAgentsForUser(user?.department, userLevel)
  }, [user?.department, userLevel])

  // 🎯 Key Agent đang được chọn
  const [selectedAgentKey, setSelectedAgentKey] = useState<DepartmentKey>('ky_thuat')

  // Đảm bảo selectedAgentKey luôn hợp lệ khi User hoặc Level thay đổi
  useEffect(() => {
    if (availableAgents.length > 0 && !availableAgents.some(a => a.id === selectedAgentKey)) {
      setSelectedAgentKey(availableAgents[0].id)
    }
  }, [availableAgents, selectedAgentKey])

  // 🤖 Thông tin Agent hiện tại
  const activeAgent = CHAT_AGENTS[selectedAgentKey] || CHAT_AGENTS.ky_thuat

  // 🧭 Lấy Catalog & Danh sách Chủ đề theo Agent đang chọn
  const deptCatalog = useMemo(() => {
    return getDepartmentCatalog(selectedAgentKey, userLevel)
  }, [selectedAgentKey, userLevel])

  const dynamicTopics = deptCatalog.topics
  const dynamicTrendingPrompts = deptCatalog.trending_prompts

  const [selectedTopic, setSelectedTopic] = useState<string>(deptCatalog.default_topic)

  // Đảm bảo selectedTopic luôn đồng bộ và hợp lệ khi đổi Agent
  useEffect(() => {
    if (dynamicTopics.length > 0 && !dynamicTopics.some(t => t.id === selectedTopic)) {
      setSelectedTopic(deptCatalog.default_topic)
    }
  }, [deptCatalog, dynamicTopics, selectedTopic])

  // Popover State & Ref cho Dropdown Chọn Agent
  const [isAgentMenuOpen, setIsAgentMenuOpen] = useState(false)
  const agentMenuRef = useRef<HTMLDivElement>(null)

  // Đóng popover chọn agent khi click ra ngoài
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (agentMenuRef.current && !agentMenuRef.current.contains(e.target as Node)) {
        setIsAgentMenuOpen(false)
      }
    }
    if (isAgentMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isAgentMenuOpen])

  const handleSelectAgent = (agentKey: DepartmentKey) => {
    if (selectedAgentKey !== agentKey) {
      setSelectedAgentKey(agentKey)
      setIsAgentMenuOpen(false)
      // Khi đổi sang Agent khác, khởi tạo lại luồng hội thoại mới cho Agent đó
      setDifyConversationId(null)
    }
  }

  const [chatHistory, setChatHistory] = useState<ChatSession[]>([])
  const [currentConversationId, setCurrentConversationId] = useState<string | null>(null)
  const [difyConversationId, setDifyConversationId] = useState<string | null>(null)
  const [showAllUnpinned, setShowAllUnpinned] = useState(false)
  const [isHistoryCollapsed, setIsHistoryCollapsed] = useState(false)
  const [showArchiveModal, setShowArchiveModal] = useState(false)

  const [qaSearch, setQaSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'mang' | 'thiet-bi' | 'gia-cuoc' | 'tu-van'>('all')

  // 🎙️ Hook Nhận diện Giọng nói Client-side (Web Speech API)
  const {
    isListening,
    isSupported: isSpeechSupported,
    errorMessage: speechError,
    toggleListening,
    stopListening
  } = useSpeechRecognition({
    lang: 'vi-VN',
    continuous: true,
    interimResults: true,
    onResult: (transcriptText) => {
      // Tự động điền văn bản nhận diện được vào ô input (người dùng tự bấm gửi, có thể chỉnh sửa)
      setInput(transcriptText)
    },
    onError: (err) => {
      console.warn('[Speech Recognition]:', err)
    }
  })

  useEffect(() => {
    const userModel = pb.authStore.model
    setUser(userModel)
    const initialLevel = userModel?.role_level || 1
    setUserLevel(initialLevel)
    const initialAgentKey = resolveDepartmentKey(userModel?.department, initialLevel)
    setSelectedAgentKey(initialAgentKey)
    const empId = getEmployeeId(userModel)
    const storageKey = `app_chat_history_${empId}`

    // Reset local state first to prevent showing previous user's history
    setChatHistory([])
    setCurrentConversationId(null)
    setDifyConversationId(null)
    setMessages([])

    // Load employee-isolated local storage
    let localSessions: ChatSession[] = []
    const saved = localStorage.getItem(storageKey)
    if (saved) {
      try {
        localSessions = JSON.parse(saved)
        setChatHistory(localSessions)
        if (localSessions.length > 0) {
          const firstActive = localSessions.find((s: ChatSession) => !s.isArchived)
          if (firstActive) {
            setCurrentConversationId(firstActive.id)
            setDifyConversationId(firstActive.difyConversationId || null)
            setMessages(firstActive.messages || [])
          }
        }
      } catch (e) { }
    }

    // Sync from Dify Service API for this specific employee
    if (userModel && empId !== 'anonymous') {
      (async () => {
        try {
          const res = await fetchClientConversations({
            department: userModel.department,
            user_email: userModel.email,
            emp_id: empId,
            limit: 30
          })

          if (res && Array.isArray(res.data)) {
            const difyList = res.data
            setChatHistory(prev => {
              const prevMap = new Map(prev.map(s => [s.difyConversationId || s.id, s]))
              const merged: ChatSession[] = difyList.map((item: any) => {
                const existing = prevMap.get(item.id)
                return {
                  id: item.id,
                  title: item.name && item.name !== 'New chat' ? item.name : (existing?.title || 'Đoạn trò chuyện'),
                  messages: existing?.messages || [],
                  createdAt: item.created_at ? item.created_at * 1000 : Date.now(),
                  isPinned: existing?.isPinned || false,
                  isArchived: existing?.isArchived || false,
                  difyConversationId: item.id
                }
              })

              // Retain local sessions not on Dify list
              const difyIdSet = new Set(difyList.map((item: any) => item.id))
              prev.forEach(s => {
                if (s.difyConversationId && !difyIdSet.has(s.difyConversationId)) {
                  // Ignore deleted
                } else if (!s.difyConversationId) {
                  merged.push(s)
                }
              })

              localStorage.setItem(storageKey, JSON.stringify(merged))
              return merged
            })
          }
        } catch (err) {
          console.error('Error syncing Dify conversations:', err)
        }
      })()
    }
  }, [])

  const saveHistoryToStorage = (updatedHistory: ChatSession[]) => {
    const empId = getEmployeeId(user || pb.authStore.model)
    const storageKey = `app_chat_history_${empId}`
    setChatHistory(updatedHistory)
    localStorage.setItem(storageKey, JSON.stringify(updatedHistory))
  }

  const handleSelectTopic = (topicId: string) => {
    if (selectedTopic !== topicId) {
      setSelectedTopic(topicId)
      // Nếu user đổi Chủ đề (Topic) ở Sidebar, xóa conversation_id hiện tại để bắt đầu luồng chat mới
      setDifyConversationId(null)
    }
  }

  const startNewChat = () => {
    const newSessionId = `session-${Date.now()}`
    const newSession: ChatSession = {
      id: newSessionId,
      title: 'Đoạn trò chuyện mới',
      messages: [],
      createdAt: Date.now(),
      isPinned: false,
      isArchived: false,
      difyConversationId: null
    }
    const updated = [newSession, ...chatHistory]
    saveHistoryToStorage(updated)
    setCurrentConversationId(newSessionId)
    setDifyConversationId(null)
    setMessages([])
  }

  const loadChatSession = async (session: ChatSession) => {
    setCurrentConversationId(session.id)
    const convId = session.difyConversationId || (session.id.length > 20 ? session.id : null)
    setDifyConversationId(convId)

    if (session.messages && session.messages.length > 0) {
      setMessages(session.messages)
    } else if (convId) {
      setIsLoading(true)
      try {
        const empId = getEmployeeId(user)
        const res = await fetchClientMessages({
          conversation_id: convId,
          department: user?.department,
          user_email: user?.email,
          emp_id: empId
        })
        if (res && Array.isArray(res.data)) {
          const fetchedMessages: Message[] = []
          const list = [...res.data].reverse()
          list.forEach((m: any) => {
            if (m.query) fetchedMessages.push({ role: 'user', content: m.query })
            if (m.answer) fetchedMessages.push({ role: 'assistant', content: m.answer })
          })
          setMessages(fetchedMessages)

          setChatHistory(prev => {
            const updated = prev.map(s => s.id === session.id ? { ...s, messages: fetchedMessages } : s)
            const empId = getEmployeeId(user)
            localStorage.setItem(`app_chat_history_${empId}`, JSON.stringify(updated))
            return updated
          })
        }
      } catch (err) {
        console.error('Error fetching Dify messages:', err)
      } finally {
        setIsLoading(false)
      }
    } else {
      setMessages([])
    }
  }

  const togglePin = (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()
    const targetSession = chatHistory.find(s => s.id === sessionId)
    if (!targetSession) return

    const currentPinnedCount = chatHistory.filter(s => s.isPinned && !s.isArchived).length
    if (!targetSession.isPinned && currentPinnedCount >= 5) {
      alert("Bạn chỉ được ghim tối đa 5 đoạn chat!")
      return
    }

    const updated = chatHistory.map(s => {
      if (s.id === sessionId) {
        return { ...s, isPinned: !s.isPinned }
      }
      return s
    })
    saveHistoryToStorage(updated)
  }

  const toggleArchive = (sessionId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation()
    const target = chatHistory.find(s => s.id === sessionId)
    const convId = target?.difyConversationId || (target?.id && target.id.length > 20 ? target.id : null)

    if (convId) {
      deleteClientConversation({
        conversation_id: convId,
        department: user?.department,
        user_email: user?.email,
        emp_id: getEmployeeId(user)
      }).catch(err => console.error('Dify delete conversation error:', err))
    }

    const updated = chatHistory.map(s => {
      if (s.id === sessionId) {
        return { ...s, isArchived: !s.isArchived, isPinned: false }
      }
      return s
    })
    saveHistoryToStorage(updated)

    if (currentConversationId === sessionId) {
      const remainingActive = updated.filter(s => !s.isArchived)
      if (remainingActive.length > 0) {
        loadChatSession(remainingActive[0])
      } else {
        startNewChat()
      }
    }
  }

  const handleSendChat = async (userPromptText?: string) => {
    // Dừng nhận diện giọng nói nếu đang mở
    if (isListening) {
      stopListening()
    }

    const promptToSend = userPromptText || input
    if (!promptToSend.trim() || isLoading) return

    let activeSessionId = currentConversationId
    let currentSessions = [...chatHistory]

    if (!activeSessionId || !currentSessions.some(s => s.id === activeSessionId)) {
      activeSessionId = `session-${Date.now()}`
      const newSession: ChatSession = {
        id: activeSessionId,
        title: promptToSend.slice(0, 30),
        messages: [],
        createdAt: Date.now(),
        isPinned: false,
        isArchived: false,
        difyConversationId: difyConversationId
      }
      currentSessions = [newSession, ...currentSessions]
      setCurrentConversationId(activeSessionId)
    }

    const currentEmpId = getEmployeeId(user)
    const newMessages: Message[] = [...messages, { role: 'user', content: promptToSend }]
    setMessages(newMessages)
    if (!userPromptText) setInput('')
    setIsLoading(true)

    let latestThoughts: ThoughtStep[] = []

    try {
      const data = await sendClientChat({
        query: promptToSend,
        department: activeAgent.code || user?.department || 'IBB',
        department_id: user?.department_id ?? (Number(userLevel) >= 4 ? '' : '1'),
        role_level: userLevel,
        user_email: user?.email,
        emp_id: currentEmpId,
        sys_topic: selectedTopic,
        conversation_id: difyConversationId,
        onThought: (step, allSteps) => {
          latestThoughts = allSteps
          setMessages(prev => {
            const updated = [...prev]
            const lastMsg = updated[updated.length - 1]
            if (lastMsg && lastMsg.role === 'assistant') {
              return updated.map((m, idx) => idx === updated.length - 1 ? { ...m, thoughts: allSteps, isStreaming: true } : m)
            } else {
              return [...updated, { role: 'assistant', content: '', thoughts: allSteps, isStreaming: true }]
            }
          })
        },
        onChunk: (partialAnswer) => {
          setMessages(prev => {
            const updated = [...prev]
            const lastMsg = updated[updated.length - 1]
            if (lastMsg && lastMsg.role === 'assistant') {
              return updated.map((m, idx) => idx === updated.length - 1 ? { ...m, content: partialAnswer, thoughts: latestThoughts, isStreaming: true } : m)
            } else {
              return [...updated, { role: 'assistant', content: partialAnswer, thoughts: latestThoughts, isStreaming: true }]
            }
          })
        }
      })

      const resText = typeof data === 'string' ? data : (data?.answer || 'Đã xử lý thông tin thành công.')
      const resConvId = typeof data === 'object' ? data?.conversation_id : null
      const updatedConvId = resConvId || difyConversationId

      if (updatedConvId) {
        setDifyConversationId(updatedConvId)

        // Trigger Dify AI auto-name generation in background if new session
        const currentSess = currentSessions.find(s => s.id === activeSessionId)
        if (currentSess && (currentSess.title === 'Đoạn trò chuyện mới' || currentSess.title === promptToSend.slice(0, 30))) {
          renameClientConversation({
            conversation_id: updatedConvId,
            auto_generate: true,
            department: activeAgent.code || user?.department,
            user_email: user?.email,
            emp_id: currentEmpId
          }).then(nameRes => {
            if (nameRes && nameRes.name) {
              setChatHistory(prev => {
                const updatedWithAI = prev.map(s => (s.id === activeSessionId || s.difyConversationId === updatedConvId) ? { ...s, title: nameRes.name } : s)
                localStorage.setItem(`app_chat_history_${currentEmpId}`, JSON.stringify(updatedWithAI))
                return updatedWithAI
              })
            }
          }).catch(e => console.error('Dify auto rename error:', e))
        }
      }

      const finalCompletedThoughts = latestThoughts.map(t => ({ ...t, status: 'completed' as const }))
      const finalMessages: Message[] = [
        ...newMessages,
        {
          role: 'assistant',
          content: resText,
          thoughts: finalCompletedThoughts.length > 0 ? finalCompletedThoughts : undefined,
          isStreaming: false
        }
      ]
      setMessages(finalMessages)

      const updatedHistory = currentSessions.map(s => {
        if (s.id === activeSessionId) {
          const isDefaultTitle = s.title === 'Đoạn trò chuyện mới' || !s.messages || s.messages.length === 0
          return {
            ...s,
            title: isDefaultTitle ? promptToSend.slice(0, 30) : s.title,
            messages: finalMessages,
            difyConversationId: updatedConvId
          }
        }
        return s
      })
      saveHistoryToStorage(updatedHistory)
    } catch (err: any) {
      console.warn('[Workspace handleSendChat error]:', err)
      const isRateLimit = isRateLimitError(err?.message) || String(err?.message).includes('429')
      const displayMsg = isRateLimit
        ? STANDARD_RATE_LIMIT_MSG
        : (err?.message || 'Hệ thống AI hiện đang xử lý quá nhiều yêu cầu. Xin anh/chị vui lòng thử lại sau.')

      const finalErrorThoughts = latestThoughts.map(t =>
        t.status === 'running' ? { ...t, status: 'error' as const } : t
      )

      if (isRateLimit && !finalErrorThoughts.some(t => t.id === 'rate_limit_step')) {
        finalErrorThoughts.push({
          id: 'rate_limit_step',
          title: '⚠️ Hệ thống AI hiện đang xử lý quá nhiều yêu cầu',
          status: 'error',
          timestamp: Date.now(),
          detail: 'Định ngạch kết nối AI tạm thời bị giới hạn. Vui lòng thử lại sau giây lát.'
        })
      }

      const errMessages: Message[] = [
        ...newMessages,
        {
          role: 'assistant',
          content: displayMsg,
          thoughts: finalErrorThoughts.length > 0 ? finalErrorThoughts : undefined,
          isStreaming: false,
          isError: true,
          isRateLimit
        }
      ]
      setMessages(errMessages)
    } finally {
      setIsLoading(false)
    }
  }

  const handleTriggerPrompt = (promptText: string) => {
    handleSendChat(promptText)
  }

  const activeHistory = chatHistory.filter(s => !s.isArchived)
  const pinnedHistory = activeHistory.filter(s => s.isPinned)
  const unpinnedHistory = activeHistory.filter(s => !s.isPinned)
  const visibleUnpinned = showAllUnpinned ? unpinnedHistory : unpinnedHistory.slice(0, 5)
  const archivedHistory = chatHistory.filter(s => s.isArchived)

  const isHashtagSearch = qaSearch.trim().startsWith('#')
  const suggestedTags = useMemo(() => {
    if (!isHashtagSearch) return []
    const queryTagNorm = removeAccents(qaSearch.trim().replace('#', ''))
    if (!queryTagNorm) return ALL_TAGS
    return ALL_TAGS.filter(tag => removeAccents(tag.replace('#', '')).includes(queryTagNorm))
  }, [qaSearch, isHashtagSearch])

  const displaySuggestedTags = suggestedTags.slice(0, 8)
  const extraSuggestedTagsCount = Math.max(0, suggestedTags.length - 8)

  const handleSelectTagSuggestion = (tag: string) => {
    const rawQuery = qaSearch.trim()
    const lastHashIdx = rawQuery.lastIndexOf('#')
    let prefix = ''
    if (lastHashIdx !== -1) {
      prefix = rawQuery.substring(0, lastHashIdx)
    }
    const updated = `${prefix}${tag} `.replace(/\s+/g, ' ')
    setQaSearch(updated)
  }

  const filteredQA = SAMPLE_QA_DATA.filter(item => {
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory
    const rawQuery = qaSearch.trim()
    if (!rawQuery) return matchesCategory

    const itemTagNorm = removeAccents(item.tag)
    const itemTagNoHashNorm = removeAccents(item.tag.replace('#', ''))
    const itemQuestionNorm = removeAccents(item.question)
    const itemAnswerNorm = removeAccents(item.answer)
    const itemCatNorm = removeAccents(item.categoryLabel)

    const tokens = rawQuery.split(/\s+/).filter(Boolean)

    const allTokensMatch = tokens.every(token => {
      const isTagToken = token.startsWith('#')
      const tokenNorm = removeAccents(token)
      const tokenNoHashNorm = removeAccents(token.replace('#', ''))

      if (isTagToken) {
        return itemTagNorm.includes(tokenNorm) || itemTagNoHashNorm.includes(tokenNoHashNorm)
      } else {
        return (
          itemQuestionNorm.includes(tokenNorm) ||
          itemAnswerNorm.includes(tokenNorm) ||
          itemTagNorm.includes(tokenNorm) ||
          itemTagNoHashNorm.includes(tokenNoHashNorm) ||
          itemCatNorm.includes(tokenNorm)
        )
      }
    })

    return matchesCategory && allTokensMatch
  })

  return (
    <div className="flex h-full w-full relative overflow-hidden">
      {/* Sidebar Lịch sử Chat (Thu hẹp từ w-72 xuống w-52) */}
      {activeTab === 'tro-chuyen' && (
        <div className={`${isHistoryCollapsed ? 'w-14' : 'w-52'} transition-all duration-300 border-r border-border bg-card/40 hidden md:flex flex-col h-full z-20 backdrop-blur-xs relative flex-shrink-0`}>
          <div className="p-2.5 border-b border-border flex flex-col gap-2">
            {!isHistoryCollapsed ? (
              <div className="flex items-center gap-1.5">
                <Button
                  onClick={startNewChat}
                  className="flex-1 bg-primary hover:bg-primary/90 text-primary-foreground justify-start font-semibold rounded-xl h-9 text-[11.5px] cursor-pointer truncate px-2.5"
                >
                  <Plus className="w-3.5 h-3.5 mr-1 flex-shrink-0" /> <span className="truncate">Trò chuyện mới</span>
                </Button>

                <button
                  onClick={() => setIsHistoryCollapsed(true)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer flex-shrink-0"
                  title="Thu gọn Lịch sử"
                >
                  <PanelLeftClose className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                <button
                  onClick={() => setIsHistoryCollapsed(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
                  title="Mở rộng Lịch sử"
                >
                  <PanelLeftOpen className="w-4 h-4" />
                </button>

                <button
                  onClick={startNewChat}
                  className="w-9 h-9 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Tạo trò chuyện mới"
                >
                  <Plus className="w-4.5 h-4.5" />
                </button>
              </div>
            )}
          </div>

          {!isHistoryCollapsed ? (
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-3">
                {pinnedHistory.length > 0 && (
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 px-1 text-[9.5px] font-bold text-primary uppercase tracking-wider mb-1">
                      <Pin className="w-2.5 h-2.5 fill-primary rotate-45" />
                      <span>Đã ghim ({pinnedHistory.length}/5)</span>
                    </div>
                    {pinnedHistory.map(session => (
                      <ChatItemItem
                        key={session.id}
                        session={session}
                        isActive={currentConversationId === session.id}
                        onSelect={() => loadChatSession(session)}
                        onTogglePin={(e) => togglePin(session.id, e)}
                        onToggleArchive={(e) => toggleArchive(session.id, e)}
                      />
                    ))}
                  </div>
                )}

                <div className="space-y-1">
                  {pinnedHistory.length > 0 && unpinnedHistory.length > 0 && (
                    <div className="px-1 text-[9.5px] font-bold text-muted-foreground uppercase tracking-wider mb-1 pt-1 border-t border-border/50">
                      Gần đây
                    </div>
                  )}

                  {unpinnedHistory.length === 0 && pinnedHistory.length === 0 ? (
                    <div className="text-muted-foreground text-xs text-center py-6">
                      Chưa có lịch sử
                    </div>
                  ) : (
                    visibleUnpinned.map(session => (
                      <ChatItemItem
                        key={session.id}
                        session={session}
                        isActive={currentConversationId === session.id}
                        onSelect={() => loadChatSession(session)}
                        onTogglePin={(e) => togglePin(session.id, e)}
                        onToggleArchive={(e) => toggleArchive(session.id, e)}
                      />
                    ))
                  )}

                  {unpinnedHistory.length > 5 && (
                    <button
                      onClick={() => setShowAllUnpinned(!showAllUnpinned)}
                      className="w-full py-1.5 px-2 text-[11px] text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-xl transition-colors flex items-center justify-between cursor-pointer font-medium mt-1"
                    >
                      <span>{showAllUnpinned ? 'Thu gọn' : `Xem thêm (${unpinnedHistory.length - 5})`}</span>
                      {showAllUnpinned ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </button>
                  )}
                </div>
              </div>
            </ScrollArea>
          ) : (
            <div className="flex-1 p-2 space-y-2 overflow-y-auto flex flex-col items-center">
              {chatHistory.filter(s => !s.isArchived).map(session => (
                <button
                  key={session.id}
                  onClick={() => loadChatSession(session)}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${currentConversationId === session.id
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                    }`}
                  title={session.title}
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  {session.isPinned && (
                    <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-primary border-2 border-background" />
                  )}
                </button>
              ))}
            </div>
          )}

          <div className="p-2 border-t border-border mt-auto">
            <button
              onClick={() => setShowArchiveModal(true)}
              className={`w-full flex items-center ${isHistoryCollapsed ? 'justify-center p-1.5' : 'justify-between px-2.5 py-1.5'} rounded-xl bg-muted/40 hover:bg-muted border border-border/50 text-[11.5px] font-medium text-muted-foreground hover:text-foreground transition-colors cursor-pointer`}
              title="Đoạn chat đã lưu trữ"
            >
              <div className="flex items-center gap-1.5">
                <Archive className="w-3.5 h-3.5 text-amber-500" />
                {!isHistoryCollapsed && <span>Đã lưu trữ</span>}
              </div>
              {!isHistoryCollapsed && (
                <span className="px-1.5 py-0.2 rounded-full text-[9.5px] font-bold bg-muted text-foreground">
                  {archivedHistory.length}
                </span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Vùng Workspace Chính cho App "Tài liệu" */}
      <div className="flex-1 flex h-full relative overflow-hidden">
        <div className="flex-1 flex flex-col h-full relative overflow-hidden">
          {/* Header Tabs (2 Miniapps: Trò chuyện | Tra cứu) & Level Switcher + Agent Dropdown */}
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-3 py-2 bg-card/60 backdrop-blur-md sticky top-0 z-30">

            {/* Left: Tab chuyển Miniapp (Trò chuyện | Tra cứu) */}
            <Tabs value={activeTab} onValueChange={(v: any) => setActiveTab(v)} className="w-[240px] sm:w-[280px]">
              <TabsList className="grid w-full grid-cols-2 bg-muted border border-border h-8">
                <TabsTrigger value="tro-chuyen" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-medium cursor-pointer text-xs">
                  Trò chuyện
                </TabsTrigger>
                <TabsTrigger value="tra-cuu" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground rounded-lg font-medium cursor-pointer text-xs">
                  Tra cứu
                </TabsTrigger>
              </TabsList>
            </Tabs>

            {/* Right Tools: Agent Selector (nếu được phép) & Level Tester */}
            <div className="flex items-center gap-2">

              {/* 👋 LỜI CHÀO NGƯỜI DÙNG */}
              {activeTab === 'tro-chuyen' && (
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-primary/10 text-primary border border-primary/20 shadow-2xs">
                  <Sparkles className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span>
                    Xin chào {user?.name || user?.fullname || (user?.username ? String(user.username).split('@')[0] : 'Bạn')} !
                  </span>
                </div>
              )}

              {/* 🛡️ BỘ TESTER USER LEVEL (L1 -> L5) */}
              <div className="flex items-center gap-0.5 bg-background border border-border p-0.5 rounded-lg shadow-2xs">
                <span className="text-[9px] font-bold text-muted-foreground px-1 hidden sm:inline-flex items-center gap-1">
                  <Shield className="w-2.5 h-2.5 text-primary" />
                  Level:
                </span>
                {([1, 2, 3, 4, 5] as number[]).map((lvl) => {
                  const isActive = userLevel === lvl
                  return (
                    <button
                      key={lvl}
                      type="button"
                      onClick={() => setUserLevel(lvl)}
                      className={`px-1.5 py-0.5 text-[10px] font-bold rounded transition-all cursor-pointer ${isActive
                          ? 'bg-primary text-primary-foreground font-black shadow-xs'
                          : 'text-muted-foreground hover:text-foreground'
                        }`}
                      title={`Chuyển sang User Level ${lvl}`}
                    >
                      L{lvl}
                    </button>
                  )
                })}
              </div>

            </div>

          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'tra-cuu' ? (
              /* MINIAPP: TRA CỨU */
              <motion.div
                key="tra-cuu"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col w-full h-full p-4 sm:p-6 relative overflow-y-auto max-w-5xl mx-auto space-y-5"
              >
                <div className="text-center max-w-2xl mx-auto space-y-1 pt-1">
                  <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
                    Bộ Hỏi - Đáp Thường Gặp
                  </h2>
                </div>

                <div className="space-y-4 max-w-3xl mx-auto w-full">
                  <div className="relative flex items-center">
                    <Search className="w-4.5 h-4.5 absolute left-4 text-muted-foreground pointer-events-none" />
                    <Input
                      value={qaSearch}
                      onChange={(e) => setQaSearch(e.target.value)}
                      placeholder="Nhập để tìm kiếm hoặc gõ # để chọn tag"
                      className="w-full pl-11 pr-10 py-5.5 bg-card border-border text-foreground rounded-2xl focus-visible:ring-primary shadow-lg text-xs sm:text-sm"
                    />
                    {qaSearch && (
                      <button
                        onClick={() => setQaSearch('')}
                        className="absolute right-4 p-1 text-muted-foreground hover:text-foreground bg-muted rounded-full transition-colors cursor-pointer"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}

                    <AnimatePresence>
                      {isHashtagSearch && suggestedTags.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -4 }}
                          className="absolute top-full left-0 right-0 mt-2 bg-card/95 border border-border rounded-2xl p-3 shadow-2xl backdrop-blur-2xl z-30 space-y-2"
                        >
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-muted-foreground uppercase tracking-wider border-b border-border/60 pb-1.5">
                            <Tag className="w-3 h-3 text-primary" />
                            <span>Gợi ý thẻ Hashtag ({suggestedTags.length})</span>
                          </div>

                          <div className="flex flex-wrap gap-1.5">
                            {displaySuggestedTags.map((tag: string) => (
                              <button
                                key={tag}
                                onClick={() => handleSelectTagSuggestion(tag)}
                                className="px-3 py-1.5 rounded-xl text-xs font-bold bg-primary/15 hover:bg-primary/30 text-primary border border-primary/30 transition-all cursor-pointer flex items-center gap-1 font-mono hover:scale-105 active:scale-95"
                              >
                                <Tag className="w-3 h-3" />
                                {tag}
                              </button>
                            ))}
                          </div>

                          {extraSuggestedTagsCount > 0 && (
                            <div className="text-[10px] text-muted-foreground italic pt-1 border-t border-border/40">
                              ... và {extraSuggestedTagsCount} tag khác phù hợp (gõ thêm ký tự để thu hẹp)
                            </div>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex flex-wrap items-center justify-center gap-2">
                    {[
                      { id: 'all', label: 'Tất cả', count: SAMPLE_QA_DATA.length },
                      { id: 'mang', label: 'Mạng', count: SAMPLE_QA_DATA.filter(i => i.category === 'mang').length },
                      { id: 'thiet-bi', label: 'Thiết bị', count: SAMPLE_QA_DATA.filter(i => i.category === 'thiet-bi').length },
                      { id: 'gia-cuoc', label: 'Giá cước', count: SAMPLE_QA_DATA.filter(i => i.category === 'gia-cuoc').length },
                      { id: 'tu-van', label: 'Tư vấn', count: SAMPLE_QA_DATA.filter(i => i.category === 'tu-van').length },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id as any)}
                        className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer border ${selectedCategory === cat.id
                          ? 'bg-primary text-primary-foreground border-primary shadow-sm scale-105'
                          : 'bg-card/60 text-muted-foreground border-border hover:bg-card hover:text-foreground'
                          }`}
                      >
                        {cat.label} <span className="opacity-70 ml-1">({cat.count})</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="max-w-3xl mx-auto w-full space-y-3.5 pb-12">
                  {filteredQA.length === 0 ? (
                    <div className="text-center py-12 p-6 rounded-3xl border border-dashed border-border bg-card/30">
                      <HelpCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2 opacity-50" />
                      <h4 className="text-foreground font-bold text-sm mb-1">Không tìm thấy câu hỏi phù hợp</h4>
                      <p className="text-xs text-muted-foreground">Thử tìm kiếm với từ khóa khác hoặc chọn nhóm chủ đề</p>
                    </div>
                  ) : (
                    filteredQA.map((item) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-4 sm:p-5 rounded-2xl bg-card/80 border border-border hover:border-primary/40 transition-all shadow-sm space-y-2.5 group"
                      >
                        <div className="flex items-center justify-between">
                          <button
                            onClick={() => setQaSearch(`${item.tag} `)}
                            className="px-2 py-0.5 rounded-md text-[10.5px] font-bold bg-primary/15 hover:bg-primary/30 text-primary border border-primary/30 flex items-center gap-1 font-mono transition-colors cursor-pointer"
                            title="Lọc theo tag này"
                          >
                            <Tag className="w-3 h-3" />
                            {item.tag}
                          </button>
                          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider bg-muted px-2 py-0.5 rounded-md border border-border">
                            {item.categoryLabel}
                          </span>
                        </div>

                        <h3 className="font-bold text-sm sm:text-base text-foreground tracking-tight group-hover:text-primary transition-colors">
                          {item.question}
                        </h3>

                        <div className="p-3 rounded-xl bg-background/60 border border-border/80 text-xs text-muted-foreground leading-relaxed">
                          <p>{item.answer}</p>
                        </div>
                      </motion.div>
                    ))
                  )}
                </div>
              </motion.div>
            ) : (
              /* MINIAPP: TRÒ CHUYỆN (CHAT UI) */
              <motion.div
                key="tro-chuyen"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="flex-1 flex flex-col w-full h-full relative"
              >
                <div className="lg:hidden flex items-center gap-2 overflow-x-auto p-2 border-b border-border/60 bg-card/40 flex-shrink-0 custom-scrollbar">
                  <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground uppercase flex-shrink-0">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <span>Chủ đề:</span>
                  </div>
                  {dynamicTopics.map((topic) => {
                    const TopicIcon = topic.icon
                    const isSelected = selectedTopic === topic.id
                    return (
                      <button
                        key={topic.id}
                        onClick={() => handleSelectTopic(topic.id)}
                        className={`px-2.5 py-1 rounded-xl text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer flex items-center gap-1.5 ${isSelected
                          ? 'bg-primary text-primary-foreground border-primary shadow-xs'
                          : 'bg-card text-muted-foreground border-border hover:bg-muted'
                          }`}
                      >
                        <TopicIcon className="w-3 h-3 flex-shrink-0" />
                        <span>{topic.name}</span>
                      </button>
                    )
                  })}
                </div>

                <ScrollArea className="flex-1 p-4 pb-40">
                  <div className="max-w-3xl mx-auto space-y-5 pt-2">
                    {messages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center mt-20 text-center space-y-3">
                        <div className="w-12 h-12 rounded-2xl bg-primary/15 text-primary flex items-center justify-center border border-primary/30 shadow-md">
                          <Sparkles className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="font-bold text-base text-foreground">Trợ Lý AI</h3>
                          <p className="text-xs text-muted-foreground mt-0.5">Hãy hỏi tôi bất kỳ điều gì bạn muốn</p>
                        </div>
                      </div>
                    ) : (
                      messages.map((msg, idx) => (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`px-4 py-3 rounded-2xl max-w-[85%] text-xs sm:text-sm shadow-sm leading-relaxed ${msg.role === 'user'
                            ? 'bg-primary text-primary-foreground font-medium whitespace-pre-wrap'
                            : 'bg-card text-card-foreground border border-border overflow-hidden'
                            }`}>
                            {msg.role === 'user' ? (
                              msg.content
                            ) : (
                              <div>
                                {msg.thoughts && msg.thoughts.length > 0 && (
                                  <ThoughtStreamView
                                    thoughts={msg.thoughts}
                                    isStreaming={msg.isStreaming}
                                  />
                                )}
                                {msg.isRateLimit || isRateLimitError(msg.content) ? (
                                  <div className="rounded-xl border border-amber-500/30 bg-amber-500/10 dark:bg-amber-950/25 p-3.5 text-amber-900 dark:text-amber-200">
                                    <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm text-amber-700 dark:text-amber-400 mb-1.5">
                                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                      <span>Thông Báo Giới Hạn Định Ngạch AI</span>
                                    </div>
                                    <p className="text-xs leading-relaxed opacity-90 mb-3">
                                      {msg.content || STANDARD_RATE_LIMIT_MSG}
                                    </p>
                                    <div className="flex items-center gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        onClick={() => {
                                          const userMsgs = messages.filter(m => m.role === 'user')
                                          const lastUserPrompt = userMsgs[userMsgs.length - 1]?.content
                                          if (lastUserPrompt) handleTriggerPrompt(lastUserPrompt)
                                        }}
                                        className="h-7 text-xs border-amber-500/40 text-amber-800 dark:text-amber-300 hover:bg-amber-500/20"
                                      >
                                        <RefreshCcw className="w-3 h-3 mr-1.5" /> Thử lại yêu cầu
                                      </Button>
                                    </div>
                                  </div>
                                ) : msg.isError ? (
                                  <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-3.5 text-destructive">
                                    <div className="flex items-center gap-2 font-semibold text-xs sm:text-sm mb-1.5">
                                      <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                                      <span>Sự Cố Kết Nối AI</span>
                                    </div>
                                    <p className="text-xs leading-relaxed opacity-90 mb-2">
                                      {msg.content}
                                    </p>
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => {
                                        const userMsgs = messages.filter(m => m.role === 'user')
                                        const lastUserPrompt = userMsgs[userMsgs.length - 1]?.content
                                        if (lastUserPrompt) handleTriggerPrompt(lastUserPrompt)
                                      }}
                                      className="h-7 text-xs border-destructive/40 text-destructive hover:bg-destructive/20"
                                    >
                                      <RefreshCcw className="w-3 h-3 mr-1.5" /> Thử lại
                                    </Button>
                                  </div>
                                ) : (!msg.content && msg.isStreaming) ? (
                                  <div className="flex items-center gap-2 text-xs text-muted-foreground py-1 animate-pulse">
                                    <Sparkles className="w-3.5 h-3.5 text-primary animate-spin flex-shrink-0" />
                                    <span>Đang phân tích dữ liệu & chuẩn bị câu trả lời...</span>
                                  </div>
                                ) : (
                                  <ReactMarkdown
                                    remarkPlugins={[remarkGfm]}
                                    components={{
                                      p: ({ children }) => <p className="mb-2 last:mb-0 leading-relaxed">{children}</p>,
                                      strong: ({ children }) => <strong className="font-extrabold text-foreground">{children}</strong>,
                                      em: ({ children }) => <em className="italic text-primary font-medium">{children}</em>,
                                      ul: ({ children }) => <ul className="list-disc list-inside my-1.5 space-y-1 pl-1 text-foreground/90">{children}</ul>,
                                      ol: ({ children }) => <ol className="list-decimal list-inside my-1.5 space-y-1 pl-1 text-foreground/90">{children}</ol>,
                                      li: ({ children }) => <li className="leading-relaxed">{children}</li>,
                                      code: ({ children }) => (
                                        <code className="px-1.5 py-0.5 rounded-md bg-muted text-primary font-mono text-xs border border-border">
                                          {children}
                                        </code>
                                      ),
                                      pre: ({ children }) => (
                                        <pre className="p-3 rounded-xl bg-background border border-border overflow-x-auto text-xs font-mono my-2 text-foreground shadow-inner">
                                          {children}
                                        </pre>
                                      ),
                                      blockquote: ({ children }) => (
                                        <blockquote className="border-l-4 border-primary pl-3 italic my-2 text-muted-foreground bg-primary/5 py-1 rounded-r-lg">
                                          {children}
                                        </blockquote>
                                      ),
                                      table: ({ children }) => (
                                        <div className="overflow-x-auto my-2.5 rounded-xl border border-border">
                                          <table className="w-full text-xs text-left border-collapse">{children}</table>
                                        </div>
                                      ),
                                      th: ({ children }) => <th className="bg-muted px-2.5 py-1.5 font-bold border-b border-border text-foreground">{children}</th>,
                                      td: ({ children }) => <td className="px-2.5 py-1.5 border-b border-border/60 text-muted-foreground">{children}</td>,
                                      a: ({ href, children }) => (
                                        <a href={href} target="_blank" rel="noopener noreferrer" className="text-primary font-semibold underline hover:opacity-80">
                                          {children}
                                        </a>
                                      )
                                    }}
                                  >
                                    {sanitizeMarkdownContent(msg.content)}
                                  </ReactMarkdown>
                                )}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      ))
                    )}

                    {isLoading && (
                      <div className="flex justify-start">
                        <div className="px-4 py-3 rounded-2xl bg-card text-muted-foreground border border-border text-xs animate-pulse flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-primary animate-spin" />
                          <span>Đang tổng hợp thông tin chủ đề &quot;{dynamicTopics.find(t => t.id === selectedTopic)?.name || selectedTopic}&quot;...</span>
                        </div>
                      </div>
                    )}
                  </div>
                </ScrollArea>

                <div className="absolute bottom-0 w-full p-3 sm:p-4 bg-gradient-to-t from-background via-background/95 to-transparent z-10">
                  <div className="max-w-3xl mx-auto w-full mb-2.5 px-0.5">
                    <div className="flex items-center gap-1.5 text-[10.5px] font-bold text-muted-foreground mb-1 uppercase tracking-wider">
                      <Flame className="w-3.5 h-3.5 text-amber-500 animate-bounce" />
                      <span>Mọi người hỏi gì?</span>
                    </div>
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1">
                      {dynamicTrendingPrompts.map((promptText, pIdx) => (
                        <button
                          key={pIdx}
                          onClick={() => handleTriggerPrompt(promptText)}
                          className="px-2.5 py-1 rounded-xl text-xs font-semibold bg-card hover:bg-primary/20 text-muted-foreground hover:text-primary border border-border hover:border-primary/40 transition-all whitespace-nowrap cursor-pointer shadow-xs flex-shrink-0"
                        >
                          {promptText}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Thanh thông báo trạng thái Ghi âm giọng nói */}
                  <AnimatePresence>
                    {isListening && (
                      <motion.div
                        initial={{ opacity: 0, y: 6, scale: 0.98 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.98 }}
                        className="flex items-center justify-between px-3 py-1.5 mb-2 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-medium max-w-3xl mx-auto backdrop-blur-xs shadow-lg"
                      >
                        <div className="flex items-center gap-2">
                          <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500"></span>
                          </span>
                          <span className="font-semibold text-foreground text-[11.5px]">
                            Đang lắng nghe giọng nói (Tiếng Việt)... Hãy nói điều bạn cần.
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={stopListening}
                          className="text-[11px] font-bold underline hover:text-rose-300 transition-colors cursor-pointer ml-2 text-rose-400"
                        >
                          Xong / Dừng
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Thông báo lỗi micro nếu có */}
                  {speechError && (
                    <div className="max-w-3xl mx-auto mb-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-xl text-[11px] text-amber-400 flex items-center justify-between">
                      <span>{speechError}</span>
                    </div>
                  )}

                  <div className="max-w-3xl mx-auto relative flex items-center">
                    <Input
                      value={input}
                      maxLength={500}
                      onChange={(e) => setInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                      placeholder={
                        isListening
                          ? '🎙️ Đang nghe giọng nói của bạn... Hãy nói điều bạn muốn hỏi'
                          : `Bạn cần trò chuyện về ${selectedTopic}... (Tối đa 500 ký tự)`
                      }
                      className={`w-full pl-4 pr-32 py-5 sm:py-6 bg-card border-border text-foreground rounded-2xl focus-visible:ring-primary shadow-xl text-xs sm:text-sm transition-all ${isListening ? 'border-rose-500/60 ring-2 ring-rose-500/20 bg-rose-500/5' : ''
                        }`}
                    />

                    <div className="absolute right-2.5 flex items-center gap-1.5">
                      {input.length > 350 && (
                        <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded-md ${input.length >= 480 ? 'bg-destructive/20 text-destructive font-bold' : 'text-muted-foreground'}`}>
                          {input.length}/500
                        </span>
                      )}
                      {/* Nút Micro Voice-to-Text */}
                      <button
                        type="button"
                        onClick={() => toggleListening(input)}
                        className={`h-8 w-8 rounded-xl flex items-center justify-center transition-all cursor-pointer relative ${isListening
                            ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30 scale-105 animate-pulse'
                            : 'text-muted-foreground hover:text-foreground hover:bg-muted/80 bg-muted/40'
                          }`}
                        title={
                          !isSpeechSupported
                            ? 'Trình duyệt không hỗ trợ Web Speech API'
                            : isListening
                              ? 'Đang nhận diện giọng nói... Bấm để dừng'
                              : 'Nói để nhập văn bản (Voice-to-Text)'
                        }
                      >
                        {isListening ? (
                          <>
                            <span className="absolute -top-1 -right-1 flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
                            </span>
                            <Mic className="w-4 h-4 text-white animate-bounce" />
                          </>
                        ) : (
                          <Mic className="w-4 h-4" />
                        )}
                      </button>

                      {/* Nút Gửi */}
                      <Button
                        size="icon"
                        onClick={() => handleSendChat()}
                        disabled={!input.trim() || isLoading}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl h-8 w-8 transition-colors cursor-pointer disabled:opacity-50"
                      >
                        <SendHorizontal className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-center text-[10px] sm:text-[11px] text-muted-foreground mt-1.5 font-medium">
                    Hệ thống Enterprise Multi-Agent có thể tạo ra thông tin không chính xác. Hãy xác minh lại các quyết định quan trọng.
                  </p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* RIGHT SIDEBAR: PANEL CHỌN CHỦ ĐỀ NGỮ CẢNH THEO CHATFLOW TỔNG */}
        {activeTab === 'tro-chuyen' && (
          <div className="w-56 border-l border-border bg-card/40 hidden lg:flex flex-col p-3 backdrop-blur-xs z-20 space-y-3 flex-shrink-0">
            <div className="flex items-center justify-between pb-2 border-b border-border">
              <div className="flex items-center gap-1.5 font-bold text-xs sm:text-sm text-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Chủ Đề Ngữ Cảnh</span>
              </div>
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">
                L{userLevel}
              </span>
            </div>

            <div className="space-y-1.5 flex-1 overflow-y-auto custom-scrollbar pr-0.5">
              {dynamicTopics.map((topic) => {
                const isSelected = selectedTopic === topic.id
                const TopicIcon = topic.icon
                return (
                  <button
                    key={topic.id}
                    onClick={() => handleSelectTopic(topic.id)}
                    className={`w-full text-left p-2.5 rounded-xl transition-all cursor-pointer border flex items-start gap-2.5 group relative ${isSelected
                      ? 'bg-primary/15 border-primary text-foreground shadow-sm'
                      : 'bg-card/60 border-border text-muted-foreground hover:bg-card hover:text-foreground'
                      }`}
                  >
                    <div className={`p-1.5 rounded-lg flex-shrink-0 transition-colors ${isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground group-hover:text-foreground'
                      }`}>
                      <TopicIcon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between">
                        <span className={`font-bold text-xs ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                          {topic.name}
                        </span>
                        {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-primary flex-shrink-0" />}
                      </div>
                      <span className="text-[9.5px] text-muted-foreground block truncate mt-0.5">
                        {topic.desc}
                      </span>
                    </div>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>

      {/* MODAL KHUNG ĐOẠN CHAT ĐÃ LƯU TRỮ */}
      <AnimatePresence>
        {showArchiveModal && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 select-none">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs"
              onClick={() => setShowArchiveModal(false)}
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full max-w-md bg-card border border-border rounded-3xl p-5 shadow-2xl z-10 space-y-4"
            >
              <div className="flex items-center justify-between border-b border-border pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20">
                    <Archive className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">Đoạn Chat Đã Lưu Trữ</h3>
                    <p className="text-xs text-muted-foreground">Danh sách các cuộc trò chuyện được cất giữ</p>
                  </div>
                </div>

                <button
                  onClick={() => setShowArchiveModal(false)}
                  className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-xl transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <ScrollArea className="max-h-80 pr-2">
                {archivedHistory.length === 0 ? (
                  <div className="text-center py-10 text-xs text-muted-foreground space-y-2">
                    <Archive className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                    <p>Chưa có đoạn chat nào trong mục lưu trữ</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {archivedHistory.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-3 rounded-2xl bg-muted/40 border border-border/60 hover:bg-muted/80 transition-all text-xs group"
                      >
                        <div
                          onClick={() => {
                            loadChatSession(session)
                            setShowArchiveModal(false)
                          }}
                          className="flex items-center gap-2.5 flex-1 min-w-0 cursor-pointer"
                        >
                          <MessageSquare className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                          <span className="font-semibold text-foreground truncate">{session.title}</span>
                        </div>

                        <button
                          onClick={() => toggleArchive(session.id)}
                          className="p-1.5 text-primary hover:bg-primary/20 rounded-xl transition-colors cursor-pointer flex-shrink-0 ml-2"
                          title="Khôi phục lại đoạn chat"
                        >
                          <ArchiveRestore className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              <div className="pt-2 border-t border-border">
                <Button
                  onClick={() => setShowArchiveModal(false)}
                  className="w-full bg-muted hover:bg-muted/80 text-foreground font-semibold rounded-xl h-10 text-xs cursor-pointer"
                >
                  Đóng
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
