export const namespace = 'subscription';

export const monthlyName = 'Monthly';
export const monthlyKey = 'monthly';
export const yearlyName = 'Yearly';
export const yearlyKey = 'yearly';
export const starterName = 'Starter';
export const starterKey = 'starter';
export const allAccessName = 'All Access'
export const allAccessKey = 'all_access';

/**
 * @description Stores appData metafield constants for subscriptions. 
 * key is always the same as the billing item handle but with '_' for '-'
 * name is always the billing item name (as set in the admin)
 * This means any changes in the admin must be made here as well
 * all settings made here:
 * https://shopify.dev/docs/apps/launch/billing/managed-pricing
 * are re-entered here exactly.
 *  redirect url
 *  subscriptions -> app.subscriptions
 */

export const subscriptions = [
  {
    key: monthlyKey,
    name: monthlyName
  },
  {
    key: yearlyKey,
    name: yearlyName
  },
  {
    key: allAccessKey,
    name: allAccessName
  },
  {
    key: starterKey,
    name: starterName
  }
]



/*
Examples:
export const monthlyName = 'Monthly';
export const monthlyKey = 'monthly';
export const yearlyName = 'Yearly'
export const yearlyKey = 'yearly';

export const starterName = 'Starter';
export const starterKey = 'starter';
export const allAccessName = 'All Access'
export const allAccessKey = 'all_access';
export const subscriptions = [
  {
    key: allAccessKey,
    name: allAccessName
  },
  {
    key: starterKey,
    name: starterName
  },...
]
 */
