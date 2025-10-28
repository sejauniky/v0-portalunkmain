import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { eventId, djId, producerId } = body

    if (!eventId || !djId || !producerId) {
      return NextResponse.json({ error: "eventId, djId, and producerId are required" }, { status: 400 })
    }

    const result = await sql`
      INSERT INTO contract_instances (event_id, dj_id, producer_id, signature_status, created_at)
      VALUES (${eventId}, ${djId}, ${producerId}, 'pending', NOW())
      RETURNING *
    `

    return NextResponse.json({ success: true, contract: result[0] })
  } catch (error) {
    console.error("Error creating contracts:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
