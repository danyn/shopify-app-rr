
# Subscription Feature Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture & File Structure](#architecture--file-structure)
3. [Process Flow](#process-flow)
4. [Core Components](#core-components)
   - [Constants Configuration](#constants-configuration)
   - [Billing Check & Metafield Management](#billing-check--metafield-management)
   - [Subscription Route](#subscription-route)
   - [Billing Redirect Middleware](#billing-redirect-middleware)
   - [Theme Extension Integration](#theme-extension-integration)
5. [Data Flow Diagram](#data-flow-diagram)
6. [Design Evaluation](#design-evaluation)
7. [References](#references)

---

## Overview

This subscription feature implements a comprehensive billing system for a Shopify app using **managed pricing**. The system orchestrates three key Shopify concepts:

1. **App Subscriptions** - Billing API handles subscription lifecycle
2. **AppInstallation Metafields** - Store subscription state as feature flags
3. **Theme Extension Conditionals** - Control block visibility based on subscription

The feature ensures that:
- Users cannot access app features without an active subscription
- Theme extension blocks are conditionally available based on subscription tier
- Subscription state is tracked in a D1 database for email reminders
- Trial days are accurately calculated in real-time

---

## Architecture & File Structure

```
app/
├── features/
│   └── subscriptions/
│       ├── constants.ts              # Subscription definitions & namespace
│       ├── appInstallationBilling.ts # Metafield read/validation logic
│       └── about.md                  # This documentation
│
├── routes/
│   ├── app._m/
│   │   ├── route.tsx                 # Middleware wrapper
│   │   └── billingRedirect.ts        # Redirect logic for missing subscriptions
│   │
│   └── app.subscriptions/
│       ├── route.tsx                 # Subscription management UI
│       └── appData.ts                # Metafield upsert logic
│
extensions/
└── theme-extension/
    └── blocks/
        └── show_subscriptions.liquid # Demo block using availableIf
```

---

## Process Flow

### Flow Logic: Complete Subscription Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│ USER NAVIGATES TO APP                                           │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 1. MIDDLEWARE: app._m/route.tsx (EVERY protected route)        │
│    - Calls billingRedirect()                                    │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 2. BILLING CHECK: billingRedirect.ts                           │
│    ├─ billing.check() → Get active subscriptions               │
│    ├─ appMetafieldRead() → Get app metafields                  │
│    │                                                             │
│    └─ Decision Tree:                                            │
│       ├─ NO subscription? → Redirect to managed pricing page    │
│       ├─ Metafield missing? → Redirect to /app/subscriptions   │
│       └─ All valid? → Allow access, return billing info         │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3A. IF REDIRECT: Shopify Managed Pricing Page                  │
│     User selects plan → Shopify handles payment                │
│     → Returns to app with ?charge_id=xyz                        │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 3B. IF REDIRECT: /app/subscriptions route.tsx                  │
│     - Loader runs availableIfMetafields()                       │
│     - Sets proper metafield flags for subscription              │
│     - Saves to D1 database (if charge_id present)              │
│     - Shows subscription confirmation UI                        │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 4. METAFIELD UPDATE: appData.ts                                │
│    ├─ shouldUpdate() checks if current subscription flag=true  │
│    └─ upsertMetafields() via metafieldsSet mutation:            │
│       - Sets current subscription metafield → true              │
│       - Sets all other subscription metafields → false          │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 5. THEME EXTENSION: Blocks become available                    │
│    Liquid checks: {{ app.metafields.subscription.all_access }} │
│    "available_if" in schema conditionally shows blocks          │
└─────────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────────┐
│ 6. ONGOING: Trial Days Calculation                             │
│    getCurrentTrialDays() dynamically calculates remaining days  │
│    from createdAt timestamp                                     │
└─────────────────────────────────────────────────────────────────┘
```

---

## Core Components

### Constants Configuration

**File:** [`constants.ts`](app/features/subscriptions/constants.ts)

Defines all subscription tiers that must match **exactly** with Shopify's managed pricing configuration:

```typescript
export const namespace = 'subscription';
export const subscriptions = [
  { key: 'monthly', name: 'Monthly' },
  { key: 'yearly', name: 'Yearly' },
  { key: 'starter', name: 'Starter' },
  { key: 'all_access', name: 'All Access' }
];
```

**Critical:** Any changes to subscription names in Shopify Admin must be synchronized here.

---

### Billing Check & Metafield Management

**File:** [`appInstallationBilling.ts`](app/features/subscriptions/appInstallationBilling.ts)

#### Key Functions:

**`appMetafieldRead()`**
- Queries `currentAppInstallation` for all subscription metafields
- Returns boolean flags indicating which plan is active
- Uses namespace and keys from constants

**`shouldUpdate()`**
- Compares current subscription name with metafield state
- Returns `true` if the metafield for current subscription ≠ `true`
- Ensures metafields stay synchronized with billing state

**`getCurrentTrialDays()`**
- Calculates remaining trial days dynamically
- Formula: `trialDays - daysSinceCreated`
- Guards against invalid dates/null subscriptions

---

### Subscription Route

**File:** [`route.tsx`](app/routes/app.subscriptions/route.tsx)

#### Loader Flow:
1. Authenticate and check billing status
2. Call `availableIfMetafields()` to sync metafields
3. If `?charge_id` query param exists:
   - Insert/update D1 database with subscription details
   - Used for email reminder tracking
4. Return subscription data + app URLs

#### UI Display:
- Shows current plan name and status
- Displays trial days remaining (if applicable)
- Provides "Manage plans" button → Shopify managed pricing
- Success banner when returning with `charge_id`

**File:** [`appData.ts`](app/routes/app.subscriptions/appData.ts)

**`availableIfMetafields()`**
- Main orchestrator for metafield synchronization
- Checks if update needed via `shouldUpdate()`
- Calls `upsertMetafields()` to set feature flags

**`upsertMetafields()`**
- Uses `metafieldsSet` GraphQL mutation
- Sets current subscription → `true`
- Sets all other subscriptions → `false`
- Enables conditional theme blocks

---

### Billing Redirect Middleware

**File:** [`app._m/route.tsx`](app/routes/app._m/route.tsx) + [`billingRedirect.ts`](app/routes/app._m/billingRedirect.ts)

This middleware protects ALL routes under `app._m.*`:

#### Redirect Logic:

**Step A:** No subscription exists
```typescript
if (!subscription && shouldAct) 
  throw redirect(appUrl.pricingPlans, { target: '_top' });
```
→ Sends user to Shopify's managed pricing page

**Step B:** Subscription exists but metafield not set
```typescript
if (shouldUpdate(subscriptionName, appInstallation.resource) && shouldAct) 
  throw redirect(appUrl.subscriptions);
```
→ Sends user to `/app/subscriptions` to complete setup

**Step C:** Everything valid
→ Returns billing information, allows access to protected routes

---

### Theme Extension Integration

**File:** [`show_subscriptions.liquid`](extensions/theme-extension/blocks/show_subscriptions.liquid)

Demonstrates how to use subscription metafields in theme blocks:

```liquid
{{ app.metafields.subscription.all_access }}  <!-- true/false -->
{{ app.metafields.subscription.starter }}     <!-- true/false -->
```

**Conditional Block Example:**
```json
{
  "name": "Premium Feature Block",
  "available_if": "{{ app.metafields.subscription.all_access }}",
  "target": "section"
}
```

Only merchants with "All Access" subscription can add this block to their theme.

---

## Data Flow Diagram

```
┌──────────────────┐
│  Shopify Billing │ ← Managed Pricing Configuration
│      API         │    (External: Shopify Partner Dashboard)
└────────┬─────────┘
         │
         │ billing.check()
         ↓
┌──────────────────┐
│  billingRedirect │ ← Middleware on app._m routes
│  (Entry Point)   │
└────────┬─────────┘
         │
         ├─→ appMetafieldRead() → currentAppInstallation metafields
         │                        (namespace: 'subscription')
         │
         └─→ Decision: redirect or proceed
                │
                ↓ (if needs setup)
         ┌──────────────────┐
         │ app.subscriptions│
         │     route        │
         └────────┬─────────┘
                  │
                  ├─→ availableIfMetafields()
                  │      │
                  │      └─→ upsertMetafields()
                  │             │
                  │             └─→ GraphQL: metafieldsSet
                  │                    ↓
                  │           ┌─────────────────────┐
                  │           │ AppInstallation     │
                  │           │ ├─ all_access: true │
                  │           │ ├─ starter: false   │
                  │           │ ├─ monthly: false   │
                  │           │ └─ yearly: false    │
                  │           └─────────────────────┘
                  │
                  └─→ D1 Database Insert (subscriptionTracking)
                         │
                         └─→ Used for email reminders
                         
                  
┌──────────────────────────────────────┐
│ Theme Extension (Storefront)         │
│ Liquid queries:                      │
│ {{ app.metafields.subscription.* }}  │
│                                      │
│ Blocks appear/disappear based on     │
│ availableIf condition                │
└──────────────────────────────────────┘
```

---

## Design Evaluation

### Current Architecture: Split Design

**Pros:**
- ✅ **Clear separation of concerns** - Features vs Routes vs Extensions
- ✅ **Reusable logic** - `appInstallationBilling.ts` and `appData.ts` are pure functions
- ✅ **Testable** - Business logic isolated from React components
- ✅ **Scalable** - Easy to add new subscription tiers in `constants.ts`
- ✅ **Middleware pattern** - Billing checks happen automatically via `app._m`

**Cons:**
- ⚠️ **Fragmented context** - Need to navigate 3+ files to understand full flow
- ⚠️ **Tight coupling** - Constants must be synchronized with Shopify Admin
- ⚠️ **Hidden dependencies** - `appData.ts` imports from `appInstallationBilling.ts`

### Recommendation: **Keep the Current Split Design** ✅

**Reasoning:**

1. **Domain-Driven Structure**: The split mirrors real-world boundaries:
   - `features/subscriptions/` = Business logic & data access
   - `routes/app.subscriptions/` = UI presentation & user interaction
   - `routes/app._m/` = Cross-cutting concern (middleware)

2. **Single Responsibility**: Each file has one job:
   - `constants.ts` → Configuration
   - `appInstallationBilling.ts` → Read operations
   - `appData.ts` → Write operations
   - `billingRedirect.ts` → Authorization
   - `route.tsx` → Presentation

3. **React Router Best Practices**: Follows the framework's conventions for route-specific code vs shared features.

4. **Future Maintenance**: When subscription logic grows (e.g., usage-based billing, proration), the feature folder can expand without bloating route files.

### Design Improvement Suggestions:

If consolidation is desired, create a **facade pattern**:

```typescript
// app/features/subscriptions/index.ts
export * from './constants';
export * from './appInstallationBilling';
export { availableIfMetafields } from '../routes/app.subscriptions/appData';
export { billingRedirect } from '../routes/app._m/billingRedirect';
```

This provides a single import point while maintaining file separation:
```typescript
import { availableIfMetafields, getCurrentTrialDays } from 'app/features/subscriptions';
```

---

## References

- **Managed Pricing**: https://shopify.dev/docs/apps/launch/billing/managed-pricing
- **App Data Metafields**: https://shopify.dev/docs/apps/build/custom-data/ownership#app-data-metafields
- **AppInstallation API**: https://shopify.dev/docs/api/admin-graphql/latest/objects/AppInstallation
- **Conditional App Blocks**: https://shopify.dev/docs/apps/build/online-store/theme-app-extensions/configuration#conditional-app-blocks
- **metafieldsSet Mutation**: https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsSet





