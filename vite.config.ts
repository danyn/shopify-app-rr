import { defineConfig, type UserConfig } from "vite";
import { reactRouter } from "@react-router/dev/vite";
// import { cloudflareDevProxyVitePlugin } from "@react-router/dev";
import { cloudflareDevProxy } from "@react-router/dev/vite/cloudflare";

import tsconfigPaths from "vite-tsconfig-paths";
import { getLoadContext } from "./load-context";

// EXAMPLE from cloudflare: https://github.com/Minder-Solutions/remix-starter-template/blob/main/vite.config.ts


// This is for creating the right type inferences when single-fetch is enabled
// https://v2.remix.run/docs/guides/single-fetch/#enable-single-fetch-types
/** 
declare module "@remix-run/cloudflare" {
  interface Future {
    v3_singleFetch: true;
  }
}
*/

// Handle Shopify environment variables
if (
  process.env.HOST &&
  (!process.env.SHOPIFY_APP_URL ||
    process.env.SHOPIFY_APP_URL === process.env.HOST)
) {
  process.env.SHOPIFY_APP_URL = process.env.HOST;
  delete process.env.HOST;
}

const host = new URL(process.env.SHOPIFY_APP_URL || "http://localhost")
  .hostname;

let hmrConfig;
if (host === "localhost") {
  hmrConfig = {
    protocol: "ws",
    host: "localhost",
    port: 64999,
    clientPort: 64999,
  };
} else {
  hmrConfig = {
    protocol: "wss",
    host: host,
    port: parseInt(process.env.FRONTEND_PORT!) || 8002,
    clientPort: 443,
  };
}

export default defineConfig({
  server: {
    allowedHosts: [host],
    cors: {
      preflightContinue: true,
    },
    port: Number(process.env.PORT || 3000),
    hmr: hmrConfig,
    fs: {
      allow: ["app", "node_modules"],
    },
  },
  plugins: [
    cloudflareDevProxy({
      // environment: "development",
      getLoadContext,
    }),
    reactRouter(),
    tsconfigPaths(),
  ],
  ssr: {
    resolve: {
      conditions: ["workerd", "worker", "browser"],
    },
  },
  resolve: {
    mainFields: ["browser", "module", "main"],
  },
  build: {
    minify: true,
    assetsInlineLimit: 0,
  },
  optimizeDeps: {
    include: 
    ["@shopify/app-bridge-react", 
      // "@shopify/polaris"
    ],
  },
}) satisfies UserConfig;

// https://chatgpt.com/c/68b5e286-1400-8327-8cd0-f222b9ccc534