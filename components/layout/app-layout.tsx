"use client"

import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { useAuth } from "@/hooks/use-auth"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, role } = useAuth()

  if (!user) {
    return <>{children}</>
  }

  if (role === "producer") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="w-full safe-area-inset-top safe-area-inset-bottom px-4 sm:px-6 lg:px-8">
            {children}
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto lg:h-screen pt-[106px] sm:pt-[106px] lg:pt-8 pb-4 sm:pb-6 lg:pb-8 px-4 sm:px-6 lg:px-8 transition-all">
        <div className="w-full safe-area-inset-bottom">
          {children}
        </div>
      </main>
    </div>
  )
}
