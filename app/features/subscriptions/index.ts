/**
 * Subscription Feature - Centralized Export
 * 
 * This module provides a single entry point for all subscription-related functionality.
 * All business logic for billing, metafields, and subscription state management is
 * tightly coupled within this feature folder.
 * 
 * @module features/subscriptions
 */

// ============================================================================
// CONSTANTS - Subscription configuration that must match Shopify Admin
// ============================================================================
export { 
  namespace,
  allAccessName, 
  allAccessKey,
  starterName, 
  starterKey,
  monthlyName,
  monthlyKey,
  yearlyName,
  yearlyKey,
} from './constants';

// ============================================================================
// BILLING & METAFIELD OPERATIONS - Core subscription logic
// ============================================================================

/**
 * Reads app installation metafields to check subscription status
 * Used by: billingRedirect, availableIfMetafields
 */
export { appMetafieldRead } from './appInstallationBilling';

/**
 * Calculates remaining trial days dynamically from subscription createdAt
 * Used by: app.subscriptions route
 */
export { getCurrentTrialDays } from './appInstallationBilling';

// ============================================================================
// ROUTE-SPECIFIC FUNCTIONS - Exported for route handlers only
// ============================================================================

/**
 * Middleware function that protects routes by checking billing status
 * and redirecting to pricing or subscription setup if needed
 * Used by: app._m route (middleware)
 */
export { default as billingRedirect } from './billingRedirect';

/**
 * Syncs app installation metafields with current subscription state
 * Sets feature flags for conditional theme blocks (availableIf)
 * Used by: app.subscriptions route
 */
export { availableIfMetafields } from './appData';
