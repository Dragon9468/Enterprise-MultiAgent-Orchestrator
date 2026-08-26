'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { pb } from '@/lib/pocketbase'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Bot } from 'lucide-react'

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setIsLoading(true)

    try {
      // PocketBase SDK tự lưu token vào authStore (memory).
      // Chúng ta KHÔNG lưu token hoặc user data vào localStorage/sessionStorage.
      // Xác thực an toàn với PocketBase Database
      await pb.collection('users').authWithPassword(email, password)

      // Chỉ lưu flag không nhạy cảm: page cuối user đang dùng
      if (typeof window !== 'undefined') {
        localStorage.setItem('app_session_active', 'true')
      }

      const lastApp = localStorage.getItem('app_last_active_app') || '/workspace'
      router.replace(lastApp)
    } catch (err: any) {
      setError(err.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex h-screen w-full items-center justify-center bg-background p-4 select-none">
      <Card className="w-full max-w-md bg-card/80 backdrop-blur-md border-border shadow-2xl rounded-3xl">
        <CardHeader className="space-y-3 pb-6 text-center">
          <div className="mx-auto bg-primary/15 p-3 rounded-2xl w-fit">
            <Bot className="w-8 h-8 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold tracking-tight text-foreground">
            Enterprise AI Orchestrator
          </CardTitle>
          <CardDescription className="text-muted-foreground text-sm">
            Đăng nhập để truy cập không gian làm việc
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Input
                type="email"
                placeholder="Email cá nhân"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11 focus-visible:ring-primary font-medium"
              />
            </div>
            <div className="space-y-2">
              <Input
                type="password"
                placeholder="Mật khẩu"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="bg-background border-border text-foreground placeholder:text-muted-foreground rounded-xl h-11 focus-visible:ring-primary font-medium"
              />
            </div>
            
            {error && (
              <p className="text-sm text-destructive font-medium text-center">{error}</p>
            )}

            <Button 
              type="submit" 
              className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold h-11 rounded-xl cursor-pointer shadow-md active:scale-95 transition-transform"
              disabled={isLoading}
            >
              {isLoading ? 'Đang xác thực...' : 'Đăng nhập'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
