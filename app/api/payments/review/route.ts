import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/neon"

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { paymentId, status } = body

    if (!paymentId || !status) {
      return NextResponse.json({ error: "paymentId and status are required" }, { status: 400 })
    }

    const result = await sql`
      UPDATE payments
      SET status = ${status}, reviewed_at = NOW(), updated_at = NOW()
      WHERE id = ${paymentId}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, payment: result[0] })
  } catch (error) {
    console.error("Error reviewing payment:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
