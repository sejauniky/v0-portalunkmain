import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { SessionProvider } from "@/components/session-provider"
import { ClientLayoutWrapper } from "./client-layout-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Portal UNK",
  description: "Sistema de gerenciamento de eventos",
  generator: "v0.app",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        <SessionProvider>
          <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
        </SessionProvider>
      </body>
    </html>
  )
}
