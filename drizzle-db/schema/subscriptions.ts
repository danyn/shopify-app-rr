import * as t from "drizzle-orm/sqlite-core"


export const subscriptionTracking = t.sqliteTable('subscription_tracking', {
  id: t.integer("id").primaryKey(),
  shopifySubscriptionId: t.text('shopify_subscription_id').notNull().unique(),
  chargeId: t.text('charge_id').notNull(),
  shopDomain: t.text('shop_domain').notNull().unique(),
  name: t.text('name').notNull(),
  status: t.text('status').notNull(),
  trialDays: t.integer('trial_days').notNull(),
  createdAt: t.text('created_at').notNull() // SQLite doesn't have a datetime type, so we use text and handle conversion in the app
});

