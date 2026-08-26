'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const lastActiveApp = localStorage.getItem('app_last_active_app') || '/workspace'
    router.replace(lastActiveApp)
  }, [router])

  return null
}
