# App Overview

## Architecture

- **Deployment Modes**: The app has two modes - production and development
- **Hosting**: The embedded app is a Cloudflare Worker using React Router
- **Extensions**: All `<extensions>` are completely hosted by Shopify
- **App Management**: A Shopify 'App' is a collection of settings managed at https://dev.shopify.com/dashboard/128988305/apps
- **Versioning**: Shopify apps are versioned and include extensions that are hosted by Shopify and correspond with the shopify app version

### Version Control Considerations

Version control of the app codebase can drift semantically from the version of the Shopify app in Shopify. This means version control needs principles where:

- A commit that updates extensions needs to be tagged with Shopify version it deployed to. 
- Changes in code should be aligned with Shopify deploys in the version control as a discrete block with a purpose

## Configuration

The configurations are split across multiple files and some values are repeated, the key mappings are outlined below

### 1. `shopify.app.xyz.toml`

- Defines all the app-owned data structures for metafields and objects
- Access scopes
- The API version of webhooks
- Client ID
- Application URL

### 2. `.dev.vars`

- All secret variables that should not be in version control
- Development variables that could be different than production ones

### 3. `wrangler.jsonc`

- Defines all Cloudflare-specific configuration (versions, etc.) - requires a separate README to fully document
- All the variables needed to run the Shopify packages
- Contains duplication of many Shopify variables
- Most variables used in development are in `shopify.app.toml`, but some still go in `.dev.vars` (mostly for creating redirects and links that reference the app)


## File Mappings

| wrangler.jsonc | shopify.app.toml |
|---|---|
| `SHOPIFY_API_KEY` | `client_id` |
| `SHOPIFY_API_SECRET` | n/a |
| `SHOPIFY_APP_URL` | `application_url` |
| `SHOPIFY_APP_HANDLE` | n/a |
| `SHOPIFY_APP_ID` | `client_id` |
| `SCOPES` | `scopes` |

## Starting a New App

1. Create an app at https://dev.shopify.com/dashboard/128988305/apps
2. Uncomment the vars in `wrangler.jsonc`
3. Click "Deploy to Cloudflare" in the README.md
   - This will deploy to Cloudflare, create all the variables, and set up a GitHub repo
4. Make the repo it creates Private
5. In the Cloudflare dashboard, fill in all the variables
6. Copy the variables into the `shopify.app.toml` files you want to use
