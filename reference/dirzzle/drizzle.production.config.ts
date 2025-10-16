import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './drizzle-db/schema',
  dialect: 'sqlite',
  driver: 'd1-http',
  strict: true
});
