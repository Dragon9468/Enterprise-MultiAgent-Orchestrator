'use client'

import { useState, useEffect } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { RefreshCcw, Activity, Ticket, X, PlayCircle, Sparkles, CheckCircle2 } from 'lucide-react'
import { pb } from '@/lib/pocketbase'
import { runClientWorkflow } from '@/lib/dify'
import { motion, AnimatePresence } from 'framer-motion'

const ACTIONS = [
  {
    id: 'reset_port',
    title: 'Reset Port',
    description: 'Khởi động lại port thiết bị đầu cuối cáp quang',
    icon: RefreshCcw,
    fieldLabel: 'Địa chỉ MAC',
    placeholder: 'VD: 00:1A:2B:3C:4D:5E'
  },
  {
    id: 'kiem_tra_tin_hieu',
    title: 'Kiểm tra Tín hiệu',
    description: 'Đo kiểm suy hao quang Rx/Tx trên trạm OLT',
    icon: Activity,
    fieldLabel: 'Số Hợp Đồng',
    placeholder: 'VD: SGDC12345'
  },
  {
    id: 'tao_ticket',
    title: 'Tạo Ticket Support',
    description: 'Tạo phiếu yêu cầu hỗ trợ kỹ thuật tận nơi',
    icon: Ticket,
    fieldLabel: 'Mô tả sự cố',
    placeholder: 'Khách hàng báo mất kết nối Internet'
  }
]

export default function ExecutePage() {
  const [user, setUser] = useState<any>(null)
  const [selectedAction, setSelectedAction] = useState<any>(null)
  const [actionInput, setActionInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [resultText, setResultText] = useState<string | null>(null)

  useEffect(() => {
    setUser(pb.authStore.model)
  }, [])

  const handleExecuteAction = async () => {
    if (!selectedAction || !actionInput.trim()) return
    setIsLoading(true)
    setResultText(null)

    let paramKey = 'parameter'
    if (selectedAction.id === 'reset_port') paramKey = 'mac_address'
    if (selectedAction.id === 'kiem_tra_tin_hieu') paramKey = 'contract_id'
    if (selectedAction.id === 'tao_ticket') paramKey = 'issue'

    try {
      const resData = await runClientWorkflow({
        inputs: {
          action_type: selectedAction.id,
          [paramKey]: actionInput
        },
        department: user?.department,
        user_email: user?.email
      })

      const outputs = resData.data?.outputs || resData.outputs || {}
      const res = outputs.result || outputs.text || JSON.stringify(outputs, null, 2)
      setResultText(res)
    } catch (error: any) {
      setResultText(`❌ Lỗi Thực thi: ${error.message}`)
    } finally {
      setIsLoading(false)
    }
  }

  const closeModal = () => {
    setSelectedAction(null)
    setActionInput('')
    setResultText(null)
  }

  return (
    <div className="flex-1 flex flex-col w-full h-full p-4 sm:p-8 relative overflow-y-auto max-w-6xl mx-auto space-y-8 select-none">
      {/* Header Banner */}
      <div className="text-center max-w-2xl mx-auto space-y-2 pt-2">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/15 text-primary border border-primary/30">
          <PlayCircle className="w-3.5 h-3.5" /> Ứng Dụng Chính: Thực Thi Lệnh
        </div>
        <h2 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
          Trung Tâm Tác Vụ & Workflow
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground">
          Thực thi trực tiếp các tác vụ hạ tầng kỹ thuật và tự động hóa qua hệ thống Workflow
        </p>
      </div>

      {/* Grid Danh Sách Tác Vụ */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full pt-2">
        {ACTIONS.map(action => (
          <motion.div
            key={action.id}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setSelectedAction(action)}
            className="bg-card/80 border border-border hover:border-primary/50 p-6 rounded-3xl cursor-pointer transition-all shadow-md group space-y-4 backdrop-blur-md"
          >
            <div className="bg-primary/15 text-primary w-14 h-14 rounded-2xl flex items-center justify-center border border-primary/30 group-hover:scale-110 transition-transform">
              <action.icon className="w-7 h-7" />
            </div>
            <div>
              <h3 className="text-foreground font-extrabold text-lg tracking-tight mb-1">{action.title}</h3>
              <p className="text-muted-foreground text-xs leading-relaxed">{action.description}</p>
            </div>
            <div className="pt-2 flex items-center gap-1.5 text-xs font-bold text-primary opacity-90 group-hover:opacity-100">
              <span>Khởi chạy ngay</span>
              <Sparkles className="w-3.5 h-3.5" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* Action Execution Modal */}
      <AnimatePresence>
        {selectedAction && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-background/80 backdrop-blur-md z-40"
              onClick={closeModal}
            />
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ scale: 0.9, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.9, opacity: 0, y: 20 }}
                className="bg-card/95 border border-border p-6 sm:p-8 rounded-3xl w-full max-w-lg pointer-events-auto relative shadow-2xl backdrop-blur-3xl space-y-6"
              >
                <button
                  onClick={closeModal}
                  className="absolute top-4 right-4 p-2 text-muted-foreground hover:text-foreground bg-muted/60 rounded-full transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-4">
                  <div className="bg-primary/20 text-primary w-14 h-14 rounded-2xl flex items-center justify-center border border-primary/30 flex-shrink-0">
                    <selectedAction.icon className="w-7 h-7" />
                  </div>
                  <div>
                    <h3 className="text-xl text-foreground font-black tracking-tight">{selectedAction.title}</h3>
                    <p className="text-xs text-muted-foreground">{selectedAction.description}</p>
                  </div>
                </div>

                {!resultText ? (
                  <div className="space-y-5 pt-2">
                    <div>
                      <label className="text-xs font-bold text-foreground mb-2 block">
                        {selectedAction.fieldLabel} <span className="text-destructive">*</span>
                      </label>
                      <Input
                        autoFocus
                        value={actionInput}
                        onChange={(e) => setActionInput(e.target.value)}
                        placeholder={selectedAction.placeholder}
                        className="bg-background border-border text-foreground h-12 rounded-2xl focus-visible:ring-primary shadow-sm text-sm"
                      />
                    </div>
                    <Button
                      onClick={handleExecuteAction}
                      disabled={!actionInput.trim() || isLoading}
                      className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold h-12 rounded-2xl transition-all cursor-pointer shadow-lg disabled:opacity-50"
                    >
                      {isLoading ? (
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 animate-spin" />
                          <span>Đang gửi lệnh thực thi...</span>
                        </div>
                      ) : (
                        'Xác Nhận Thực Thi'
                      )}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4 pt-2">
                    <div className="p-4 rounded-2xl bg-background border border-border space-y-2">
                      <div className="flex items-center gap-2 text-xs font-bold text-primary">
                        <CheckCircle2 className="w-4 h-4" />
                        <span>Kết quả thực thi Workflow:</span>
                      </div>
                      <pre className="text-xs font-mono text-foreground whitespace-pre-wrap leading-relaxed overflow-x-auto max-h-48">
                        {resultText}
                      </pre>
                    </div>
                    <Button
                      onClick={closeModal}
                      className="w-full bg-muted hover:bg-muted/80 text-foreground font-bold h-11 rounded-xl cursor-pointer"
                    >
                      Đóng
                    </Button>
                  </div>
                )}
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  )
}
