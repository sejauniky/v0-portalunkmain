import { neon } from "@neondatabase/serverless"

let _sql: ReturnType<typeof neon> | null = null

export const getSql = () => {
  if (typeof window !== "undefined") {
    throw new Error("Database operations can only be performed on the server side")
  }

  if (!_sql) {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error("DATABASE_URL environment variable is not set. Please configure your Neon database connection.")
    }
    _sql = neon(connectionString)
  }
  return _sql
}

// For server-side usage only
export const sql = getSql()

// Helper function to check if Neon is configured
export const isNeonConfigured = Boolean(process.env.DATABASE_URL)

// Export for compatibility
export { sql as neonClient }
