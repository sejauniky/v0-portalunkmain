import type React from "react"
import "./globals.css"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import { SessionProvider } from "@/components/session-provider"
import { ClientLayoutWrapper } from "./client-layout-wrapper"
import { QueryClientProviderWrapper } from "./query-client-provider"

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
    <html lang="pt-BR" className="dark">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Portal UNK" />
      </head>
      <body className={`${inter.className} dark bg-background text-foreground antialiased`}>
        <QueryClientProviderWrapper>
          <SessionProvider>
            <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
          </SessionProvider>
        </QueryClientProviderWrapper>
      </body>
    </html>
  )
}
