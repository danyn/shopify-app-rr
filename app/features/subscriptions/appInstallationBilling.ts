import { namespace, allAccessKey, starterKey, monthlyKey, yearlyKey } from "./constants";
import { queryResource } from "../../resources/gql/queryResource";
import { handleize } from "../../resources/utils";
import { SubscriptionSubfields } from "app/resources/shared-types";

//query
const APP_METAFIELD_READ = `#graphql
query AppMetafield  ($namespace: String!, $all_access_key: String!, $starter_key: String!, $monthly: String!,  $yearly:String!) {
  currentAppInstallation {
    id
    all_access: metafield(namespace: $namespace, key: $all_access_key) {
      value: jsonValue
    }
    starter: metafield(namespace: $namespace, key: $starter_key) {
      value: jsonValue
    }
    monthly: metafield(namespace: $namespace, key: $monthly) {
      value: jsonValue
    }
    yearly: metafield(namespace: $namespace, key: $yearly) {
      value: jsonValue
    }
  }
}
`;



//query outputs on the resource key
export type AppInstallationBilling =  {
  id: string; //app installation id
  all_access: {
    value: boolean,
  }
  starter: {
    value: boolean,
  }
  monthly: {
    value: boolean,
  }
  yearly: {
    value: boolean,
  }
}


type AppMetafieldReadArgs = {
  graphql: any;
}

/**
 * @description Get metafields that belongs to the app installation using namespace and key
 * @see https://shopify.dev/docs/apps/build/custom-data/ownership#app-data-metafields
 * @see https://shopify.dev/docs/api/admin-graphql/latest/objects/AppInstallation
 */
export async function appMetafieldRead<T = AppInstallationBilling>({graphql} : AppMetafieldReadArgs){
  return await queryResource<T>({ 
    on: 'currentAppInstallation', 
    query: APP_METAFIELD_READ, 
    variables: {namespace, all_access_key: allAccessKey, starter_key: starterKey, monthly: monthlyKey, yearly: yearlyKey}, 
    mode: 'query',
    graphql,
  }); 
}


/**
 * 
 * @param subscriptionName 
 * @param appInstallation 
 * @description take the current subscription name and make sure there is a metafield on the appInstallation that has the same name
 */
export function shouldUpdate(subscriptionName: string, appInstallation: AppInstallationBilling) {
  // This strictly requires that the name is always reducible to the handle because the api does not return the handle
  // And the graph queries are using the handle for consistency
  let subscriptionHandle = handleize(subscriptionName);
  //@ts-ignore
  let currentBool = appInstallation?.[subscriptionHandle]?.value;
  if(currentBool !== true) return true
  return false;
}




/**
 * TODO RUN TESTS AGAINST THIS FUNCTION
 * @description: 
 * trial days and createdAt are both static values like a receipt at that time.
 * trialDays do not update.
 * Use the current time in UTC milliseconds to update the trial days displayed to users
 * 
 */
export function getCurrentTrialDays(subscription: SubscriptionSubfields ) {
  // Guard against undefined/null subscription
  if (!subscription?.trialDays || subscription.status !== 'ACTIVE') {
    return 0;
  }
  
  // Guard against invalid createdAt
  if (!subscription.createdAt) {
    return 0;
  }
  
  try {
    const createdAt = new Date(subscription.createdAt);
    
    // Guard against invalid date
    if (isNaN(createdAt.getTime())) {
      return 0;
    }
    
    const now = new Date();
    const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
    
    return Math.max(0, subscription.trialDays - daysSinceCreated);
  } catch (error) {
    // Fallback for any unexpected date parsing errors
    console.warn('Error calculating trial days:', error);
    return 0;
  }
}




/*
const APP_METAFIELD_READ = `#graphql
query AppMetafield  ($namespace: String!, $all_access_key: String!, $starter_key: String!) {
  currentAppInstallation {
    id
    all_access: metafield(namespace: $namespace, key: $all_access_key) {
      value: jsonValue
    }
    starter: metafield(namespace: $namespace, key: $starter_key) {
      value: jsonValue
    }
  }
}
`;
*/