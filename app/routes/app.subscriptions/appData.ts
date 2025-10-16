import { queryResource } from "app/resources/gql/queryResource";
import { subscriptions, namespace, } from "app/features/subscriptions/constants";
import { appMetafieldRead, shouldUpdate } from "app/features/subscriptions/appInstallationBilling";

/**
 * * @description 
 * This function retrieves the appInstallation which is a resource for storing metafields on.
 * It then checks that there is metafield to indicate which plan is selected.
 * This metafield is a feature flag used for the availableIf property in liquid schema
 * When there a many plans it sets the flags for the current one to true and all the others to false.
 * @see https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration#conditional-app-blocks
 * @see https://shopify.dev/docs/apps/build/custom-data/ownership#step-2-create-an-app-data-metafield
 * 
 */
export async function availableIfMetafields(graphql: any, subscriptionName: string) {
  const appInstallation = await appMetafieldRead({
    graphql,
  });

  if(!appInstallation?.resource) {
    throw new Response("App installation not available", {
      status: 500,
    });
  }

  if(shouldUpdate(subscriptionName, appInstallation.resource)) {
    const upserted = await upsertMetafields(graphql, subscriptionName, appInstallation?.resource?.id);
    return { appInstallation, upserted, }
  }
  return { appInstallation, upserted: null, };
}

async function upsertMetafields(graphql: any, subscriptionName: string, ownerId: string) {
  const variables = getMetafieldSetInput(subscriptionName, ownerId);

  return await queryResource({ 
    on: 'metafieldsSet', 
    query: UPSERT, 
    variables, 
    mode: 'mutation', 
    graphql 
  });
}
/*
@description:
Set all metafields that are for featureFlags (avialableIf: liquid schema)
Set the feature flag for the current subscription to true and set all others to false.
How:
while iterating through the known subscription types
compare againts the current subscription name from billing
*/
function getMetafieldSetInput(subscriptionName: string, ownerId: string) {
  const metafieldsSetInput = subscriptions.map(el => {
    return {
      key: el.key,
      namespace,
      ownerId,
      type: "boolean",
      value: el.name === subscriptionName ? 'true' : 'false',
    }
  });

 return {
    metafieldsSetInput,
  };
}

/*
  @see https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsSet
*/
const UPSERT = `#graphql
mutation UpsertSubscriptionMetafields($metafieldsSetInput: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafieldsSetInput) {
    metafields {
      key
      value: jsonValue,
    }
    userErrors {
      field
      message
    }
  }
}`;

