import type { NextAuthOptions } from "next-auth"
import GoogleProvider from "next-auth/providers/google"
import GitHubProvider from "next-auth/providers/github"
import { neon } from "@neondatabase/serverless"

const sql = neon(process.env.DATABASE_URL!)

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    GitHubProvider({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      if (!user.email) return false

      try {
        // Check if user exists
        const existingUser = await sql`
          SELECT id, role FROM users WHERE email = ${user.email}
        `

        if (existingUser.length === 0) {
          // Create new user
          const newUser = await sql`
            INSERT INTO users (email, name, image, role, email_verified)
            VALUES (${user.email}, ${user.name}, ${user.image}, 'producer', NOW())
            RETURNING id, role
          `
          user.id = newUser[0].id

          // Create user profile
          await sql`
            INSERT INTO user_profiles (user_id, name, avatar)
            VALUES (${newUser[0].id}, ${user.name || ""}, ${user.image})
          `
        } else {
          user.id = existingUser[0].id
        }

        // Store account info
        if (account) {
          await sql`
            INSERT INTO accounts (
              user_id, type, provider, provider_account_id,
              access_token, refresh_token, expires_at, token_type, scope, id_token
            )
            VALUES (
              ${user.id}, ${account.type}, ${account.provider}, ${account.providerAccountId},
              ${account.access_token}, ${account.refresh_token}, ${account.expires_at},
              ${account.token_type}, ${account.scope}, ${account.id_token}
            )
            ON CONFLICT (provider, provider_account_id) 
            DO UPDATE SET
              access_token = EXCLUDED.access_token,
              refresh_token = EXCLUDED.refresh_token,
              expires_at = EXCLUDED.expires_at
          `
        }

        return true
      } catch (error) {
        console.error("[v0] Error in signIn callback:", error)
        return false
      }
    },
    async session({ session, token }) {
      if (session.user && token.sub) {
        try {
          const user = await sql`
            SELECT u.id, u.email, u.name, u.image, u.role, u.created_at,
                   p.id as profile_id, p.name as profile_name, p.phone, p.avatar
            FROM users u
            LEFT JOIN user_profiles p ON u.id = p.user_id
            WHERE u.id = ${token.sub}
          `

          if (user.length > 0) {
            session.user.id = user[0].id
            session.user.email = user[0].email
            session.user.name = user[0].name
            session.user.image = user[0].image
            session.user.role = user[0].role
            session.user.createdAt = user[0].created_at
            session.user.profile = user[0].profile_id
              ? {
                  id: user[0].profile_id,
                  userId: user[0].id,
                  name: user[0].profile_name,
                  phone: user[0].phone,
                  avatar: user[0].avatar,
                }
              : undefined
          }
        } catch (error) {
          console.error("[v0] Error in session callback:", error)
        }
      }
      return session
    },
    async jwt({ token, user, account }) {
      if (user) {
        token.sub = user.id
      }
      return token
    },
  },
  pages: {
    signIn: "/auth/signin",
    error: "/auth/error",
  },
  session: {
    strategy: "jwt",
  },
}
