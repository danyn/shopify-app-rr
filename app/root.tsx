import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import { useClientLog } from "./resources/hooks/useClientLog";
import { LoadingIndicator } from "./resources/global-components";

export default function App() {
  useClientLog();
  return (
    <html>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <link
          rel="stylesheet"
          href="/global.css"
        /> 
        <Meta />
        <Links />
      </head>
      <body>
        <Outlet />
        <ScrollRestoration />
        <Scripts />
        <LoadingIndicator/>
      </body>
    </html>
  );
}