import { sql } from "@/lib/neon"
import { crypto } from "crypto"

// Base service class for common database operations
class BaseNeonService {
  protected tableName: string
  public __serviceName: string

  constructor(tableName: string, serviceName: string) {
    this.tableName = tableName
    this.__serviceName = serviceName
  }

  async getAll() {
    if (!sql) return []
    try {
      const result = await sql`SELECT * FROM ${sql(this.tableName)} ORDER BY created_at DESC`
      return result
    } catch {
      return []
    }
  }

  async getById(id: string) {
    if (!sql) return null
    try {
      const result = await sql`SELECT * FROM ${sql(this.tableName)} WHERE id = ${id}`
      return result[0] || null
    } catch {
      return null
    }
  }

  async create(data: any) {
    if (!sql) return null
    try {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const placeholders = keys.map((_, i) => `$${i + 1}`).join(", ")
      const columns = keys.join(", ")

      const query = `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders}) RETURNING *`
      const result = await sql(query, values)
      return result[0]
    } catch {
      return null
    }
  }

  async update(id: string, data: any) {
    if (!sql) return null
    try {
      const keys = Object.keys(data)
      const values = Object.values(data)
      const setClause = keys.map((key, i) => `${key} = $${i + 2}`).join(", ")

      const query = `UPDATE ${this.tableName} SET ${setClause} WHERE id = $1 RETURNING *`
      const result = await sql(query, [id, ...values])
      return result[0]
    } catch {
      return null
    }
  }

  async delete(id: string) {
    if (!sql) return null
    try {
      const result = await sql`DELETE FROM ${sql(this.tableName)} WHERE id = ${id} RETURNING *`
      return result[0]
    } catch {
      return null
    }
  }
}

// Event Service
class EventService extends BaseNeonService {
  constructor() {
    super("events", "eventService")
  }

  async getByDj(djId: string) {
    if (!sql) return []
    try {
      const result = await sql`
        SELECT e.*, d.name as dj_name, d.artist_name, p.name as producer_name, p.company_name
        FROM events e
        LEFT JOIN djs d ON e.dj_id = d.id
        LEFT JOIN producers p ON e.producer_id = p.id
        WHERE e.dj_id = ${djId}
        ORDER BY e.event_date DESC
      `
      return result
    } catch {
      return []
    }
  }

  async getByProducer(producerId: string) {
    if (!sql) return []
    try {
      const result = await sql`
        SELECT e.*, d.name as dj_name, d.artist_name
        FROM events e
        LEFT JOIN djs d ON e.dj_id = d.id
        WHERE e.producer_id = ${producerId}
        ORDER BY e.event_date DESC
      `
      return result
    } catch {
      return []
    }
  }

  async getAll() {
    if (!sql) return []
    try {
      const result = await sql`
        SELECT e.*,
               d.name as dj_name,
               d.artist_name,
               p.name as producer_name,
               p.company_name
        FROM events e
        LEFT JOIN djs d ON e.dj_id = d.id
        LEFT JOIN producers p ON e.producer_id = p.id
        ORDER BY e.event_date DESC
      `
      return result
    } catch {
      return []
    }
  }
}

// DJ Service
class DjService extends BaseNeonService {
  constructor() {
    super("djs", "djService")
  }

  async getAll() {
    if (!sql) return []
    try {
      const result = await sql`
        SELECT d.*,
               COUNT(DISTINCT e.id) as event_count
        FROM djs d
        LEFT JOIN events e ON d.id = e.dj_id
        GROUP BY d.id
        ORDER BY d.created_at DESC
      `
      return result
    } catch {
      return []
    }
  }
}

// Producer Service
class ProducerService extends BaseNeonService {
  constructor() {
    super("producers", "producerService")
  }

  async getAll() {
    if (!sql) return []
    try {
      const result = await sql`
        SELECT p.*,
               COUNT(DISTINCT e.id) as event_count
        FROM producers p
        LEFT JOIN events e ON p.id = e.producer_id
        GROUP BY p.id
        ORDER BY p.created_at DESC
      `
      return result
    } catch {
      return []
    }
  }
}

// Payment Service
class PaymentService extends BaseNeonService {
  constructor() {
    super("payments", "paymentService")
  }

  async getAll() {
    const result = await sql`
      SELECT pay.*, 
             e.title as event_title,
             e.event_date,
             p.name as producer_name,
             p.company_name,
             d.name as dj_name
      FROM payments pay
      LEFT JOIN events e ON pay.event_id = e.id
      LEFT JOIN producers p ON e.producer_id = p.id
      LEFT JOIN djs d ON e.dj_id = d.id
      ORDER BY pay.created_at DESC
    `
    return result
  }

  async getPending() {
    const result = await sql`
      SELECT pay.*, 
             e.title as event_title,
             e.event_date,
             p.name as producer_name,
             p.company_name
      FROM payments pay
      LEFT JOIN events e ON pay.event_id = e.id
      LEFT JOIN producers p ON e.producer_id = p.id
      WHERE pay.status = 'pending'
      ORDER BY pay.created_at DESC
    `
    return result
  }
}

// Contract Service
class ContractService extends BaseNeonService {
  constructor() {
    super("contracts", "contractService")
  }

  async getAll() {
    const result = await sql`
      SELECT c.*, 
             e.title as event_title,
             e.event_date,
             e.cache_value,
             d.name as dj_name,
             p.name as producer_name,
             p.company_name
      FROM contracts c
      LEFT JOIN events e ON c.event_id = e.id
      LEFT JOIN djs d ON e.dj_id = d.id
      LEFT JOIN producers p ON e.producer_id = p.id
      ORDER BY c.created_at DESC
    `
    return result
  }
}

// Analytics Service
class AnalyticsService {
  public __serviceName = "analyticsService"

  async getDashboardMetrics() {
    const [djCount, eventCount, paymentStats] = await Promise.all([
      sql`SELECT COUNT(*) as count FROM djs`,
      sql`SELECT COUNT(*) as count FROM events`,
      sql`
        SELECT 
          SUM(CASE WHEN status = 'paid' THEN amount ELSE 0 END) as total_paid,
          SUM(CASE WHEN status = 'pending' THEN amount ELSE 0 END) as total_pending
        FROM payments
      `,
    ])

    return {
      totalDJs: djCount[0]?.count || 0,
      totalEvents: eventCount[0]?.count || 0,
      totalPaid: paymentStats[0]?.total_paid || 0,
      totalPending: paymentStats[0]?.total_pending || 0,
      djsChange: "+0%",
      djsChangeType: "neutral",
    }
  }
}

// Notes Service
class NotesService extends BaseNeonService {
  constructor() {
    super("notes", "notesService")
  }

  async listByUser(userId: string) {
    const result = await sql`
      SELECT * FROM notes 
      WHERE user_id = ${userId}
      ORDER BY created_at DESC
    `
    return result
  }

  async getByEvent(eventId: string) {
    const result = await sql`
      SELECT * FROM notes 
      WHERE event_id = ${eventId}
      ORDER BY created_at DESC
    `
    return result
  }

  async create(userId: string, data: { title: string; content: string }) {
    const id = crypto.randomUUID()
    const now = new Date().toISOString()

    const result = await sql`
      INSERT INTO notes (id, user_id, title, content, created_at, updated_at)
      VALUES (${id}, ${userId}, ${data.title}, ${data.content}, ${now}, ${now})
      RETURNING *
    `
    return result[0]
  }

  async update(id: string, data: { title?: string; content?: string }) {
    const now = new Date().toISOString()
    const updates: string[] = []
    const values: any[] = [id]
    let paramIndex = 2

    if (data.title !== undefined) {
      updates.push(`title = $${paramIndex}`)
      values.push(data.title)
      paramIndex++
    }

    if (data.content !== undefined) {
      updates.push(`content = $${paramIndex}`)
      values.push(data.content)
      paramIndex++
    }

    updates.push(`updated_at = $${paramIndex}`)
    values.push(now)

    const query = `UPDATE notes SET ${updates.join(", ")} WHERE id = $1 RETURNING *`
    const result = await sql(query, values)
    return result[0]
  }

  async remove(id: string) {
    return this.delete(id)
  }
}

// Storage Service (for file uploads - simplified version)
class StorageService {
  public __serviceName = "storageService"

  async upload(bucket: string, path: string, file: File) {
    // This would need to be implemented with a file storage solution
    // For now, return a placeholder
    console.warn("Storage service not fully implemented for Neon migration")
    return { path: `/uploads/${path}`, url: `/uploads/${path}` }
  }

  async getPublicUrl(bucket: string, path: string) {
    return `/uploads/${path}`
  }
}

// Export service instances
export const eventService = new EventService()
export const djService = new DjService()
export const producerService = new ProducerService()
export const paymentService = new PaymentService()
export const contractService = new ContractService()
export const analyticsService = new AnalyticsService()
export const notesService = new NotesService()
export const storageService = new StorageService()

// Export wrapper for compatibility
export const djServiceWrapper = djService

// Default export for paymentService compatibility
export default paymentService
