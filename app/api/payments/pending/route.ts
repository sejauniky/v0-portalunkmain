import { NextResponse } from "next/server"
import { getSql, isNeonConfigured } from "@/lib/neon"

export async function GET() {
  try {
    if (!isNeonConfigured()) {
      console.warn("Database not configured. Please connect to Neon.")
      return NextResponse.json({ payments: [], warning: "Database not configured" }, { status: 200 })
    }

    const sql = getSql()

    if (!sql) {
      throw new Error("Failed to initialize database connection")
    }

    const data = await sql`
      SELECT *
      FROM events
      WHERE payment_proof IS NOT NULL
      ORDER BY created_at DESC NULLS LAST
    `

    return NextResponse.json({ payments: data })
  } catch (error) {
    console.error("Failed to load pending payments:", error)
    return NextResponse.json({
      error: "Failed to load pending payments",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
