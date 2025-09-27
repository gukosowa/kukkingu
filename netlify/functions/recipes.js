import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@netlify/neon';
import { asc, eq } from 'drizzle-orm';
import { recipes } from '../../db/schema.ts';

// GET: list; POST: upsert by share_token.
export default async (request) => {
  try {
    const client = neon();
    const db = drizzle({ client });

    const method = request?.method || 'GET';

    if (method === 'POST') {
      const payload = await request.json().catch(() => ({}));
      const { share_token, name = null, recipes: rec = {}, shoppingLists = {}, dailyPlans = {} } = payload || {};
      if (!share_token || typeof share_token !== 'string') {
        return new Response(JSON.stringify({ error: 'share_token required' }), {
          headers: { 'content-type': 'application/json' },
          status: 400,
        });
      }

      // Check if row exists
      const existing = await db.select().from(recipes).where(eq(recipes.share_token, share_token)).limit(1);
      if (existing.length > 0) {
        const updateSet = { recipes: rec, shoppingLists, dailyPlans };
        if (typeof name === 'string' && name.length > 0) {
          updateSet.name = name;
        }
        await db
          .update(recipes)
          .set(updateSet)
          .where(eq(recipes.share_token, share_token));
      } else {
        await db.insert(recipes).values({ share_token, name: (typeof name === 'string' && name.length > 0) ? name : null, recipes: rec, shoppingLists, dailyPlans });
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { 'content-type': 'application/json' },
        status: 200,
      });
    }

    // Seed a sample row if table is empty (for endpoint testing)
    const existing = await db.select().from(recipes).limit(1);
    if (existing.length === 0) {
      await db.insert(recipes).values({
        share_token: 'demo',
        name: 'Demo User',
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
      JSON.stringify({ error: 'Failed', details: String(e?.message || e) }),
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
