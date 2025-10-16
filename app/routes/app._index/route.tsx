
import type { ActionFunctionArgs, LoaderFunctionArgs, HeadersFunction } from "react-router";
import { useActionData, useLoaderData } from "react-router";
import { boundary } from "@shopify/shopify-app-react-router/server";



import { authenticate } from "app/shopify.server";

/** every route needs this due to single fetch
 * @see https://github.com/Shopify/shopify-app-template-react-router/wiki/Upgrading-from-Remix */
export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};


export const loader = async ({ request, context }: LoaderFunctionArgs) => {
  await authenticate.admin(request);
  return null;
};


export const action = async ({ request }: ActionFunctionArgs) => {
  const { admin } = await authenticate.admin(request);
  return null;
};

export default function Index() {
  const lData = useLoaderData<typeof loader>();
  const aData = useActionData<typeof action>();
  return (
<s-page>
  <s-text>The homepage</s-text>
</s-page>
  );
}
