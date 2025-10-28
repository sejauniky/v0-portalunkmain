import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function POST(request: NextRequest) {
  try {
    const { shareId } = await request.json()

    if (!shareId) {
      return NextResponse.json({ error: "shareId is required" }, { status: 400 })
    }

    const result = await sql`
      UPDATE share_links
      SET revoked = true, updated_at = NOW()
      WHERE id = ${shareId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Share link not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, shareLink: result[0] })
  } catch (error) {
    console.error("Error revoking share link:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
