import type { LoaderFunctionArgs } from "react-router";
import { Outlet, useLoaderData, HeadersFunction } from "react-router";
import { authenticate } from "app/shopify.server";
import { ShouldRevalidateFunction } from "react-router";
import { billingRedirect } from "~/features/subscriptions";
import { boundary } from "@shopify/shopify-app-react-router/server";

/** every route needs this due to single fetch
 * @see https://github.com/Shopify/shopify-app-template-react-router/wiki/Upgrading-from-Remix */
export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

/**
 * @description always rerun this loader
 */
export const shouldRevalidate: ShouldRevalidateFunction = () => {
  return true;
};

export async function loader ({ request, params, context }: LoaderFunctionArgs) {
  const {admin, redirect, billing } = await authenticate.admin(request);
  const billingInformation =  await billingRedirect(billing, redirect, admin.graphql, context.cloudflare.env);
  return {billingInformation,}
};

/**
 * This is a 'middleware' route across its <Outlet/>
 * If single fetch is not enabled this route's loader is not guaranteed to finish first
 * However it will still return before the templates are rendered
 * @see https://remix.run/docs/en/main/file-conventions/routes#nested-layouts-without-nested-urls
 */
export default function M() {
  return <Outlet/>
}
