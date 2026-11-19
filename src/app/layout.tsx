import type { Metadata } from 'next'
import type { ReactNode } from 'react'
import { SiteFooter, SiteHeader } from '@/web/layout/SiteChrome'
import './globals.css'

export const metadata: Metadata = {
  title: 'RAGDivers',
  description: "Answers that know which patch they're from. An unofficial Helldivers 2 companion.",
}

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="flex min-h-dvh flex-col">
        <SiteHeader />
        <main className="flex-1 px-4 py-4">{children}</main>
        <SiteFooter />
      </body>
    </html>
  )
}
