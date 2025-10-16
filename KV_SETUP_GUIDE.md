# Shopify App KV Session Storage Setup Guide

This guide outlines the steps needed to deploy and set up the Cloudflare KV storage for Shopify session data.

## KV Namespace Setup

To create the KV namespace for session storage, run:

```sh
wrangler kv:namespace create SESSIONS_KV
```

This will output something like:
```
🌀 Creating namespace with title "cf-sf-app-0-SESSIONS_KV"
✨ Success!
Add the following to your configuration file:
kv_namespaces = [
	{ binding = "SESSIONS_KV", id = "abcdef1234567890abcdef1234567890" }
]
```

Update the `wrangler.jsonc` file with the provided ID.

## Deploy the Worker

Deploy your worker with:

```sh
wrangler deploy
```

## Testing Session Storage

You can test that the KV session storage is working by:

1. Logging into your Shopify app
2. Verifying that the sessions are being stored in the KV namespace
3. Check the logs for any errors related to session storage

## Accessing KV data in the Cloudflare Dashboard

You can view and manage your KV data in the Cloudflare Dashboard:

1. Go to the Cloudflare Dashboard
2. Navigate to Workers & Pages
3. Select your worker
4. Go to the Settings tab
5. Click on KV
6. Select your SESSIONS_KV namespace

## Removing the D1 Database Setup (Optional)

If you no longer need the D1 database for session storage, you can:

1. Keep the database binding for other app functionality
2. Consider removing the table creation for sessions in `database.server.ts`

## Troubleshooting

If you encounter issues with the KV session storage:

1. Check that the KV namespace is correctly bound in the worker
2. Verify that the namespace is being set in the `load-context.ts` file
3. Check Cloudflare logs for any errors related to KV operations
