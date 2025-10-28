"use client"

import { useSession, signOut as nextAuthSignOut } from "next-auth/react"
import type { User as AppUser } from "@/types"

export function useAuth() {
  const { data: session, status } = useSession()
  const isLoading = status === "loading"
  const isAuthenticated = status === "authenticated"

  // Map NextAuth session to app user format
  const user: AppUser | null = session?.user
    ? {
        id: session.user.id,
        username: session.user.name || session.user.email.split("@")[0],
        role: session.user.role,
        email: session.user.email,
        createdAt: session.user.createdAt,
        profile: session.user.profile,
      }
    : null

  const role = user?.role || null

  return {
    user,
    userProfile: user?.profile || null,
    role,
    isAuthenticated,
    isLoading,
    loading: isLoading,
    profileLoading: isLoading,
    loginPending: false,
    signIn: async () => ({ data: null, error: null }),
    login: async () => ({ data: null, error: null }),
    logout: async () => {
      await nextAuthSignOut({ callbackUrl: "/auth/signin" })
    },
    refreshProfile: async () => {},
    supabaseReachable: true,
    loginMutation: { isPending: false },
  }
}
