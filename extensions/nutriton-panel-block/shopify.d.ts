import '@shopify/ui-extensions';

//@ts-ignore
declare module './src/BlockExtension.jsx' {
  const shopify: import('@shopify/ui-extensions/admin.product-details.block.render').Api;
  const globalThis: { shopify: typeof shopify };
}

//@ts-ignore
declare module './src/useNutritionData.js' {
  const shopify: import('@shopify/ui-extensions/admin.product-details.block.render').Api;
  const globalThis: { shopify: typeof shopify };
}

//@ts-ignore
declare module './src/state.js' {
  const shopify: import('@shopify/ui-extensions/admin.product-details.block.render').Api;
  const globalThis: { shopify: typeof shopify };
}

//@ts-ignore
declare module './src/components.jsx' {
  const shopify: import('@shopify/ui-extensions/admin.product-details.block.render').Api;
  const globalThis: { shopify: typeof shopify };
}

//@ts-ignore
declare module './src/stateDefault.js' {
  const shopify: import('@shopify/ui-extensions/admin.product-details.block.render').Api;
  const globalThis: { shopify: typeof shopify };
}
