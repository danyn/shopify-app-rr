This is a for a middleware route call _m that protects against two things:
1) makes sure there is a subscription
2) make sure the appInstallation metafields are storing the right featureFlag 

Redirects are used to place the mutations in one route as apposed to this route which affects all routes

the redirect is to: app.subscriptions (not affected by the middleware _m)

Note:
if there is only one subscription plan the app could just request billing right away:
https://shopify.dev/docs/api/shopify-app-remix/v2/apis/billing?example=require-requesting-billing-right-away
These docs were written before shopify hosted billing and they don't acknowledge it.
Most of the functions still work but the config in shopify.server.ts does not make sense any more along with do mention of how to redirect to the hosted page.
This app is using shopify hosted billing its set in the admin
Managed Pricing
https://shopify.dev/docs/apps/launch/billing/managed-pricing

