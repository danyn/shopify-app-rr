
# Drizzle ORM with Cloudflare D1

## Documentation References

### Schema Management
- [SQL Schema Declaration](https://orm.drizzle.team/docs/sql-schema-declaration)
- [Camel and Snake Casing](https://orm.drizzle.team/docs/sql-schema-declaration#camel-and-snake-casing)

### Migration Management
- [Drizzle Kit Generate](https://orm.drizzle.team/docs/drizzle-kit-generate)
- [Wrangler D1 Migration Commands](https://developers.cloudflare.com/d1/wrangler-commands/#d1-migrations-apply)

## Migration Workflow

### 1. Generate Migrations
```bash
# Generate new migration files
npm run drizzle:generate
```

This command uses `drizzle-kit generate` with our configuration from `drizzle.generate.config.ts`. The migration files will be created in the `drizzle-db/migrations` directory.

### 2. Apply Migrations
For development:
```bash
npm run db:migrate:development
```

For production:
```bash
npm run db:migrate:production
```

### Current approach

1. **DO NOT** use drizzle migrate directly or set up database credentials in drizzle
2. **ALWAYS** use drizzle-kit generate for creating migrations
3. **ALWAYS** use wrangler for applying migrations
4. Migration files are automatically named with a prefix (e.g., `0000_`) for ordering
5. Custom migration names can be specified using the `--name` flag
6. Wrangler applies migrations in order based on their numeric prefix
7. Wrangler maintains a table called `d1_migrations` to track which migrations have been applied
8. When running migrations, Wrangler will only apply migrations that haven't been recorded in the `d1_migrations` table
9. Each migration is run in a transaction - if it fails, it will be rolled back

### Project Scripts
- `drizzle:generate`: Creates new migration files with --name tag
- `db:migrate:development`: Applies migrations to local D1 database
- `db:migrate:production`: Applies migrations to production D1 database

### Configuration & Setup
- [D1 HTTP Configuration Guide](https://orm.drizzle.team/docs/guides/d1-http-with-drizzle-kit)
- [Getting Started with D1](https://orm.drizzle.team/docs/get-started/d1-new)
- [Connecting to Cloudflare D1](https://orm.drizzle.team/docs/connect-cloudflare-d1#drizzle--cloudflare-d1)

### If needed for connecting to cf to run drizzle-kit commands
- use dotenv
- example drizzle.config.ts
``` ts

  dbCredentials: {
    accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
    databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
    token: process.env.CLOUDFLARE_D1_TOKEN!,
  },

```