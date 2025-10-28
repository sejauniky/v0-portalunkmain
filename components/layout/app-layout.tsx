"use client"

import type { ReactNode } from "react"
import { Sidebar } from "./sidebar"
import { useUser } from "@clerk/nextjs"
import { Loading } from "@/components/ui/loading"

interface AppLayoutProps {
  children: ReactNode
}

export function AppLayout({ children }: AppLayoutProps) {
  const { user, isLoaded } = useUser()
  const role = (user?.publicMetadata?.role as "admin" | "producer") || "producer"

  if (!isLoaded) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loading message="Carregando aplicação..." />
      </div>
    )
  }

  if (!user) {
    return <>{children}</>
  }

  if (role === "producer") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <main className="flex-1 overflow-y-auto">
          <div className="w-full">{children}</div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex flex-col lg:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto h-screen pt-[106px] sm:pt-[106px] lg:pt-8 pb-8 transition-all">
        <div className="w-full">{children}</div>
      </main>
    </div>
  )
}
