import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"
import crypto from "crypto"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { djId, producerId, expiryDays = 7, password } = body

    if (!djId || !producerId) {
      return NextResponse.json({ error: "djId and producerId are required" }, { status: 400 })
    }

    const shareToken = crypto.randomBytes(32).toString("hex")
    const expiryDate = new Date()
    expiryDate.setDate(expiryDate.getDate() + expiryDays)

    const result = await sql`
      INSERT INTO share_links (dj_id, producer_id, share_token, expires_at, password, created_at)
      VALUES (${djId}, ${producerId}, ${shareToken}, ${expiryDate.toISOString()}, ${password || null}, NOW())
      RETURNING *
    `

    return NextResponse.json({
      success: true,
      shareLink: result[0],
      shareUrl: `${process.env.NEXT_PUBLIC_APP_URL || ""}/share/${shareToken}`,
    })
  } catch (error) {
    console.error("Error creating share link:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
