"use client"

import type { ReactNode } from "react"
import { AppLayout } from "@/components/layout/app-layout"

interface ClientLayoutWrapperProps {
  children: ReactNode
}

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  return <AppLayout>{children}</AppLayout>
}
