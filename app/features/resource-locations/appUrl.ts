type Param = {
  appId: string;
  appHandle: string;
}

/**
 * This is a place to store all the app urls in one place
 * It also constructs urls to point to resorces inside the Shopify admin
 */
export function getAppUrl ({appId, appHandle} : Param ) {

  if(!appId || !appHandle) {
    throw new Error('Missing required environment variables: SHOPIFY_APP_ID and SHOPIFY_APP_HANDLE');
  }
  const appNamespace = `app--${appId}`;

  return {
    home: '/app',
    tables: '/app/tables',
    metafieldTable: (id: string) => `/app/tables/${id}`,
    subscriptions: '/app/subscriptions',
    pricingPlans: `https://admin.shopify.com/charges/${appHandle}/pricing_plans`,
    m: 'routes/app._m',
    adminProductIndexNutriscore: `shopify:admin/products?metafields.${appNamespace}.nutriscore=A%2CB%2CC%2CD%2CE`
  };
};

