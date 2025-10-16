import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { useLoaderData, useActionData } from "react-router";
import { authenticate } from "../../shopify.server";
// import { Page,} from "@shopify/polaris";

// import { json } from "@remix-run/node";
// https://remix.run/docs/en/main/utils/data

/**
--------
https://v2.remix.run/docs/guides/single-fetch/#type-inference/

Without Single Fetch, any plain JavaScript object returned from a loader or action is automatically serialized into a JSON response (as if you returned it via json). The type inference assumes this is the case and infers naked object returns as if they were JSON serialized.

With Single Fetch, naked objects will be streamed directly, so the built-in type inference is no longer accurate once you have opted-into Single Fetch. For example, they would assume that a Date would be serialized to a string on the client 😕... 

enable single fetch types
https://v2.remix.run/docs/guides/single-fetch/#enable-single-fetch-types

------

so  what the issue is this
single fetch is the new way but it really only starts in v3
some one said we should be ready and deprecated the json() function in v2
single fetch works in this app, but it changes how the _m route behaved and throws a 401 on client side navigation if a redirect is thrown
This infers that the shopify package is throwing the auth error but I don't exactly know why.

not using single fetch is smarter if this app is stuck in v2 of remix which is where the shopify app template for remix is stuck at probably because no one cares.

IF YOU NEED TO RETURN A CUSTOM HEADER OR RESPONSE CODE 
you can still use json()
if you do the verbose call and return a fetch Response()
it does not complain
that is more transparent but it looks messy after a while which is why
json() exists

single fetch aggregates so obviously it would be a lot harder to do 
if routes were all returning fetch Responses()
*/

type UserInput = { 
  title: string;
}

export async function action({request, params}: ActionFunctionArgs) {
  const { admin, redirect } = await authenticate.admin(request);
  
  return {a:1};


}

export async function loader ({ request, params }: LoaderFunctionArgs) {
  const {admin, redirect } = await authenticate.admin(request);
  return {l:1};
};

export default function MyPage() {

  const lData = useLoaderData<typeof loader>();
  const aData = useActionData<typeof action>();

  return (
<s-page>
    My Page
</s-page>
  );
}
