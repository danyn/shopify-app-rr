import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './drizzle-db/schema',
  dialect: 'sqlite',
  strict: true,
  dbCredentials: {
    // Path to the wrangler db in local files -> copy relative path
    url: '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/6f963cf584dcee1884adc5f4b8cbfca606aaadccaa1bb14a5e264efadbae6488.sqlite'
  }
});

