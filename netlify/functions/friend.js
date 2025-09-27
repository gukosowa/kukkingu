import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@netlify/neon'
import { eq } from 'drizzle-orm'
import { recipes } from '../../db/schema.ts'

export default async (request) => {
  try {
    if (request.method !== 'POST') {
      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        headers: { 'content-type': 'application/json' },
        status: 405,
      })
    }

    // Accept payload as:
    // - raw string token
    // - { token: string }
    // - { share_token: string }
    let token = null
    const text = await request.text()
    if (text) {
      try {
        const data = JSON.parse(text)
        if (typeof data === 'string') {
          token = data
        } else if (data && typeof data === 'object') {
          token = data.token || data.share_token || null
        }
      } catch {
        // Not JSON; treat as raw token string
        token = text
      }
    }

    if (!token || typeof token !== 'string') {
      return new Response(JSON.stringify({ error: 'share token required' }), {
        headers: { 'content-type': 'application/json' },
        status: 400,
      })
    }

    const client = neon()
    const db = drizzle({ client })

    const rows = await db.select().from(recipes).where(eq(recipes.share_token, token)).limit(1)
    const row = rows[0]

    if (!row) {
      return new Response(JSON.stringify({ error: 'not found' }), {
        headers: { 'content-type': 'application/json' },
        status: 404,
      })
    }

    const { name = null, created_at = null, updated_at = null } = row

    return new Response(
      JSON.stringify({ name, created_at, updated_at }),
      { headers: { 'content-type': 'application/json' }, status: 200 }
    )
  } catch (e) {
    console.error('friend endpoint error:', e)
    return new Response(
      JSON.stringify({ error: 'Failed', details: String(e?.message || e) }),
      { headers: { 'content-type': 'application/json' }, status: 500 }
    )
  }
}

export const config = {
  path: '/api/friend',
}
