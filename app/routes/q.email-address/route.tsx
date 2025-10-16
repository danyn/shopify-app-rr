import type { ActionFunctionArgs } from "react-router";
import { unauthenticated } from "app/shopify.server";

interface EmailLookupRequest {
  shopDomains: string[];
}

interface ShopEmailInfo {
  to: string;    // Shop's email address
  name: string;  // Shop's name
}

interface EmailLookupResponse {
  recipients: ShopEmailInfo[];
}

interface ErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}

/**
 * Creates a JSON response with appropriate headers
 */
function jsonResponse(data: EmailLookupResponse | ErrorResponse, status: number): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' }
  });
}

/** 
 * Endpoint to fetch email addresses and names for a list of Shopify shops.
 * Requires authentication token and accepts an array of shop domains.
 * Returns a filtered list of valid shop email addresses and names.
 */
export async function action({ request, context }: ActionFunctionArgs) {
  // Validate authentication token

  const authToken = request.headers.get('Authorization');

  if (authToken !== `Bearer ${context.cloudflare.env.EMAIL_ADDRESS_TOKEN}`) {
    return jsonResponse({
      error: "Unauthorized access",
      code: "UNAUTHORIZED"
    }, 401);
  }

  // Parse and validate request body
  let requestData: EmailLookupRequest;
  try {
    requestData = await request.json();
  } catch {
    return jsonResponse({
      error: "Invalid JSON in request body",
      code: "INVALID_JSON"
    }, 400);
  }

  const { shopDomains } = requestData;
  
  // Validate shopDomains is an array
  if (!Array.isArray(shopDomains)) {
    return jsonResponse({
      error: "shopDomains must be an array",
      code: "INVALID_TYPE",
      details: {
        expected: "array",
        received: typeof shopDomains
      }
    }, 400);
  }

  // Validate shopDomains is not empty
  if (shopDomains.length === 0) {
    return jsonResponse({
      error: "shopDomains array cannot be empty",
      code: "EMPTY_ARRAY"
    }, 400);
  }

  // Fetch email information for each shop domain in parallel
  const shopEmailQueries = shopDomains.map(async (shopDomain: string) => {
    try {
      const { admin } = await unauthenticated.admin(shopDomain);
      const shopQuery = await admin.graphql(`
        #graphql
        query ShopEmailLookup {
          shop {
            name
            email
          }
        }
      `);
      
      const shopData = await shopQuery.json();
      const shopEmail = shopData.data.shop.email;
      const shopName = shopData.data.shop.name;

      return shopEmail && shopName ? { to: shopEmail, name: shopName } : null;
    } catch (error) {
      console.error(`Failed to fetch email for shop ${shopDomain}:`, error);
      return null;
    }
  });

  // Wait for all queries to complete and filter out failed lookups
  const emailLookupResults = await Promise.all(shopEmailQueries);
  const recipients = emailLookupResults.filter((result): result is ShopEmailInfo => result !== null);

  // Return successful response with valid email information
  // There may be a silent error because of null values 
  
  return jsonResponse({
    recipients,
  }, 200);
}

// old route name q.subscriptions