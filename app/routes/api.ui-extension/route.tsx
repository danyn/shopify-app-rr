import { authenticate } from "app/shopify.server";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
 
/**
 * @see https://shopify.dev/docs/apps/build/admin/actions-blocks/connect-app-backend
 */
export const loader = async ({ request }:LoaderFunctionArgs) => {
  // The authenticate.admin method returns a CORS method to automatically wrap responses so that extensions, which are hosted on extensions.shopifycdn.com, can access this route.
  const { cors } = await authenticate.admin(request);


  // Get the product Id from the request
  const requestUrl = new URL(request.url);
  const productId = requestUrl.searchParams.get("productId");
 
  // Wrap the response in the CORS method so that the extension can access it
  return cors(Response.json({ productId, message: 'hello from api/ui-extension', url: requestUrl }));
};

export const action = async ({ request }:ActionFunctionArgs) => {
  // The authenticate.admin method returns a CORS method to automatically wrap responses so that extensions, which are hosted on extensions.shopifycdn.com, can access this route.
  const { cors } = await authenticate.admin(request);

  // Get the payload from the request
  try {
    const payload = await request.json()
    return cors(Response.json({ payload, message: 'hello from api/ui-extension:post' }));
  } catch (error) {
    return cors(Response.json({ error, message: 'error from from api/ui-extension:post' }));
  }
};