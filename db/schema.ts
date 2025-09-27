import { integer, pgTable, varchar, jsonb, uniqueIndex } from 'drizzle-orm/pg-core';

export const recipes = pgTable('recipes', {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  share_token: varchar({ length: 255 }).notNull(),
  recipes: jsonb().notNull().$type<Record<string, any>>().default({}),
  shoppingLists: jsonb().notNull().$type<Record<string, any>>().default({}),
  dailyPlans: jsonb().notNull().$type<Record<string, any>>().default({}),
}, (table) => ({
  shareTokenIdx: uniqueIndex('recipes_share_token_unique').on(table.share_token),
}));
