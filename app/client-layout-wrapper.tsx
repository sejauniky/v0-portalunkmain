"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { useRouter, usePathname } from "next/navigation"
import { useSession } from "next-auth/react"
import { AppLayout } from "@/components/layout/app-layout"

interface ClientLayoutWrapperProps {
  children: ReactNode
}

export function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated"

  useEffect(() => {
    if (isLoading) return

    // Allow share routes without authentication
    if (pathname.startsWith("/share/")) {
      return
    }

    // Redirect to sign-in if not authenticated
    if (!isAuthenticated && !pathname.startsWith("/auth/")) {
      router.push("/auth/signin")
      return
    }

    // Redirect authenticated users away from sign-in
    if (isAuthenticated && pathname.startsWith("/auth/signin")) {
      router.push("/")
      return
    }
  }, [isAuthenticated, isLoading, pathname, router])

  // Show loading state while NextAuth initializes
  if (isLoading) {
    return null
  }

  // Public routes (share links)
  if (pathname.startsWith("/share/")) {
    return <>{children}</>
  }

  // Auth pages
  if (pathname.startsWith("/auth/")) {
    return <>{children}</>
  }

  // Protected routes - wrap with AppLayout
  if (!isAuthenticated) {
    return null
  }

  return <AppLayout>{children}</AppLayout>
}
