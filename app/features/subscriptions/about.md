
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

**Consolidated Design** - All subscription logic is centralized in the features folder:

```
app/
├── features/
│   └── subscriptions/
│       ├── index.ts                  # 🎯 Single entry point - minimal exports
│       ├── constants.ts              # Subscription definitions & namespace
│       ├── appInstallationBilling.ts # Metafield read & trial day calculations
│       ├── billingRedirect.ts        # Middleware redirect logic
│       ├── appData.ts                # Metafield upsert & synchronization
│       └── about.md                  # This documentation
│
├── routes/
│   ├── app._m/
│   │   └── route.tsx                 # Imports: billingRedirect from features
│   │
│   └── app.subscriptions/
│       └── route.tsx                 # Imports: availableIfMetafields, constants
│
extensions/
└── theme-extension/
    └── blocks/
        └── show_subscriptions.liquid # Demo block using availableIf
```

**Key Principles:**
- ✅ **Tightly coupled** - All files in `features/subscriptions/` use relative imports (`./`)
- ✅ **Minimal exports** - Only `index.ts` exports to outside world
- ✅ **Clean boundaries** - Routes import only from `features/subscriptions` index
- ✅ **Single source of truth** - All subscription logic lives in one folder

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

### Metafield Synchronization

**File:** [`appData.ts`](app/features/subscriptions/appData.ts)

**`availableIfMetafields()`** - Exported via index.ts
- Main orchestrator for metafield synchronization
- Checks if update needed via `shouldUpdate()`
- Calls `upsertMetafields()` to set feature flags

**`upsertMetafields()`** - Internal function
- Uses `metafieldsSet` GraphQL mutation
- Sets current subscription → `true`
- Sets all other subscriptions → `false`
- Enables conditional theme blocks

### Subscription Route

**File:** [`route.tsx`](app/routes/app.subscriptions/route.tsx)

**Imports from `features/subscriptions`:**
```typescript
import { 
  availableIfMetafields, 
  allAccessName, 
  starterName, 
  getCurrentTrialDays 
} from 'app/features/subscriptions';
```

#### Loader Flow:
1. Authenticate and check billing status
2. Call `availableIfMetafields()` to sync metafields
3. If `?charge_id` query param exists:
   - Insert/update D1 database with subscription details
   - Used for email reminder tracking
4. Return subillingRedirect.ts`](app/features/subscriptions/billingRedirect.ts)  
**Used by:** [`app._m/route.tsx`](app/routes/app._m/route.tsx)

**Import:**
```typescript
import { billingRedirect } from 'app/features/subscriptions';
```

#### UI Display:
- Shows current plan name and status
- Displays trial days remaining (if applicable)
- Provides "Manage plans" button → Shopify managed pricing
- Success banner when returning with `charge_id`

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
```✅ Consolidated Architecture - Current Implementation

**All subscription logic is now centralized in `features/subscriptions/`**

**Strengths:**

1. **Single Source of Truth** 🎯
   - Every subscription-related file lives in one folder
   - No navigation between routes and features to understand flow
   - Clear ownership and responsibility

2. **Tight Coupling with Clean Boundaries** 🔒
   - Internal files use relative imports (`./`)
   - External consumers import only from `index.ts`
   - Minimal public API surface - only what's needed is exported

3. **Maintainability** 🛠️
   - Add new subscription tiers: edit `constants.ts`
   - Modify billing logic: all in `features/subscriptions/`
   - No scattered updates across route folders

4. **Testability** ✅
   - Business logic isolated from React components
   - Pure functions in `appInstallationBilling.ts` and `appData.ts`
   - Mock-friendly: routes receive functions, not implementations

5. **Explicit Dependencies** 📦
   ```typescript
   // Routes import from single entry point
   import { 
     billingRedirect, 
     availableIfMetafields, 
     getCurrentTrialDays 
   } from 'app/features/subscriptions';
   ```

**File Responsibilities:**

| File | Purpose | Exports | Used By |
|------|---------|---------|---------|
| `index.ts` | Public API | Named exports only | Routes |
| `constants.ts` | Configuration | Via index.ts | Internal + Routes |
| `appInstallationBilling.ts` | Read operations | Via index.ts | Internal + Routes |
| `appData.ts` | Write operations | Via index.ts | app.subscriptions route |
| `billingRedirect.ts` | Authorization | Via index.ts | app._m route |

**Trade-offs:**

✅ **Gained:**
- Cohesive feature module
- Clear import paths
- Easy to reason about
- Future-proof for billing complexity

⚠️ **Considerations:**
- Routes still reference feature for business logic (acceptable dependency)
- Constants must stay in sync with Shopify Admin (documented requirement)ort { billingRedirect } from '../routes/app._m/billingRedirect';
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





