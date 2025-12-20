import type { ActionFunctionArgs, LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useLoaderData } from "react-router";
import { authenticate } from "../../shopify.server";
import { getAppUrl } from "app/features/resource-locations/appUrl";
import { availableIfMetafields } from "./appData";
import { allAccessName, starterName } from "app/features/subscriptions/constants";
import { getCurrentTrialDays } from "app/features/subscriptions/appInstallationBilling";
import { subscriptionTracking } from 'drizzle-db/schema'
import { drizzle } from 'drizzle-orm/d1';
import { boundary } from "@shopify/shopify-app-react-router/server";

/** every route needs this due to single fetch
 * @see https://github.com/Shopify/shopify-app-template-react-router/wiki/Upgrading-from-Remix */
export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};


export async function action({ request, params, context }: ActionFunctionArgs) {
  const { billing } = await authenticate.admin(request);

  //@ts-ignore
  const billingCheck = await billing.check();
  const subscription = billingCheck.appSubscriptions?.[0];

  // const cancelledSubscription
  return await billing.cancel({
    subscriptionId: subscription.id,
    isTest: true,
    prorate: true,
  });
}

export async function loader({ request, context, params }: LoaderFunctionArgs) {
  // Get charge_id from query parameters
  const url = new URL(request.url);
  const chargeId = url.searchParams.get('charge_id');

  const { admin, redirect, billing, session } = await authenticate.admin(request);

  const billingCheck = await billing.check();
  const subscription = billingCheck?.appSubscriptions?.[0];
  const appInstallation = await availableIfMetafields(admin.graphql, subscription?.name);

  if (appInstallation.appInstallation.hasErrors.signal) {
    throw new Response('Cannot read from the app installation. Please check network connections and try refreshing your browser.')
  }

  /* Keep track of when people subscribe using D1 in order to send a reminder email */
  if (chargeId) {
    const db_subscriptions = drizzle(context.cloudflare.env.DB_SUBSCRIPTIONS);
    type Subscriber = typeof subscriptionTracking.$inferInsert;
    const entry: Subscriber = {
      shopifySubscriptionId: subscription.id,
      shopDomain: session.shop,
      name: subscription.name,
      status: subscription.status,
      trialDays: subscription.trialDays,
      createdAt: subscription.createdAt, // ISO-8601
      chargeId,
    }
    /*
      Upsert the table entry. If the shopDomain is new create a new record
      If the shopDomain exists replace all the values with 'entry'.
      Each shop only has one entry in the table. 
      On uninstall webhook we need to remove the entry.
    */ 
    await db_subscriptions
      .insert(subscriptionTracking)
      .values(entry)
      .onConflictDoUpdate({
        target: subscriptionTracking.shopDomain,
        set: entry
      });
  }

  const appUrl = getAppUrl({ appId: context.cloudflare.env?.SHOPIFY_APP_ID, appHandle: context.cloudflare.env?.SHOPIFY_APP_HANDLE });
  return { billingCheck, subscription, chargeId, appInstallation, appUrl }
};

export default function Subscription() {

  const L = useLoaderData<typeof loader>();


  const subscription = L.subscription;
  let name, status, titleText, trialDays;


  if (subscription) {
    // TODO
    status = subscription?.status;
    name = subscription?.name;
    // trialDays = lData.subscription?.trialDays;
    trialDays = getCurrentTrialDays(subscription);

  }
  if (!L.billingCheck?.hasActivePayment) {
    titleText = "Please select a plan"
  } else if (subscription) {
    if (name) {
      titleText = `You are on the ${name} plan. ${L.chargeId ? '🎉' : ''}`

    }
  }
  //todo what is 'status'


  return (
    <s-page heading="Plans">
      <s-box border="none" padding="large">
        <s-banner
          tone="info"
          heading={titleText}
        >
          <s-box border="none" padding="none none small none">
            {
              !L.billingCheck?.hasActivePayment &&
              <s-paragraph>
                We’ve got you covered — start free, grow with Hobby, or go Pro.
              </s-paragraph>
            }
            {
              name === starterName && !!!L.chargeId &&
              <s-paragraph> Your plan is currently limited to Nutriscores. Upgrade to All Access for unlimited use.</s-paragraph>
            }
            {
              L.chargeId &&
              <s-paragraph>Thank you for subscribing to Tidy Product Blocks! Your plan is now active. If you have any questions or need help, we're here for you. Enjoy!</s-paragraph>
            }
            {
              name === allAccessName && trialDays &&
              <s-paragraph> There are {trialDays} {trialDays === 1 ? 'day' : 'days'}  left in the free trial</s-paragraph>
            }
          </s-box>
          <s-button variant="secondary"
            href={L.appUrl?.pricingPlans}
            target="_top"
          >
            Manage plans
          </s-button>
        </s-banner>
      </s-box>
    </s-page>
  );
}

// https://github.com/Shopify/shopify-app-template-react-router/wiki/Upgrading-from-Remix
// https://admin.shopify.com/store/tidy-product-blocks-test-store/charges/tidy-product-blocks/pricing_plans"

// https://shopify.dev/docs/api/app-home/polaris-web-components


// secondaryAction={
//   L.billingCheck?.hasActivePayment ?
//   {content: 'Cancel', onAction:()=>{ submit(true, {method:"POST"})}} :
//   undefined
// }