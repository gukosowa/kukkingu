import { integer, pgTable, varchar, jsonb, uniqueIndex, timestamp } from 'drizzle-orm/pg-core';

export const recipes = pgTable('recipes', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  share_token: varchar({ length: 255 }).notNull(),
  name: varchar({ length: 255 }),
  recipes: jsonb().notNull().$type<Record<string, any>>().default({}),
  shoppingLists: jsonb().notNull().$type<Record<string, any>>().default({}),
  dailyPlans: jsonb().notNull().$type<Record<string, any>>().default({}),
  created_at: timestamp({ withTimezone: true, mode: 'date' }),
  updated_at: timestamp({ withTimezone: true, mode: 'date' }),
}, (table) => ({
  shareTokenIdx: uniqueIndex('recipes_share_token_unique').on(table.share_token),
}));
