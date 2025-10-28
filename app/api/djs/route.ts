import { type NextRequest, NextResponse } from "next/server"
import { getSql, isNeonConfigured } from "@/lib/neon"

export async function GET() {
  try {
    if (!isNeonConfigured) {
      console.warn("Database not configured. Please connect to Neon.")
      return NextResponse.json({ djs: [], warning: "Database not configured" }, { status: 200 })
    }

    const sql = getSql()

    if (!sql) {
      throw new Error("Failed to initialize database connection")
    }

    const data = await sql`
      SELECT * FROM djs
      ORDER BY artist_name ASC
    `

    return NextResponse.json({ djs: data })
  } catch (error) {
    console.error("Failed to fetch DJs:", error)
    return NextResponse.json({
      error: "Failed to fetch DJs",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!isNeonConfigured) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const payload = await request.json()
    const sql = getSql()

    if (!sql) {
      throw new Error("Failed to initialize database connection")
    }

    // Normalize status
    if (payload.status && typeof payload.status === "string") {
      const statusMap: Record<string, string> = {
        ativo: "ativo",
        inativo: "inativo",
        ocupado: "ocupado",
        active: "ativo",
        inactive: "inativo",
        busy: "ocupado",
      }
      const normalizedStatus = payload.status.toLowerCase()
      payload.status = statusMap[normalizedStatus] || "ativo"
    }

    const result = await sql`
      INSERT INTO djs (
        artist_name, real_name, email, genre, base_price,
        instagram_url, youtube_url, tiktok_url, soundcloud_url,
        birth_date, status, is_active
      )
      VALUES (
        ${payload.artist_name}, ${payload.real_name}, ${payload.email},
        ${payload.genre}, ${payload.base_price}, ${payload.instagram_url},
        ${payload.youtube_url}, ${payload.tiktok_url}, ${payload.soundcloud_url},
        ${payload.birth_date}, ${payload.status || "ativo"}, ${payload.is_active !== false}
      )
      RETURNING *
    `

    return NextResponse.json({ dj: result[0] })
  } catch (error) {
    console.error("Failed to create DJ:", error)
    return NextResponse.json({
      error: "Failed to create DJ",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    if (!isNeonConfigured) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const { id, ...payload } = await request.json()

    if (!id) {
      return NextResponse.json({ error: "DJ ID is required" }, { status: 400 })
    }

    const sql = getSql()

    if (!sql) {
      throw new Error("Failed to initialize database connection")
    }

    // Normalize status
    if (payload.status && typeof payload.status === "string") {
      const statusMap: Record<string, string> = {
        ativo: "ativo",
        inativo: "inativo",
        ocupado: "ocupado",
        active: "ativo",
        inactive: "inativo",
        busy: "ocupado",
      }
      const normalizedStatus = payload.status.toLowerCase()
      payload.status = statusMap[normalizedStatus] || "ativo"
    }

    const result = await sql`
      UPDATE djs
      SET
        artist_name = ${payload.artist_name},
        real_name = ${payload.real_name},
        email = ${payload.email},
        genre = ${payload.genre},
        base_price = ${payload.base_price},
        instagram_url = ${payload.instagram_url},
        youtube_url = ${payload.youtube_url},
        tiktok_url = ${payload.tiktok_url},
        soundcloud_url = ${payload.soundcloud_url},
        birth_date = ${payload.birth_date},
        status = ${payload.status},
        is_active = ${payload.is_active}
      WHERE id = ${id}
      RETURNING *
    `

    if (result.length === 0) {
      return NextResponse.json({ error: "DJ not found" }, { status: 404 })
    }

    return NextResponse.json({ dj: result[0] })
  } catch (error) {
    console.error("Failed to update DJ:", error)
    return NextResponse.json({
      error: "Failed to update DJ",
      details: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 })
  }
}
