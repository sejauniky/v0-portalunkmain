"use client"

import type { User as AppUser } from "@/types"

export function useAuth() {
  const user: AppUser = {
    id: "default-user",
    username: "Admin",
    role: "admin",
    email: "admin@portal.local",
    createdAt: new Date().toISOString(),
    profile: null,
  }

  return {
    user,
    userProfile: user.profile || null,
    role: user.role || null,
    isAuthenticated: true,
    isLoading: false,
    loading: false,
    profileLoading: false,
    loginPending: false,
    signIn: async () => ({ data: null, error: null }),
    login: async () => ({ data: null, error: null }),
    logout: async () => {},
    refreshProfile: async () => {},
    supabaseReachable: true,
    loginMutation: { isPending: false },
  }
}
