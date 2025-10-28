import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function POST(request: NextRequest) {
  try {
    const { eventId } = await request.json()

    if (!eventId) {
      return NextResponse.json({ error: "eventId is required" }, { status: 400 })
    }

    const result = await sql`
      UPDATE events
      SET payment_status = 'paid', updated_at = NOW()
      WHERE id = ${eventId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, event: result[0] })
  } catch (error) {
    console.error("Error marking event as paid:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
