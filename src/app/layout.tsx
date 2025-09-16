import './globals.css'
import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import { ThemeProvider } from '@/components/providers/ThemeProvider'
import { QueryProvider } from '@/components/providers/QueryProvider'
import { AuthProvider } from '@/components/providers/AuthProvider'
import { AppStateProvider } from '@/components/providers/AppStateProvider'
import { ErrorBoundary } from '@/components/ui/ErrorBoundary'
import { NotificationProvider } from '@/components/ui/NotificationProvider'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Sales Order Management',
  description: 'SaaS application for managing sales orders',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <ErrorBoundary>
          <ThemeProvider>
            <QueryProvider>
              <AuthProvider>
                <AppStateProvider>
                  {children}
                  <NotificationProvider />
                </AppStateProvider>
              </AuthProvider>
            </QueryProvider>
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
