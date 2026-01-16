# Data Stores

## 1. Sessions
- The data storage for sessions only stores session data and is single purpose.
- It uses a cloudflare KV instance
- @shopify/shopify-app-session-storage-kv is the session logic
- the wrangler.jsonc file contains the datastore with the correct binding (name)
- the id of the kv store is entered once the kv is created
- [doc](https://developers.cloudflare.com/kv/get-started/)
- [example config](https://github.com/cloudflare/docs-examples/blob/update/kv/kv/kv-get-started/wrangler.jsonc)

### this is what is in the wrangler.jsonc for this project:
``` jsonc
  "kv_namespaces": [
    {
      "binding": "SESSIONS_KV",
      "id": "26c88e0b98194f29b96f7546a19f4c2f"
    }
  ],
```

For more info see KV_SETUP_GUIDE.md

## 2. Subscriptions

- the '/routes/app._m' route creates redirects to either the shopify hosted subscription page when there is no subscription, or to  '/routes/app.subscriptions' when there is no metafield on the appInstallation for the current subscription

- subscriptions are handled at this route: 'app/routes/app.subscriptions'
- This route does two things
  1. It will create a metafield on the appInstallation that is used to check if there is an active subscription in liquid blocks. 
  - setAppSubscriptionFlags() handles this task.
  - all routes nested under 'app._m' redirect to this loader if they don't find the metafield in place.
  2. Subscriptions can be tracked by inserting subscribed users into a d1 instance when shopify redirects them back to the loader.  When there is a chargeId it means subcribed. This is only useful if you want to later query the d1 to get subscription info in order to communicate with the shop by way of email etc. currently there is a package that communicates using email+sendgrid+offlineToken that queries this endpoint 'app/routes/q.email-address'.
    - the d1 table is defined here: 'drizzle-db/schema/subscriptions.ts'
    - there a some scripts in the package.json that call wrangler  to apply the migration files.

       1. generate a migration for d1 using drizzle: 'drizzle:generate:subscriptions'
       2. apply the migration to the d1 'db:migrate:subscriptions:development' or 'db:migrate:subscriptions:production'


# 3. Environment Variables

The environment variables can come from more than one place. 

- dev.vars see (dev.vars.example) serves to provide secret vars during dev (cloudflare + wrangler convention)
- wrangler.jsonc can put anything into the cloudflare env so could be used instead of dev.vars if wanted. this will also put the vars into the cloudflare dashboard. Secrets are set in the cloudflare dashboard only. 
- here use the env property to put the variables in
- when in dev variables are also injected by the shopify.app.xyz.toml files

- The client secret (shopify app secret key) is injected by the shopify dev command for local development and does not need to be anywhere but needs to be a secret in the cloudflare dashboard for the production app.

```
  
  * an app is mostly a bundle of env variables and access scopes that is allowed on shopify.
  * a single codebase can have many of these bundles of variables (apps) but the "scopes" all need to match.
  * the app is hosted by us on cloudflare in this case
  * Shopify hosts the /extensions folder on its own servers.
  * The app  writes metafields and shop data that is accessible in the /extensions
  * if an app where only ever in a dev mode it would only need one set of variables from the shopify.app.xyz.toml file and the ones in .dev.vars
  
  * some values are in both files:
  shopify.app.toml       wrangler.jsonc
  client_id        ->   SHOPIFY_API_KEY
  scopes           ->   SCOPES
  handle           ->   SHOPIFY_APP_HANDLE
  application_url  ->   SHOPIFY_APP_URL

  (only for shopify)
  embedded 
  name
  webhooks
  etc... 



```

# Useful commands

1. check which shopify.app.xyz.toml file is being used:
```
% shopify app info
```
2. choose the which of these toml files to use:
```
% shopify app config use
```
3. trigger webhooks for testing
```
% shopify app webhook trigger
?  Webhook Topic:
✔  app/uninstalled

?  Delivery method:
✔  HTTP

?  Address for delivery:
https://dev-tunnel.minder.solutions/webhooks/app/uninstalled
```

4. check if the uninstall removes the session data for the shop

```
--local
npx wrangler kv key list --binding=SESSIONS_KV --local

```


# Initial Consideratins
This package updated to react router and removed all the react polaris stuff in favor of the web components which are included in the shopify app rr bundle (I think?). 


https://developers.cloudflare.com/workers/runtime-apis/bindings/

https://developers.cloudflare.com/kv/api/

https://shopify.dev/docs/api/shopify-cli/app

Setup two apps one for production, one for development both in the shopify partner UI.
[partnersUI](https://partners.shopify.com/)

# Shopify App Template - Cloudflare Workers

[![Deploy to Cloudflare](https://deploy.workers.cloudflare.com/button)](https://deploy.workers.cloudflare.com/?url=https://github.com/Minder-Solutions/minder-cf-app-sf-setup-0)

# pull info directly in from shopify dashboard
shopify app config link
# dev instructions
Read package.json -> myBuildNotes
Dev needs its own branch that keeps the wrangler version at 3.
This version never goes into the package.json for main which puts wrangler at 4.

Dev uses  the cf:dev command
This only works after running cf:tunnel to create a local tunnel.

> npm run cf:tunnel
> shopify app config use shopify.app.cftunnel.toml
> npm run cf:dev

The dev app has its own app in Shopify. Create it in the Shopify Partners UI.

## shopify.app.cftunnel.toml (env)

This file will have all the settings for running the app for a dev server
shopify.app.xxx.toml files are like a mix between an .env file and a set of instructions for configuring the Shopify app which is nothing more than a group of settings including urls, client id, client secret, access scopes, and extesions. The access scopes is one thing that must be set in at three places. 
- shopify.app.cftunnel.toml
- shopify.app.production.toml
- and wrangler.jsonc

This toml file describes all the app configurations and can be used to:

1) control what is being served locally at the env level (shop, app)
  > shopify app config use shopify.app.cftunnel.toml
2) put those changes into the app settings on Shopify
  > shopify app deploy
  - This creates versions of the shopify app settings and extensions
  - This is seperate from the remix app code versions.
  - In Shopify Partners apps are versioned groups of app settings and extensions. Like an environment that provides credentials to  the actual remix app.
3) client secret is injected by the shopify cli and associated by the client id

### Using shopify.app.cftunnel.toml 

the --tunnel-url in cf:dev is the same as the application url.
for example application_url = "https://dev-tunnel.minder.solutions"
This means it is set:
1) in cloudflare zero trust as the tunnel url
2) in the shopify.app.cftunnel.toml
3) in cf:dev --tunnel-url
4) cf:tunnel associates this with the same url using the --token from cf.

### D1 in dev

confirm but I think:
Wrangler spins up a local dev server that simulates a Worker runtime.

For D1 databases, it does not connect to your Cloudflare-hosted D1 instance by default. Instead, Wrangler creates (or reuses) a local SQLite file in your project folder to simulate your D1 database.

# Production instructions
The production app should also be set up in the Shopify Partners UI. It also needs a toml file but the env aspects are less important now.  They will become secrets and variables in the cloudflare worker. There will be a lot overlap between the shopify toml and the wrangler jsonc. To run the app go to the app UI in Shopify Partners and select to test it on a store frome there.

## shopify.app.production.toml (env)
- Is used to associate the app, url, and the extensions. It creates versions of the app settings and extensions in Shopify.
## wrangler.jsonc (env) and or settings in cloudflare
secrets and variables in cloudflare are the same.  The only difference is that secrets are not visible in the clouflare ui. Other than that they are both just .env
```jsonc
"vars": {
    "SHOPIFY_API_KEY": "your_api_key_here", // put in secrets
    "SHOPIFY_API_SECRET": "your_api_secret_here", // put in secrets
    "SHOPIFY_APP_URL": "https://example.workers.dev", // adjust as needed
    "SCOPES": "write_products" // adjust scopes as needed
  }
```




## What is this?

A Shopify app starter, built on top of Cloudflare Workers. This template provides a foundation for building a [Shopify app](https://shopify.dev/docs/apps/getting-started) using the [Remix](https://remix.run) framework, deployed on Cloudflare's global network.

## Why would I use this?

This lets you deploy the entire Shopify Remix starter application to Cloudflare with a single click. It will setup a repo and a Cloudflare worker named after your project, along with a D1 database and binding to store the session data.

Cloudflare Workers is flexible, scalable, and even has a [free tier for those just getting started.](https://developers.cloudflare.com/workers/platform/pricing/)



## Prerequisites

Before you begin, you'll need the following:

1. **Cloudflare Account**: [Sign up](https://dash.cloudflare.com/sign-up) if you don't have one.
2. **Shopify Partner Account**: [Create an account](https://partners.shopify.com/signup) if you don't have one.
3. **Shopify App**: Create an app in the [Shopify partner dashboard](https://partners.shopify.com/organizations).
4. **Test Store**: Set up either a [development store](https://help.shopify.com/en/partners/dashboard/development-stores#create-a-development-store) or a [Shopify Plus sandbox store](https://help.shopify.com/en/partners/dashboard/managing-stores/plus-sandbox-store) for testing your app.

## Quick Start

1. Click the "Deploy to Cloudflare" button at the top of this README.
2. Configure your deployment settings including worker name and repository details.
3. After deployment, update the `wrangler.jsonc` file in your new repository with the credentials from your Shopify app:

```jsonc
"vars": {
 "SHOPIFY_API_KEY": "your_api_key_here", // Don't use this in production, use secrets in the dashboard https://developers.cloudflare.com/workers/configuration/secrets/#adding-secrets-to-your-project
 "SHOPIFY_API_SECRET": "your_api_secret_here", // Don't use this in production, use secrets in the dashboard https://developers.cloudflare.com/workers/configuration/secrets/#adding-secrets-to-your-project
 "SHOPIFY_APP_URL": "https://your-worker-name.workers.dev",
 "SCOPES": "write_products,read_orders", // adjust scopes as needed
}
```

You should consider storing them [as secrets in a production application.](https://developers.cloudflare.com/workers/configuration/secrets/#adding-secrets-to-your-project) 
## Enabling Additional Databases
This template supports multiple D1 databases which can be useful for more complex applications. Two additional databases (DB2 and DB3) are included in the configuration but commented out by default. Here's how to enable them:
1. Create the databases in Cloudflare Dashboard:
- Go to your Cloudflare Dashboard
- Navigate to Storage & Databases > D1 SQL Database
- Click "Create"
- Name your databases shop_auth_exampledb2 and shop_auth_exampledb3 (these names should match the database name in your wrangler.jsonc)
- Note the generated database IDs for each
2. Update your wrangler.jsonc file
```jsonc
{
  // ... other configuration
  "d1_databases": [
    {
      "binding": "DB",
      "database_name": "shop_auth",
      "database_id": "151f7d9b-365f-41d7-83ed-0bf4eeef5086"
    },
    {
      "binding": "DB2",
      "database_name": "shop_auth_exampledb2",
      "database_id": "your-actual-db2-id-from-dashboard"
    },
    {
      "binding": "DB3",
      "database_name": "shop_auth_exampledb3",
      "database_id": "your-actual-db3-id-from-dashboard"
    }
  ],
  // ... rest of configuration
  ````

3. Commit and deploy your changes:
  - After deployment, your Worker will have access to all three databases. You can access them in your code using the bindings. 
  - Visit the example page in the app to see how to interact with multiple databases.

## Authenticating and querying data

To authenticate and query data you can use the `shopify` const that is exported from `/app/shopify.server.ts`:



This template comes preconfigured with examples of:

1. Setting up your Shopify app in [/app/shopify.server.ts](https://github.com/Shopify/shopify-app-template-remix/blob/main/app/shopify.server.ts)
2. Querying data using Graphql. Please see: [/app/routes/app.\_index.tsx](https://github.com/Shopify/shopify-app-template-remix/blob/main/app/routes/app._index.tsx).
3. Responding to mandatory webhooks in [/app/routes/webhooks.tsx](https://github.com/Shopify/shopify-app-template-remix/blob/main/app/routes/webhooks.tsx)

Please read the [documentation for @shopify/shopify-app-remix](https://www.npmjs.com/package/@shopify/shopify-app-remix#authenticating-admin-requests) to understand what other API's are available.

## Troubleshooting

### Updating the URL for your App

You may get an error similar to this "Error: Invalid appUrl configuration 'example.workers.dev', please provide a valid URL." When trying to update the domain in wrangler.jsonc

Make sure you have the url formatted properly, in this example it would be "https://example.workers.dev/"

### Navigating/redirecting breaks an embedded app

Embedded Shopify apps must maintain the user session, which can be tricky inside an iFrame. To avoid issues:

1. Use `Link` from `@remix-run/react` or `@shopify/polaris`. Do not use `<a>`.
2. Use the `redirect` helper returned from `authenticate.admin`. Do not use `redirect` from `@remix-run/node`
3. Use `useSubmit` or `<Form/>` from `@remix-run/react`. Do not use a lowercase `<form/>`.

This only applies if your app is embedded, which it will be by default.

### Non Embedded

Shopify apps are best when they are embedded in the Shopify Admin, which is how this template is configured. If you have a reason to not embed your app please make the following changes:

1. Ensure `embedded = false` is set in [shopify.app.toml`](./shopify.app.toml). [Docs here](https://shopify.dev/docs/apps/build/cli-for-apps/app-configuration#global).
2. Pass `isEmbeddedApp: false` to `shopifyApp()` in `./app/shopify.server.js|ts`.
3. Change the `isEmbeddedApp` prop to `isEmbeddedApp={false}` for the `AppProvider` in `/app/routes/app.jsx|tsx`.
4. Remove the `@shopify/app-bridge-react` dependency from [package.json](./package.json) and `vite.config.ts|js`.
5. Remove anything imported from `@shopify/app-bridge-react`.  For example: `NavMenu`, `TitleBar` and `useAppBridge`.

### OAuth goes into a loop when I change my app's scopes

If you change your app's scopes and authentication goes into a loop and fails with a message from Shopify that it tried too many times, you might have forgotten to update your scopes with Shopify.
To do that, you can run the `deploy` CLI command.

### My shop-specific webhook subscriptions aren't updated

If you are registering webhooks in the `afterAuth` hook, using `shopify.registerWebhooks`, you may find that your subscriptions aren't being updated.  

Instead of using the `afterAuth` hook, the recommended approach is to declare app-specific webhooks in the `shopify.app.toml` file.  This approach is easier since Shopify will automatically update changes to webhook subscriptions every time you run `deploy`.  Please read these guides to understand more:

1. [app-specific vs shop-specific webhooks](https://shopify.dev/docs/apps/build/webhooks/subscribe#app-specific-subscriptions)
2. [Create a subscription tutorial](https://shopify.dev/docs/apps/build/webhooks/subscribe/get-started?framework=remix&deliveryMethod=https)

## Tech Stack

This template uses [Remix](https://remix.run) with Cloudflare Workers. The following Shopify tools are also included to ease app development:

- [Shopify App Remix](https://shopify.dev/docs/api/shopify-app-remix) provides authentication and methods for interacting with Shopify APIs.
- [Shopify App Bridge](https://shopify.dev/docs/apps/tools/app-bridge) allows your app to seamlessly integrate your app within Shopify's Admin.
- [Polaris React](https://polaris.shopify.com/) is a powerful design system and component library that helps developers build high quality, consistent experiences for Shopify merchants.
- [Webhooks](https://github.com/Shopify/shopify-app-js/tree/main/packages/shopify-app-remix#authenticating-webhook-requests): Callbacks sent by Shopify when certain events occur

## Resources

- [Remix Docs](https://remix.run/docs/en/v1)
- [Shopify App Remix](https://shopify.dev/docs/api/shopify-app-remix)
- [Introduction to Shopify apps](https://shopify.dev/docs/apps/getting-started)
- [App authentication](https://shopify.dev/docs/apps/auth)
- [Shopify CLI](https://shopify.dev/docs/apps/tools/cli)
- [App extensions](https://shopify.dev/docs/apps/app-extensions/list)
- [Shopify Functions](https://shopify.dev/docs/api/functions)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Cloudflare D1 Documentation](https://developers.cloudflare.com/d1/)


"@shopify/polaris": "13.9.5",

"wrangler": "^4.13.2"

 "wrangler": "3.28.2"



https://shopify.dev/docs/api/polaris/using-mcp



 npx -y @shopify/dev-mcp@latest


 {
  "mcpServers": {
    "shopify-dev-mcp": {
      "command": "npx",
      "args": ["-y", "@shopify/dev-mcp@latest"]
    }
  }



