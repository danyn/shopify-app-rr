import type { LoaderFunctionArgs } from "react-router";
import { Form, useLoaderData, useNavigate, redirect } from "react-router";
import { login } from "../../shopify.server";
import { AppProvider } from "@shopify/shopify-app-react-router/react";

const APP_NAME = "Shopify App Template - Cloudflare Workers";
const APP_HANDLE = "cf-worker-shopify";


export const loader = async ({ request }: LoaderFunctionArgs) => {
  const url = new URL(request.url);

  if (url.searchParams.get("shop")) {
    throw redirect(`/app?${url.searchParams.toString()}`);
  }

  return { showForm: Boolean(login) };
};

export default function App() {
  const { showForm } = useLoaderData<typeof loader>();
  const navigate = useNavigate();

  const handlePrivacyPolicyClick = () => {
    navigate('/privacypolicy');
  };

  return (
  <AppProvider>
    <s-page heading="Shopify App Template">
      <s-box border="none" padding="large">
        <s-stack  gap="large">
          {/* Welcome Card */}
          <s-box border="base" padding="large">
            <s-stack  gap="large">
              <s-heading>Welcome to Shopify App Template - Cloudflare Workers</s-heading>
              <div style={{ 
                textAlign: 'center',
                padding: '20px 0'
              }}>
                <a href="https://deploy.workers.cloudflare.com/?url=https://github.com/gruntlord5/cloudflare-worker-shopifyd1/">
                  <img src="https://deploy.workers.cloudflare.com/button" alt="Deploy to Cloudflare"/>
                </a>
              </div>
              <s-paragraph>
                This is an example of what your domain would look like if a user visits from outside of Shopify App Bridge. You can customize this page to your liking, just make sure to enter the
                 information for your application and remove this placeholder.
              </s-paragraph>
              <s-paragraph>
                Just enter your shopify domain below and click log in. For example{' '}
                <s-link href="https://admin.shopify.com/apps/some-app/app">
                  example-store.myshopify.com
                </s-link>.
              </s-paragraph>
            </s-stack>
          </s-box>

          {/* Login Form Card */}
          {showForm && (
            <s-box border="base" padding="large">
              <s-stack  gap="large">
                <s-heading>Login to your Shopify store</s-heading>
                <Form method="post" action="/auth/login">
                  <s-stack gap="large">
                    <s-text-field
                      label="Shop domain"
                      name="shop"
                      help-text="e.g: example-store.myshopify.com"
                      auto-complete="off"
                    />
                    <s-button variant="primary" type="submit">
                      Log in
                    </s-button>
                  </s-stack>
                </Form>
              </s-stack>
            </s-box>
          )}

          {/* Privacy Policy Link Card */}
          <s-box border="base" padding="large">
            <s-paragraph>
              For information about how we handle your data, please review our{' '}
              <s-link onClick={handlePrivacyPolicyClick}>
                Privacy Policy
              </s-link>
              .
            </s-paragraph>
          </s-box>
        </s-stack>
      </s-box>
    </s-page>
  </AppProvider>
  );
}