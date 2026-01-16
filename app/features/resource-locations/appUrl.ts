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
    adminProductIndexNutriscore: `shopify:admin/products?metafields.${appNamespace}.nutriscore=A%2CB%2CC%2CD%2CE`,
    /**
     * Generate online store editor URL for a metaobject page
     * @param shop - Shop domain (e.g., 'my-shop.myshopify.com')
     * @param urlHandle - The urlHandle from the definition's onlineStore capability (e.g., 'pages')
     * @param metaobjectType - The metaobject type without $app: prefix (e.g., 'custom_page')
     * @param handle - The metaobject handle
     */
    metaobjectOnlineStoreEditor: ({
      shop,
      urlHandle,
      metaobjectType,
      handle,
    }: {
      shop: string;
      urlHandle: string;
      metaobjectType: string;
      handle: string;
    }) => {
      const cleanShop = shop.replace('.myshopify.com', '');
      // Construct the preview path:
      const previewPath = `/pages/${urlHandle}/${handle}`;
      return `https://admin.shopify.com/store/${cleanShop}/themes/current/editor?previewPath=${encodeURIComponent(previewPath)}`;
    },
    /**
     * Admin URL for metaobject content entries
     * @param shop - Shop domain (e.g., 'my-shop.myshopify.com')
     * @param metaobjectType - The metaobject type without $app: prefix (e.g., 'custom_page')
     */
    metaobjectContentEntries: (shop: string, metaobjectType: string) => {
      const cleanShop = shop.replace('.myshopify.com', '');
      const fullTypeName = `app--${appId}--${metaobjectType}`;
      return `https://admin.shopify.com/store/${cleanShop}/content/metaobjects/entries/${fullTypeName}`;
    }
  };
};

