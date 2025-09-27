import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@netlify/neon';
import { asc } from 'drizzle-orm';
import { posts } from '../../db/schema.ts';

// List posts using Drizzle ORM; schema is managed via migrations.
export default async () => {
  try {
    const client = neon();
    const db = drizzle({ client });

    // Seed a sample post if table is empty (keep for endpoint testing)
    const existing = await db.select().from(posts).limit(1);
    if (existing.length === 0) {
      await db.insert(posts).values({ title: 'Hello Netlify DB', content: 'Your database is ready!' });
    }

    const rows = await db.select().from(posts).orderBy(asc(posts.id));

    return new Response(JSON.stringify({ posts: rows }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    console.error('DB function error:', e);
    return new Response(
      JSON.stringify({ error: 'Failed to load posts', details: String(e?.message || e) }),
      {
        headers: { 'content-type': 'application/json' },
        status: 500,
      }
    );
  }
};

export const config = {
  path: '/api/posts',
};
