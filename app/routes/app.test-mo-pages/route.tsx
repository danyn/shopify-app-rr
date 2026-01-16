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
  // TODO: Handle metaobject settings actions
  return { success: true };
}

export async function loader ({ request, params }: LoaderFunctionArgs) {
  const {admin, redirect } = await authenticate.admin(request);
  // TODO: Load metaobject settings configurations
  return { 
    configurations: [],
    timestamp: new Date().toISOString() 
  };
};

export default function TestMetaobjectPages() {
  const lData = useLoaderData<typeof loader>();
  const aData = useActionData<typeof action>();

  return (
    <s-page>
      <h1>Test Metaobject Pages</h1>
      <p>Use this route to test various configurations for metaobject settings</p>
      <div>
        <h2>Loader Data</h2>
        <pre>{JSON.stringify(lData, null, 2)}</pre>
      </div>
      {aData && (
        <div>
          <h2>Action Data</h2>
          <pre>{JSON.stringify(aData, null, 2)}</pre>
        </div>
      )}
    </s-page>
  );
}
