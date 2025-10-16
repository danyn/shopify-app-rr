import { authenticate } from "../../shopify.server";

// Shopify 
type AdminReturn = Awaited<ReturnType<typeof authenticate.admin>>;

export type BillingType = AdminReturn['billing'];
export type RedirectType = AdminReturn['redirect'];
export type GraphqlType = AdminReturn['admin']['graphql'];

export type MetafieldOwnerType = "API_PERMISSION"  | "ARTICLE"  | "BLOG"  | "CARTTRANSFORM"  | "COLLECTION"  | "COMPANY"  | "COMPANY_LOCATION"  | "CUSTOMER"  | "DELIVERY_CUSTOMIZATION"  | "DISCOUNT"  | "DRAFTORDER"  | "FULFILLMENT_CONSTRAINT_RULE"  | "GIFT_CARD_TRANSACTION"  | "LOCATION"  | "MARKET"  | "ORDER"  | "ORDER_ROUTING_LOCATION_RULE"  | "PAGE"  | "PAYMENT_CUSTOMIZATION"  | "PRODUCT"  | "PRODUCTVARIANT"  | "SELLING_PLAN"  | "SHOPS"  | "VALIDATION";

// namespace can defaults to $app
export type MetafieldIdentifier = {
  identifier: {ownerType: MetafieldOwnerType, namespace?: string, key: string}
}


export type SubscriptionSubfields = {
  createdAt: string;  //2025-08-05T18:07:45Z Z - Zulu time indicator (means UTC/GMT timezone)
  trialDays: number;
  status: "ACTIVE" | "CANCELLED" | "PENDING" | "DECLINED" | "EXPIRED" | "FROZEN" | "ACCEPTED";
}