import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/neon"

export async function GET(request: NextRequest) {
  try {
    const userId = request.nextUrl.searchParams.get("userId")

    if (!userId) {
      return NextResponse.json({ error: "User ID is required" }, { status: 400 })
    }

    const sql = getSql()

    const result = await sql`
      SELECT id, full_name, email, phone, avatar_url, role, created_at
      FROM profiles
      WHERE id = ${userId}
      LIMIT 1
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Profile not found" }, { status: 404 })
    }

    return NextResponse.json({ profile: result[0] })
  } catch (error) {
    console.error("Profile fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
