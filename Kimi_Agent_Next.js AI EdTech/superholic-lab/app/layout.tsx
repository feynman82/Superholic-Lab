import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import '@/styles/globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Superholic Lab - AI-Powered PSLE Revision',
  description: 'Master PSLE with AI-powered personalized learning for Singapore Primary School students',
  keywords: 'PSLE, Singapore, Primary School, Math, English, Science, AI Learning',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
