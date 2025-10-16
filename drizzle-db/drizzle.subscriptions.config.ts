import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  out: './drizzle-db/migrations/subscriptions',
  schema: './drizzle-db/schema/subscriptions.ts',
  dialect: 'sqlite',
  strict: true
});