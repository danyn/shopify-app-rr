import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { authenticate, getSessionStorage } from "app/shopify.server";
import { drizzle } from 'drizzle-orm/d1';
import { eq } from 'drizzle-orm';
import { subscriptionTracking } from 'drizzle-db/schema'

export const loader = async ({ request }: LoaderFunctionArgs) => {
  return new Response("Unauthorized", { status: 401 });
};

export const action = async ({ request, context }: ActionFunctionArgs) => {
  const { shop, session, topic } = await authenticate.webhook(request);
  const env = context.cloudflare.env as Env;

  console.log(`Received ${topic} webhook for ${shop}`);

  // Webhook requests can trigger multiple times and after an app has already been uninstalled.
  // If this webhook already ran, the session may have been deleted previously.
  if (session) {
    // Use the session storage abstraction to delete the session
    const sessionStorage = getSessionStorage();
    try {
      await sessionStorage.deleteSession(session.id);
      console.log(`Deleted session for shop: ${shop}`);
      const db_subscriptions = drizzle(env.DB_SUBSCRIPTIONS);
      await db_subscriptions
        .delete(subscriptionTracking)
        .where(eq(subscriptionTracking.shopDomain, shop));
      console.log(`Deleted subscription tracking for shop: ${shop}`);
    } catch (err) {
      console.error(`Failed to delete session for shop: ${shop}`, err);
      return new Response("Failed to delete session", { status: 500 });
    }
  }

  return new Response();
};