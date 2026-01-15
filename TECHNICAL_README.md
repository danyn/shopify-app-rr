# Technical README: Shopify App on Cloudflare Workers with React Router

## Table of Contents
1. [Architecture Overview](#architecture-overview)
2. [Core Dependencies Analysis](#core-dependencies-analysis)
3. [Development Dependencies Analysis](#development-dependencies-analysis)
4. [Integration Patterns](#integration-patterns)
5. [Data Storage Architecture](#data-storage-architecture)
6. [Build and Deployment](#build-and-deployment)
7. [Unused Dependencies](#unused-dependencies)
8. [Key Documentation Links](#key-documentation-links)
9. [Shopify CLI and Development](#shopify-cli-and-development)
10. [Load Context](#load-context-deep-dive)

---

## Architecture Overview

This is a **Shopify embedded app** built with:
- **React Router v7** (formerly Remix) as the full-stack framework
- **Cloudflare Workers** (not Pages) as the serverless runtime
- **Cloudflare KV** for session storage
- **Cloudflare D1** (SQLite) for application data
- **Drizzle ORM** for database management

### Key Architectural Pattern

The app uses an **adapter pattern** to run React Router (designed for Cloudflare Pages) on Cloudflare Workers:

```typescript
// server.ts - Workers entry point
export default {
  async fetch(request, env, ctx) {
    // Construct EventContext (Pages format) from Workers arguments
    const eventContext = {
      request,
      env,
      params: {},
      data: {},
      waitUntil: ctx.waitUntil.bind(ctx),
      passThroughOnException: ctx.passThroughOnException.bind(ctx),
    };
    return await requestHandler(eventContext);
  }
}
```

**Why this matters**: Cloudflare Workers and Pages have different APIs. This pattern bridges that gap.

📖 **Reference**: [Cloudflare Workers Fetch Handler](https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/)

---

## Core Dependencies Analysis

### 1. React Router Framework (`@react-router/*`)

**Installed packages**:
```json
"@react-router/cloudflare": "^7.0.0",
"@react-router/fs-routes": "^7.0.0",
"@react-router/node": "^7.0.0",
"@react-router/serve": "^7.0.0"
```

**Purpose**: React Router v7 is a full-stack React framework (evolution of Remix).

**How they work together**:
- `@react-router/cloudflare`: Provides the Cloudflare Workers adapter (`createRequestHandler`)
- `@react-router/fs-routes`: File-system based routing (routes in `app/routes/`)
- `@react-router/node`: Node.js adapter for `shopify.server.ts` (see line 1: `import "@shopify/shopify-app-react-router/adapters/node"`)
- `@react-router/serve`: Build and serve utilities

**Used in**:
- `server.ts`: Entry point using `createRequestHandler`
- `app/entry.server.tsx`: Server-side rendering with `renderToReadableStream`
- `app/entry.client.tsx`: Client-side hydration with `HydratedRouter`

**Note**: `@react-router/node` is specifically required by `@shopify/shopify-app-react-router` which uses Node.js APIs for crypto operations.

📖 **References**:
- [React Router Docs](https://reactrouter.com/)
- [Cloudflare React Router Guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/)

---

### 2. Shopify App Integration (`@shopify/shopify-app-react-router`)

**Installed package**:
```json
"@shopify/shopify-app-react-router": "^1.0.0"
```

**Purpose**: Official Shopify package for building React Router apps with Shopify integration.

**Key features provided**:
1. **Authentication**: OAuth flow, session management, HMAC validation
2. **Admin API client**: GraphQL and REST API access
3. **Webhook handling**: Verification and processing
4. **Billing API**: Subscription management
5. **App Bridge integration**: Embedded app UI

**Used in**:
- `app/shopify.server.ts`: Core Shopify app configuration
- Routes: `authenticate.admin(request)` in loaders/actions
- `boundary` helper: Error handling and header management

**Key pattern - Singleton with KV session**:
```typescript
// app/shopify.server.ts
export const initKvSessionStorage = (kvNamespace: KVNamespace) => {
  if (!globalThis.shopifySessionStorage) {
    globalThis.shopifySessionStorage = new KVSessionStorage(kvNamespace);
  }
};

const getShopifyApp = () => {
  if (!globalThis.shopifySessionStorage) {
    throw new Error('The session was not initialized')
  }
  // Returns singleton instance
  return globalThis.shopifyAppInstance = shopifyApp({
    sessionStorage: globalThis.shopifySessionStorage,
    // ... other config
  });
};
```

**Why this pattern**: Cloudflare Workers are stateless. Using `globalThis` maintains the session storage instance across function invocations within the same isolate.

📖 **References**:
- [Shopify App React Router Docs](https://shopify.dev/docs/api/shopify-app-react-router/latest)
- [NPM Package](https://www.npmjs.com/package/@shopify/shopify-app-react-router)
- [GitHub Repo](https://github.com/Shopify/shopify-app-js/tree/main/packages/apps/shopify-app-react-router)

---

### 3. Session Storage (`@shopify/shopify-app-session-storage-kv`)

**Installed package**:
```json
"@shopify/shopify-app-session-storage-kv": "^5.0.4"
```

**Purpose**: **Official Shopify session storage adapter for Cloudflare KV**.

**Critical distinction**: This project uses KV storage, **NOT Prisma** (which is the default in Shopify templates).

**How it works**:
1. KV namespace configured in `wrangler.jsonc`:
```jsonc
"kv_namespaces": [
  {
    "binding": "SESSIONS_KV",
    "id": "26c88e0b98194f29b96f7546a19f4c2f"
  }
]
```

2. Initialized in `load-context.ts`:
```typescript
export function getLoadContext({ context, request }: GetLoadContextArgs) {
  if (context.cloudflare?.env?.SESSIONS_KV) {
    initKvSessionStorage(context.cloudflare.env.SESSIONS_KV);
  }
  return context;
}
```

3. Used in `shopify.server.ts`:
```typescript
globalThis.shopifySessionStorage = new KVSessionStorage(kvNamespace);
```

**Why KV instead of Prisma**: 
- Cloudflare Workers are serverless - no persistent filesystem
- KV is globally distributed, low-latency key-value storage
- Perfect for session data (read-heavy, eventually consistent)

📖 **References**:
- [Shopify Session Storage Adapters](https://github.com/Shopify/shopify-app-js/tree/main/packages/apps/session-storage)
- [Cloudflare KV Docs](https://developers.cloudflare.com/kv/)
- [KV_SETUP_GUIDE.md](./KV_SETUP_GUIDE.md) in this repo

---

### 4. App Bridge (`@shopify/app-bridge-react`)

**Installed package**:
```json
"@shopify/app-bridge-react": "4.2.2"
```

**Purpose**: **Client-side library for embedded Shopify apps**. Handles communication between your app and Shopify Admin.

**Used in**:
- `app/routes/app/route.tsx`: `NavMenu` component
- `app/routes/_index/route.tsx`: `AppProvider` wrapper

**Key pattern**:
```tsx
// app/routes/app/route.tsx
import { AppProvider } from "@shopify/shopify-app-react-router/react";
import { NavMenu } from "@shopify/app-bridge-react";

export default function App() {
  const { apiKey } = useLoaderData<typeof loader>();
  
  return (
    <AppProvider embedded apiKey={apiKey}>
      <NavMenu>
        <Link to="/app" rel="home">Home</Link>
        <Link to="/app/feature">Feature</Link>
      </NavMenu>
      <Outlet />
    </AppProvider>
  );
}
```

**Important**: `AppProvider` comes from `@shopify/shopify-app-react-router/react`, not `@shopify/app-bridge-react`. The React Router version includes additional React Router-specific logic.

📖 **References**:
- [App Bridge Library](https://shopify.dev/docs/api/app-bridge-library)
- [App Bridge React Components](https://shopify.dev/docs/api/app-bridge-library/react-components)

---

### 5. Database Layer (`drizzle-orm`)

**Installed package**:
```json
"drizzle-orm": "^0.44.5"
```

**Purpose**: TypeScript ORM for SQL databases. Used with Cloudflare D1 (SQLite).

**Used in**:
- `app/routes/app.subscriptions/route.tsx`: Tracking subscription data
- `app/routes/webhooks.app.uninstalled.tsx`: Cleanup on app uninstall
- `drizzle-db/schema/subscriptions.ts`: Schema definitions

**Pattern**:
```typescript
// app/routes/app.subscriptions/route.tsx
import { drizzle } from 'drizzle-orm/d1';
import { subscriptionTracking } from 'drizzle-db/schema';

export async function loader({ context }: LoaderFunctionArgs) {
  const env = context.cloudflare.env as Env;
  const db_subscriptions = drizzle(env.DB_SUBSCRIPTIONS);
  
  await db_subscriptions
    .insert(subscriptionTracking)
    .values(entry)
    .onConflictDoUpdate({
      target: subscriptionTracking.shopDomain,
      set: entry
    });
}
```

**Why D1**: Cloudflare D1 is SQLite at the edge. Perfect for relational data with low latency.

**Binding in `wrangler.jsonc`**:
```jsonc
"d1_databases": [
  {
    "binding": "DB_SUBSCRIPTIONS",
    "database_name": "subscriptions",
    "database_id": "productionDbId",
    "migrations_dir": "drizzle-db/migrations/subscriptions"
  }
]
```

📖 **References**:
- [Drizzle ORM Docs](https://orm.drizzle.team/)
- [Cloudflare D1 Docs](https://developers.cloudflare.com/d1/)
- [DRIZZLE.md](./DRIZZLE.md) in this repo

---

### 6. Bot Detection (`isbot`)

**Installed package**:
```json
"isbot": "^5.1.30"
```

**Purpose**: Detects web crawlers/bots from user-agent strings.

**Used in**: `app/entry.server.tsx`

**Pattern**:
```typescript
import { isbot } from "isbot";

export default async function handleRequest(request, ...) {
  const userAgent = request.headers.get("user-agent");
  const isBot = isbot(userAgent ?? '');
  
  const stream = await renderToReadableStream(...);
  
  // Wait for all Suspense boundaries if it's a bot
  if (isBot) {
    await stream.allReady;
  }
  
  return new Response(stream, { ... });
}
```

**Why**: Bots (search crawlers) need fully rendered content. Regular users benefit from streaming HTML. This optimizes both experiences.

📖 **References**:
- [isbot on NPM](https://www.npmjs.com/package/isbot)
- [React Streaming SSR](https://react.dev/reference/react-dom/server/renderToReadableStream)

---

### 7. React Core (`react`, `react-dom`)

**Installed packages**:
```json
"react": "18.3.1",
"react-dom": "18.3.1"
```

**Purpose**: Core React library and DOM renderer.

**Used everywhere** - standard React application dependencies.

**Specific to this project**:
- Server: `renderToReadableStream` from `react-dom/server`
- Client: `hydrateRoot` from `react-dom/client`

---

## Development Dependencies Analysis

### 1. Build System

#### Vite (`vite`)
```json
"vite": "^5.4.18"
```
**Purpose**: Lightning-fast build tool and dev server.

**Configuration**: `vite.config.ts`
- HMR setup for localhost and tunnel environments
- Cloudflare Workers compatibility (`workerd`, `worker`, `browser` conditions)
- TypeScript path aliases via `vite-tsconfig-paths`

#### React Router Dev Tools (`@react-router/dev`)
```json
"@react-router/dev": "^7.0.0"
```
**Purpose**: React Router CLI and dev server.

**Used in scripts**:
```json
"dev": "react-router dev",
"build": "react-router build",
"typegen": "react-router typegen"
```

**Provides**:
- `reactRouter()` Vite plugin
- `cloudflareDevProxy()` for local Cloudflare Workers simulation
- Type generation for routes

---

### 2. Cloudflare Workers Tools

#### Wrangler (`wrangler`)
```json
"wrangler": "^3.114.4"
```

**Purpose**: Cloudflare Workers CLI - deploy, manage, and test Workers.

**Note**: The `cloudflareDevProxy` in `vite.config.ts` is present but NOT used during active development because the app uses Shopify CLI commands instead of `npm run dev`.

**Used in scripts**:
```json
"deploy": "wrangler deploy",
"typegen": "wrangler types",
"cf:tunnel": "cloudflared tunnel run --token $CF_TUNNEL_TOKEN",
"cf:dev": "shopify app dev --tunnel-url https://dev-tunnel.minder.solutions:5500",
"db:migrate:subscriptions:production": "wrangler d1 migrations apply DB_SUBSCRIPTIONS --remote",
"db:migrate:subscriptions:development": "wrangler d1 migrations apply DB_SUBSCRIPTIONS --local"
```

#### Workers Types (`@cloudflare/workers-types`)
```json
"@cloudflare/workers-types": "^4.20250404.0"
```
**Purpose**: TypeScript definitions for Cloudflare Workers APIs.

**Used in**: `worker-configuration.d.ts` for type-safe environment bindings:
```typescript
interface Env {
  SESSIONS_KV: KVNamespace;
  DB_SUBSCRIPTIONS: D1Database;
  SHOPIFY_API_KEY: string;
  // ...
}
```

📖 **References**:
- [Wrangler Docs](https://developers.cloudflare.com/workers/wrangler/)
- [Workers Types](https://github.com/cloudflare/workers-types)

---

### 3. Database Development Tools

#### Drizzle Kit (`drizzle-kit`)
```json
"drizzle-kit": "^0.31.4"
```

**Purpose**: Schema management and migration generation for Drizzle ORM.

**Scripts**:
```json
"drizzle:generate:subscriptions": "drizzle-kit generate --config=drizzle-db/drizzle.subscriptions.config.ts --name=intialMigrationFromSchemaFiles",
"drizzle:studio": "drizzle-kit studio --config=drizzle-db/drizzle.studio.config.ts"
```

**Workflow**:
1. Define schema in `drizzle-db/schema/subscriptions.ts`
2. Run `drizzle:generate:subscriptions` to create SQL migration files
3. Run `db:migrate:subscriptions:development` to apply with Wrangler
4. Run `drizzle:studio` to browse data in GUI

#### Better SQLite3 (`better-sqlite3`)
```json
"better-sqlite3": "^12.4.1"
```

**Purpose**: **Local development only** - used by Drizzle Studio to connect to local Wrangler D1 database file.

**Configuration**: `drizzle-db/drizzle.studio.config.ts`
```typescript
export default defineConfig({
  dialect: 'sqlite',
  dbCredentials: {
    url: '.wrangler/state/v3/d1/miniflare-D1DatabaseObject/[hash].sqlite'
  }
});
```

**Not used in production** - D1 in production is accessed via HTTP API.

📖 **References**:
- [Drizzle Kit](https://orm.drizzle.team/kit-docs/overview)
- [Wrangler D1 Commands](https://developers.cloudflare.com/d1/wrangler-commands/)

---

### 4. TypeScript Tooling

#### TypeScript (`typescript`)
```json
"typescript": "5.8.3"
```
**Purpose**: Type checking and compilation.

**Scripts**:
```json
"typecheck": "react-router typegen && tsc"
```

#### TSX (`tsx`)
```json
"tsx": "^4.20.5"
```
**Purpose**: Execute TypeScript files directly (like `ts-node`).

**Note**: The deprecated `tsup` and other tools have been merged into `tsx`.

#### TypeScript Paths (`vite-tsconfig-paths`)
```json
"vite-tsconfig-paths": "^5.1.4"
```
**Purpose**: Resolve TypeScript path aliases in Vite.

**Enables**:
```typescript
import { authenticate } from "app/shopify.server";
// Instead of: import { authenticate } from "../../shopify.server";
```

---

### 5. Code Quality Tools

#### ESLint
```json
"eslint": "9.25.1",
"@typescript-eslint/eslint-plugin": "8.31.0",
"@typescript-eslint/parser": "8.31.0",
"eslint-import-resolver-typescript": "3.7.0",
"eslint-plugin-import": "2.31.0",
"eslint-plugin-jsx-a11y": "6.10.2",
"eslint-plugin-react": "7.37.5",
"eslint-plugin-react-hooks": "5.2.0"
```

**Purpose**: Code linting for TypeScript, React, imports, and accessibility.

**Script**:
```json
"lint": "eslint --ignore-path .gitignore --cache --cache-location ./node_modules/.cache/eslint ."
```

---

### 6. Type Definitions

```json
"@types/node": "^25.0.8",
"@types/react": "18.3.1",
"@types/react-dom": "18.3.1"
```

**Purpose**: TypeScript definitions for Node.js and React.

**Why `@types/node` in Workers**: `@shopify/shopify-app-react-router` uses Node.js APIs (crypto, buffers) via the `nodejs_compat` compatibility flag.

---

## Integration Patterns

### 1. Request Flow

```
HTTP Request
    ↓
[Cloudflare Workers] server.ts: fetch(request, env, ctx)
    ↓
Construct EventContext (adapter pattern)
    ↓
[@react-router/cloudflare] requestHandler
    ↓
[load-context.ts] getLoadContext - Initialize KV session
    ↓
[React Router] Route matching
    ↓
[Route loader/action] authenticate.admin(request)
    ↓
[shopify.server.ts] getShopifyApp() singleton
    ↓
[GraphQL/REST API] Shopify Admin API
    ↓
[React Components] Render with data
    ↓
[entry.server.tsx] renderToReadableStream
    ↓
HTTP Response
```

### 2. Session Management

```
Request → load-context.ts
    ↓
initKvSessionStorage(KV namespace)
    ↓
globalThis.shopifySessionStorage = new KVSessionStorage()
    ↓
shopify.server.ts: getShopifyApp()
    ↓
shopifyApp({ sessionStorage: globalThis.shopifySessionStorage })
    ↓
authenticate.admin(request)
    ↓
Read session from KV
    ↓
Validate OAuth
    ↓
Return { admin, session, billing, ... }
```

### 3. Database Access (D1)

```
Route loader/action
    ↓
context.cloudflare.env.DB_SUBSCRIPTIONS (binding)
    ↓
drizzle(env.DB_SUBSCRIPTIONS)
    ↓
db.insert(subscriptionTracking).values(...)
    ↓
D1 HTTP API (production) or Local SQLite (dev)
```

### 4. Build Process

```
[Development]
npm run dev
    ↓
react-router dev (Vite)
    ↓
cloudflareDevProxy() - simulate Workers env
    ↓
HMR via WebSocket
    ↓
http://localhost:3000

[Production]
npm run build
    ↓
react-router build
    ↓
Vite bundle → /build/client (static assets)
    ↓
React Router SSR → /build/server/index.js
    ↓
wrangler deploy
    ↓
Cloudflare Workers
```

---

## Data Storage Architecture

### 1. Sessions (Cloudflare KV)
- **Purpose**: OAuth tokens, shop data, session state
- **Package**: `@shopify/shopify-app-session-storage-kv`
- **Binding**: `SESSIONS_KV`
- **Pattern**: Key-value, globally replicated
- **Access**: Via `shopifyApp.sessionStorage`

### 2. Subscriptions (Cloudflare D1)
- **Purpose**: Track subscription events, billing data
- **Package**: `drizzle-orm` + `drizzle-kit`
- **Binding**: `DB_SUBSCRIPTIONS`
- **Schema**: `drizzle-db/schema/subscriptions.ts`
- **Pattern**: Relational (SQLite), edge-replicated
- **Migrations**: Wrangler D1 migrations

### 3. Environment Variables (Workers Secrets)
- **Purpose**: API keys, secrets, config
- **Defined in**: `wrangler.jsonc` → `vars` section
- **Production**: Managed via Cloudflare Dashboard
- **Access**: `process.env.SHOPIFY_API_KEY` (via `nodejs_compat` flag)

---

## Build and Deployment

### Development Modes

**⚠️ IMPORTANT**: This app **requires Shopify CLI** for development. The standard `npm run dev` will NOT work for Shopify app development.

#### 1. Cloudflare Tunnel Development (PRIMARY METHOD)
```bash
# Terminal 1: Start Cloudflare Tunnel
npm run cf:tunnel
# This exposes local server via Cloudflare Tunnel

# Terminal 2: Start Shopify Dev with tunnel
npm run cf:dev
# Uses: shopify app dev --tunnel-url https://dev-tunnel.minder.solutions:5500
```

**This is the primary development workflow** because:
- Integrates with Shopify platform (OAuth, webhooks, App Bridge)
- Provides proper shop context and authentication
- Enables embedded app testing
- Handles session management correctly

#### 2. Localhost Compilation Check (LIMITED USE)
```bash
npm run dev
# Uses: react-router dev
```

**Note**: This script is **only useful for checking if the app compiles**. It does NOT work for actual Shopify app development because:
- No Shopify OAuth integration
- No shop context or session handling
- Cannot test embedded app features
- Missing Shopify CLI environment variables

**Use case**: Quick TypeScript/build error checking without full Shopify setup.

### Production Deployment
```bash
npm run build    # React Router build
npm run deploy   # Wrangler deploy to Cloudflare Workers
```

### Migration Commands
```bash
# Generate migration from schema changes
npm run drizzle:generate:subscriptions

# Apply to local dev database
npm run db:migrate:subscriptions:development

# Apply to production
npm run db:migrate:subscriptions:production

# Browse data in GUI
npm run drizzle:studio
```

---

## Unused Dependencies

### ❌ `@shopify/polaris` - NOT INSTALLED
**Why**: This app uses **Polaris Web Components** (HTML custom elements) instead of React components.

**Evidence**:
- Commented imports in code: `// import { Page } from "@shopify/polaris"`
- README references Polaris Web Components: [Using Polaris Components](https://shopify.dev/docs/api/app-home/using-polaris-components)

**Reason**: Web Components are lighter, framework-agnostic, and load from Shopify's CDN.

### ✅ All other dependencies are actively used

---

## Key Documentation Links

### Framework and Platform
- [React Router v7](https://reactrouter.com/)
- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Cloudflare React Router Guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/)

### Shopify Integration
- [Shopify App React Router Docs](https://shopify.dev/docs/api/shopify-app-react-router/latest)
- [NPM Package](https://www.npmjs.com/package/@shopify/shopify-app-react-router)
- [GitHub Repository](https://github.com/Shopify/shopify-app-js/tree/main/packages/apps/shopify-app-react-router)
- [App Bridge Library](https://shopify.dev/docs/api/app-bridge-library)

### Session Storage
- [Shopify Session Storage Adapters](https://github.com/Shopify/shopify-app-js/tree/main/packages/apps/session-storage)
- [Cloudflare KV Documentation](https://developers.cloudflare.com/kv/)
- [KV_SETUP_GUIDE.md](./KV_SETUP_GUIDE.md)

### Database (D1 + Drizzle)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)
- [Wrangler D1 Commands](https://developers.cloudflare.com/d1/wrangler-commands/)
- [DRIZZLE.md](./DRIZZLE.md)

### Build Tools
- [Vite Documentation](https://vitejs.dev/)
- [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)

### Shopify App Development
- [Build a Shopify App](https://shopify.dev/docs/apps/build/scaffold-app)
- [Shopify Admin API](https://shopify.dev/docs/api/admin)
- [App Deployment Guide](https://shopify.dev/docs/apps/launch/deployment)

---

## Notes and Gotchas

### 1. Node.js Compatibility
- Workers runtime is V8 (not Node.js)
- `nodejs_compat` flag in `wrangler.jsonc` enables `process.env`, `crypto`, etc.
- Required by `@shopify/shopify-app-react-router`

### 2. Type Safety
- `worker-configuration.d.ts` defines `Env` interface
- `load-context.ts` types aren't perfectly inferred in routes
- Use explicit type assertions: `const env = context.cloudflare.env as Env`

### 3. Session Initialization
- **Critical**: `initKvSessionStorage` must be called before `getShopifyApp()`
- Happens in `load-context.ts` for every request
- Uses `globalThis` for persistence across invocations

### 4. Error Boundaries
- All routes must export `boundary.error` and `boundary.headers`
- Required for Shopify-specific error handling
- Ensures proper headers for App Bridge

---

## Conclusion

This is a **modern, edge-first Shopify app** leveraging:
- React Router v7 for full-stack React
- Cloudflare Workers for global, low-latency compute
- KV for distributed session storage
- D1 for relational data at the edge
- Drizzle ORM for type-safe database access

All dependencies are purposefully chosen and actively used. The architecture adapts React Router (designed for Pages) to work on Workers, providing a robust foundation for embedded Shopify apps.

---

## Shopify CLI and Development

### What is `shopify app dev`?

The `shopify app dev` command is the **primary development tool** for Shopify apps. It's a sophisticated orchestrator that:
- Detects your app's framework automatically
- Starts your framework's dev server (Vite in this case)
- Creates tunnels for external access
- Manages app configuration
- Syncs extensions
- Serves GraphiQL
- Watches for file changes

**This is NOT just a simple wrapper around `npm run dev`.** It's a complete development environment manager.

📖 **Reference**: [Shopify CLI Documentation](https://shopify.dev/docs/apps/build/cli-for-apps/test-apps-locally)

### How Does Shopify CLI Detect and Run Your Dev Server?

#### Framework Detection

Shopify CLI **automatically detects** what framework you're using by inspecting your project files:

1. **Reads `shopify.web.toml`**: This file defines how your web app should be run
2. **Inspects `package.json`**: Looks for framework-specific dependencies
3. **Checks for config files**: `vite.config.ts`, `remix.config.js`, etc.

In this project, the CLI detects React Router because of:
- `shopify.web.toml` specifying the dev command
- React Router dependencies in `package.json`
- `vite.config.ts` presence

#### What Gets Executed

When you run `shopify app dev`, the CLI:

1. **Reads shopify.web.toml**:
```toml
[commands]
dev = "npm exec react-router dev"
port = 5500
```

2. **Executes the dev command** defined in the TOML file
3. **Proxies through the specified port** (5500 in this case)
4. **Sets up tunneling** (Cloudflare Tunnel in this project's case)

So when you run:
```bash
npm run cf:dev
# Which executes: shopify app dev --tunnel-url https://dev-tunnel.minder.solutions:5500
```

The CLI:
- Executes `npm exec react-router dev` (from shopify.web.toml)
- React Router then starts **Vite** as its dev server
- Vite serves your app on the configured port
- Shopify CLI proxies/tunnels that port to your tunnel URL

### Which Version of Vite?

**Vite version is determined by YOUR package.json**, not by Shopify CLI.

```json
"devDependencies": {
  "vite": "^5.4.18"  // ← This is what gets used
}
```

Shopify CLI **does not bundle or provide Vite**. It simply:
1. Executes the command in `shopify.web.toml`
2. That command runs React Router's dev server
3. React Router dev server internally uses your installed Vite version

**Flow Diagram**:
```
shopify app dev
  ↓
Reads shopify.web.toml → [commands.dev]
  ↓
Executes: npm exec react-router dev
  ↓
React Router CLI looks for: node_modules/@react-router/dev
  ↓
React Router dev imports: vite (from YOUR node_modules)
  ↓
Vite v5.4.18 starts dev server
  ↓
Shopify CLI proxies port 5500 → tunnel URL
```

### Is This Visible in package.json?

**YES and NO:**

**Visible:**
- ✅ Vite version: Explicitly in `devDependencies`
- ✅ React Router dev: `@react-router/dev` in devDependencies
- ✅ Your dev scripts: In the `scripts` section

**NOT Visible:**
- ❌ Shopify CLI's internal framework detection logic
- ❌ Shopify CLI's proxy/tunnel management
- ❌ The exact Vite version Shopify CLI "expects" (it doesn't care!)

### What Happens When You Update Shopify CLI?

When you run `npm install -g @shopify/cli@latest`:

1. **Framework Detection Improves**: CLI may add support for new frameworks
2. **Bug Fixes**: CLI's proxy/tunnel handling may improve
3. **New Features**: New commands, better error messages, etc.

**What DOESN'T Change:**
- ❌ Your Vite version (controlled by package.json)
- ❌ Your React Router version (controlled by package.json)
- ❌ Your app's dev server behavior (controlled by vite.config.ts)

The CLI is a **coordinator**, not the runtime itself.

### Why `npm run dev` Doesn't Work for Full Development

Looking at package.json:
```json
"scripts": {
  "dev": "react-router dev"
}
```

Running `npm run dev` WILL start Vite and serve your app, BUT:
- ❌ No tunnel (can't access from Shopify admin)
- ❌ No app URL updates
- ❌ No extension syncing
- ❌ No GraphiQL server
- ❌ No Shopify environment variable injection

**It's useful for:**
- ✅ Quick compilation checks
- ✅ Testing build locally
- ✅ Running without Shopify dependencies (if needed)

### The Correct Development Flow

**Primary Method (Full Shopify Integration):**
```bash
npm run cf:tunnel  # Terminal 1: Start Cloudflare Tunnel
npm run cf:dev     # Terminal 2: Start Shopify dev with tunnel
```

This runs:
```bash
shopify app dev --tunnel-url https://dev-tunnel.minder.solutions:5500
```

**Alternative (Localhost Only - Limited):**
```bash
npm run lh:dev     # shopify app dev --use-localhost
```

### Key Takeaways

1. **Shopify CLI is an orchestrator**, not a bundler or dev server
2. **Your package.json controls all framework/tool versions**
3. **shopify.web.toml tells CLI what command to run**
4. **Vite version comes from YOUR dependencies**, not Shopify CLI
5. **Framework detection is automatic** but based on files you control
6. **Updating Shopify CLI doesn't change your Vite version**
7. **`npm run dev` works but lacks Shopify integration** - use `shopify app dev` instead

### Additional Resources

- [Shopify CLI Commands](https://shopify.dev/docs/api/shopify-cli/app/app-dev)
- [App Configuration (shopify.web.toml)](https://shopify.dev/docs/apps/build/cli-for-apps/app-structure#shopify-web-toml)
- [React Router on Cloudflare](https://reactrouter.com/start/framework/cloudflare)
- [Vite Dev Server Configuration](https://vitejs.dev/config/server-options.html)

---

## Load Context Deep Dive

The `load-context.ts` file is **critical** to this application's architecture. It bridges Cloudflare Workers environment bindings to React Router's loader/action context system.

### What is `getLoadContext`?

`getLoadContext` is a function provided by React Router server adapters that allows you to inject custom data into the `context` parameter available in every loader and action.

**From React Router documentation**:
> A function that returns the value to use as `context` in route `loader` and `action` functions. You can think of this as an escape hatch that allows you to pass environment/platform-specific values through to your loader/action.

### Your Implementation

```typescript
// load-context.ts
import { type PlatformProxy } from "wrangler";
import { initKvSessionStorage } from './app/shopify.server';

type GetLoadContextArgs = {
  request: Request;
  context: {
    cloudflare: Omit<PlatformProxy<Env>, "dispose" | "caches" | "cf"> & {
      caches: PlatformProxy<Env>["caches"] | CacheStorage;
      cf: Request["cf"];
    };
  };
};

export function getLoadContext({ context, request }: GetLoadContextArgs) {
  /**
   * Initialize the KV store session object
   * This MUST happen before any Shopify operations
   */
  if (context.cloudflare?.env?.SESSIONS_KV) {
    initKvSessionStorage(context.cloudflare.env.SESSIONS_KV);
  } else {
    throw new Error('SESSIONS_KV binding for a KV store on cloudflare is required')
  }
  
  /* Return the context - available in all loaders/actions */
  return context;
}
```

### How It Works: Request Flow

```
1. HTTP Request → Cloudflare Workers
   ↓
2. server.ts: fetch(request, env, ctx)
   - env contains: SESSIONS_KV, DB_SUBSCRIPTIONS, environment variables
   - ctx contains: waitUntil, passThroughOnException
   ↓
3. Construct EventContext (adapter pattern)
   - Packages Workers args into Pages-compatible format
   ↓
4. requestHandler(eventContext)
   ↓
5. React Router calls getLoadContext({ request, context })
   - context.cloudflare.env = env (KV, D1, vars)
   - context.cloudflare.ctx = ctx (waitUntil, etc.)
   ↓
6. getLoadContext initializes session storage
   - initKvSessionStorage(context.cloudflare.env.SESSIONS_KV)
   - Stores in globalThis for singleton pattern
   ↓
7. Returns context to React Router
   ↓
8. Route loader/action receives context parameter
   - Can access: context.cloudflare.env.DB_SUBSCRIPTIONS
   - Can access: context.cloudflare.env.SHOPIFY_API_KEY
   - Session storage is now initialized for authenticate.admin()
```

### Why This Pattern?

**Problem**: Cloudflare Workers uses `fetch(request, env, ctx)` but React Router expects `getLoadContext({ request, context })`.

**Solution**: The adapter pattern in `server.ts` bridges this gap:

```typescript
// server.ts
export default {
  async fetch(request, env, ctx) {
    const eventContext = {
      request,
      env,                           // ← Cloudflare bindings
      params: {},
      data: {},
      waitUntil: ctx.waitUntil.bind(ctx),
      passThroughOnException: ctx.passThroughOnException.bind(ctx),
    };
    
    // getLoadContext receives this through createRequestHandler
    return await requestHandler(eventContext);
  }
}
```

### Session Storage Initialization

The **most critical** function in `load-context.ts`:

```typescript
if (context.cloudflare?.env?.SESSIONS_KV) {
  initKvSessionStorage(context.cloudflare.env.SESSIONS_KV);
}
```

**Why this is essential**:
1. **Every request** needs session access for Shopify authentication
2. `shopifyApp()` requires initialized session storage
3. Must happen **before** any `authenticate.admin(request)` calls
4. Uses `globalThis` to persist across invocations in same Worker isolate

**From `app/shopify.server.ts`**:
```typescript
export const initKvSessionStorage = (kvNamespace: KVNamespace) => {
  if (!globalThis.shopifySessionStorage) {
    globalThis.shopifySessionStorage = new KVSessionStorage(kvNamespace);
  }
};

const getShopifyApp = () => {
  if (!globalThis.shopifySessionStorage) {
    throw new Error('The session was not initialized')  // ← Would fail without load-context!
  }
  
  return shopifyApp({
    sessionStorage: globalThis.shopifySessionStorage,
    // ...
  });
};
```

### Context Usage in Routes

Once `getLoadContext` runs, every loader and action receives the context:

```typescript
// app/routes/app.subscriptions/route.tsx
export async function loader({ request, context }: LoaderFunctionArgs) {
  // Access environment bindings
  const env = context.cloudflare.env as Env;
  
  // Access D1 database
  const db = drizzle(env.DB_SUBSCRIPTIONS);
  
  // Authenticate (session storage already initialized!)
  const { admin, session } = await authenticate.admin(request);
  
  // Use shop from session
  const shopDomain = session.shop;
  
  return { /* ... */ };
}
```

### Type Safety Challenges

**Note from the code**:
> "It is passing the context through to the loaders and actions. So that they can access the variables and databases. But the type inference is not working once in a route's loader."

**Why**: TypeScript struggles to infer the exact shape of `context.cloudflare.env` because:
1. Types are defined in `worker-configuration.d.ts`
2. Context flows through multiple adapter layers
3. React Router's type system doesn't perfectly align

**Solution**: Explicit type assertions in routes:
```typescript
const env = context.cloudflare.env as Env;
```

### Comparison to Other Adapters

**Express (from React Router repo)**:
```typescript
// Express passes req/res objects
function getLoadContext(req: express.Request, res: express.Response) {
  return { db: createDb() };
}
```

**Cloudflare Pages (default)**:
```typescript
// Pages receives EventContext directly
function getLoadContext({ context }: EventContext) {
  return {
    cloudflare: {
      env: context.env,
      ctx: context.ctx,
    }
  };
}
```

**This App (Workers → Pages adapter)**:
```typescript
// server.ts constructs EventContext from Workers args
// getLoadContext receives it and initializes session
function getLoadContext({ context, request }: GetLoadContextArgs) {
  initKvSessionStorage(context.cloudflare.env.SESSIONS_KV);
  return context;
}
```

### Official Documentation & Examples

**React Router Context Documentation**:
- [Data Loading](https://reactrouter.com/start/framework/data-loading) - LoaderArgs includes `context`
- [Server Adapters](https://api.reactrouter.com/v7/modules/_react_router_cloudflare.html) - Cloudflare adapter reference
- [Middleware Context API](https://reactrouter.com/how-to/middleware#context-api) - Type-safe context (future pattern)

**Cloudflare + React Router**:
- [Cloudflare React Router Guide](https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/)
- [Use bindings with React Router](https://developers.cloudflare.com/workers/framework-guides/web-apps/react-router/#use-bindings-with-react-router) - Shows `context.cloudflare.env` pattern
- [Vite Cloudflare Plugin](https://github.com/remix-run/react-router/tree/main/packages/react-router-dev/vite/cloudflare-dev-proxy.ts) - Source code for `cloudflareDevProxy` with `getLoadContext`

**Shopify Template Examples**:
- [Shopify React Router Template](https://github.com/Shopify/shopify-app-template-react-router) - Uses Prisma sessions (not KV)
- No official KV session example from Shopify yet - **your implementation is a custom solution**

**React Router GitHub Examples**:
- [Cloudflare Workers Test](https://github.com/remix-run/react-router/blob/main/integration/vite-cloudflare-test.ts#L11-L70) - Shows `getLoadContext` pattern
- [Vite Plugin Cloudflare Template](https://github.com/remix-run/react-router/tree/main/integration/helpers/vite-plugin-cloudflare-template) - Example Workers setup

### Key Takeaways

1. **Essential for session init**: Without this, Shopify auth won't work
2. **Runs on every request**: Initializes environment for route handlers
3. **Adapter pattern**: Bridges Workers `(request, env, ctx)` → React Router `context`
4. **Platform-specific**: This pattern is unique to Cloudflare Workers
5. **globalThis pattern**: Session storage persists within Worker isolate
6. **Type challenges**: Manual type assertions needed in routes

**Your implementation is a sophisticated integration of**:
- Cloudflare Workers runtime
- React Router's context system
- Shopify's session management
- KV storage (instead of typical Prisma)

This is a **custom architecture** that combines multiple frameworks in a way not fully documented by any single source. Your `load-context.ts` is the glue that makes it all work together.
