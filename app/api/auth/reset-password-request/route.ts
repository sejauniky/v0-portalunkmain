import { type NextRequest, NextResponse } from "next/server"
import { getSql } from "@/lib/neon"

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: "Email is required" }, { status: 400 })
    }

    const sql = getSql()

    const result = await sql`
      UPDATE profiles 
      SET reset_token = gen_random_uuid()::text,
          reset_token_expires = NOW() + INTERVAL '1 hour'
      WHERE email = ${email}
      RETURNING reset_token
    `

    if (result.length > 0) {
      return NextResponse.json({
        success: true,
        message: "Reset link sent to your email",
      })
    } else {
      return NextResponse.json({ error: "Email not found" }, { status: 404 })
    }
  } catch (error) {
    console.error("Password reset request error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
