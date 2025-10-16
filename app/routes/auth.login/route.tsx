import { useState } from "react";
import type { ActionFunctionArgs, LoaderFunctionArgs } from "react-router";
import { Form, useActionData, useLoaderData } from "react-router";

import { AppProvider } from "@shopify/shopify-app-react-router/react";

import { login } from "../../shopify.server";

import { loginErrorMessage } from "./error.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));

  return { errors };
};

export const action = async ({ request }: ActionFunctionArgs) => {
  const errors = loginErrorMessage(await login(request));

  return {
    errors,
  };
};

export default function Auth() {
  const loaderData = useLoaderData<typeof loader>();
  const actionData = useActionData<typeof action>();
  const [shop, setShop] = useState("");
  const { errors } = actionData || loaderData;

  return (
    <AppProvider embedded={false}>
      <s-page>
        <s-section>
          <Form method="post">
            {/* <s-for> */}
              <s-text type="strong">
                Log in
              </s-text>
              <s-text-field
                details="Login with you shop"
                name="shop"
                label="Shop domain"
                placeholder="example.myshopify.com"
                value={shop}
                onChange={()=>{setShop}}
                autocomplete="name"
                error={errors.shop}
              />
              <s-button type="submit">Log in</s-button>
            {/* </> */}
          </Form>
        </s-section>
      </s-page>
    </AppProvider>
  );
}
