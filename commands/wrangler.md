1. Locally (SQLite backing store)

Wrangler gives you a CLI to execute SQL. To list all tables:

his queries SQLite’s catalog and prints all user + system tables.

🔎 This works because in dev, Wrangler maps your database_name (cf-sf-app-0_auth) to a .sqlite file under .wrangler/state/v3/d1/.

```sh
npx wrangler d1 execute cf-sf-app-0_auth --local \
  --command "SELECT name FROM sqlite_master WHERE type='table';"
```

🔹 2. On the live edge (real Cloudflare D1)

Same idea, but without --local:

```sh
npx wrangler d1 execute cf-sf-app-0_auth \
  --command "SELECT name FROM sqlite_master WHERE type='table';"
```
# DROP 
Local dev database 
```sh
npx wrangler d1 execute cf-sf-app-0_auth --local \
  --command "DROP TABLE IF EXISTS shopify_sessions;"
```

Live / Cloudflare-hosted database
```sh

npx wrangler d1 execute cf-sf-app-0_auth \
  --command "DROP TABLE IF EXISTS shopify_sessions;"
```
