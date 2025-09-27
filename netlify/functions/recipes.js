import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@netlify/neon';
import { asc, eq } from 'drizzle-orm';
import { recipes } from '../../db/schema.ts';

// List recipes rows using Drizzle ORM; seeds a demo row if table is empty.
export default async () => {
  try {
    const client = neon();
    const db = drizzle({ client });

    // Seed a sample row if table is empty (for endpoint testing)
    const existing = await db.select().from(recipes).limit(1);
    if (existing.length === 0) {
      await db.insert(recipes).values({
        share_token: 'demo',
        recipes: {},
        shoppingLists: {},
        dailyPlans: {},
      });
    }

    const rows = await db.select().from(recipes).orderBy(asc(recipes.id));

    return new Response(JSON.stringify({ recipes: rows }), {
      headers: { 'content-type': 'application/json' },
      status: 200,
    });
  } catch (e) {
    console.error('DB function error:', e);
    return new Response(
      JSON.stringify({ error: 'Failed to load recipes', details: String(e?.message || e) }),
      {
        headers: { 'content-type': 'application/json' },
        status: 500,
      }
    );
  }
};

export const config = {
  path: '/api/recipes',
};
