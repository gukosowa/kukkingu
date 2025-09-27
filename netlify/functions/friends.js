import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@netlify/neon'
import { inArray } from 'drizzle-orm'
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
    // - [token, token2]
    // - { tokens: [...] }
    // - { friends: [...] }
    // - raw CSV string 'a,b,c'
    let tokens = []
    const text = await request.text()
    if (text) {
      try {
        const data = JSON.parse(text)
        if (Array.isArray(data)) {
          tokens = data
        } else if (data && typeof data === 'object') {
          if (Array.isArray(data.tokens)) tokens = data.tokens
          else if (Array.isArray(data.friends)) tokens = data.friends
        }
      } catch {
        // Not JSON; try CSV
        tokens = text.split(',')
      }
    }

    // Normalize and de-dup
    tokens = (tokens || [])
      .map(t => (typeof t === 'string' ? t.trim() : ''))
      .filter(t => !!t)
    tokens = Array.from(new Set(tokens))

    if (!tokens.length) {
      return new Response(JSON.stringify({ error: 'tokens required' }), {
        headers: { 'content-type': 'application/json' },
        status: 400,
      })
    }

    const client = neon()
    const db = drizzle({ client })

    const rows = await db
      .select({
        share_token: recipes.share_token,
        name: recipes.name,
        created_at: recipes.created_at,
        updated_at: recipes.updated_at,
      })
      .from(recipes)
      .where(inArray(recipes.share_token, tokens))

    // Build a map for quick lookup
    const map = {}
    for (const row of rows) {
      map[row.share_token] = {
        name: row.name ?? null,
        created_at: row.created_at ?? null,
        updated_at: row.updated_at ?? null,
      }
    }

    return new Response(
      JSON.stringify({ friends: map }),
      { headers: { 'content-type': 'application/json' }, status: 200 }
    )
  } catch (e) {
    console.error('friends endpoint error:', e)
    return new Response(
      JSON.stringify({ error: 'Failed', details: String(e?.message || e) }),
      { headers: { 'content-type': 'application/json' }, status: 500 }
    )
  }
}

export const config = {
  path: '/api/friends',
}
