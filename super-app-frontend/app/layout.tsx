import type { Metadata, Viewport } from 'next'
import { Inter, Charm } from 'next/font/google'
import './globals.css'
import Sidebar from '@/components/layouts/sidebar'
import AuthGuard from '@/components/layouts/auth-guard'
import VersionGuard from '@/components/layouts/version-guard'
import { ThemeProvider } from '@/components/ui/theme-provider'

import { THEMES } from '@/lib/themes'

const inter = Inter({ subsets: ['latin'] })
const charm = Charm({ 
  weight: ['400', '700'], 
  subsets: ['vietnamese', 'latin'],
  variable: '--font-xianxia'
})

const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

export const metadata: Metadata = {
  metadataBase: new URL(appUrl),
  title: 'Enterprise Multi-Agent Platform',
  description: 'Production-grade Multi-Agent System & Monitoring Dashboard',
  openGraph: {
    title: 'Enterprise Multi-Agent Platform',
    description: 'Production-grade Multi-Agent System & Monitoring Dashboard',
    url: appUrl,
    siteName: 'Enterprise Multi-Agent Platform',
    locale: 'vi_VN',
    type: 'website',
  },
  alternates: {
    canonical: appUrl,
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="vi" suppressHydrationWarning>
      <head>
        <meta httpEquiv="Content-Security-Policy" content="upgrade-insecure-requests" />
      </head>
      <body className={`${inter.className} ${charm.variable} bg-background text-foreground flex flex-col md:flex-row h-[100dvh] w-full overflow-hidden safe-area-padding`}>
        <VersionGuard>
          <ThemeProvider
            attribute="data-theme"
            defaultTheme="classic-paperback"
            enableSystem={false}
            themes={THEMES.map(t => t.id)}
          >
            <AuthGuard>
              {/* Sidebar & Mobile Navbar */}
              <Sidebar />
              
              {/* Khung nội dung chính với viền mỏng */}
              <main className="flex-1 flex flex-col h-full border-t md:border-t-0 md:border-l border-border bg-background/50 backdrop-blur-xs overflow-hidden relative">
                {children}
              </main>
            </AuthGuard>
          </ThemeProvider>
        </VersionGuard>
      </body>
    </html>
  )
}
