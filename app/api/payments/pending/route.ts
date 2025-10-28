import { NextResponse } from "next/server"
import { getSql } from "@/lib/neon"

export async function GET() {
  try {
    const sql = getSql()

    const data = await sql`
      SELECT id, event_name, event_date, fee, cache_value, payment_proof, payment_status
      FROM events
      WHERE payment_proof IS NOT NULL
        AND payment_status != 'pago'
      ORDER BY created_at DESC
    `

    return NextResponse.json({ payments: data })
  } catch (error) {
    console.error("Failed to load pending payments:", error)
    return NextResponse.json({ error: "Failed to load pending payments" }, { status: 500 })
  }
}
