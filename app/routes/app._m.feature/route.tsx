import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData, HeadersFunction } from "react-router";
import { authenticate } from "../../shopify.server";


import { boundary } from "@shopify/shopify-app-react-router/server";

/** every route needs this due to single fetch
 * @see https://github.com/Shopify/shopify-app-template-react-router/wiki/Upgrading-from-Remix */
export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

export async function action({request, params}: ActionFunctionArgs) {
  const { admin, redirect } = await authenticate.admin(request);
  return {a:1};
}

export async function loader ({ request, params }: LoaderFunctionArgs) {
  const {admin, redirect } = await authenticate.admin(request);
  return {l:1};
  
};

export default function Feature() {

  const lData = useLoaderData<typeof loader>();
  const aData = useActionData<typeof action>();

  return (
<s-page>
    <h1>Feature</h1>
    <p>
      lData: {lData.l}
    </p>
</s-page>
  );
}
