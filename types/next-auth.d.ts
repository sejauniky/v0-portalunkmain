import "next-auth"
import type { UserProfile } from "./index"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      role: "admin" | "producer"
      createdAt: string
      profile?: UserProfile
    }
  }

  interface User {
    id: string
    email: string
    name?: string | null
    image?: string | null
    role?: "admin" | "producer"
    createdAt?: string
    profile?: UserProfile
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    sub: string
  }
}
