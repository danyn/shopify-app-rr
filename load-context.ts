import { type PlatformProxy } from "wrangler";
import { initKvSessionStorage } from './app/shopify.server';

/**
 * load-context.ts
 * 
 * In a Cloudflare Workers environment. This file is responsible for setting up the 
 * request context for the Remix app's loader's and actions.
 * 
 * 
 * It is also being used to pass a reference to the KV binding into globalThis
 * This reference is used for initializing the session so that  an instance of shopifyApp is possible
 * 
 */

type GetLoadContextArgs = {
  request: Request;
  context: {
    cloudflare: Omit<PlatformProxy<Env>, "dispose" | "caches" | "cf"> & {
      caches: PlatformProxy<Env>["caches"] | CacheStorage;
      cf: Request["cf"];
    };
  };
};

declare module "@remix-run/cloudflare" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  interface AppLoadContext extends ReturnType<typeof getLoadContext> {
    // This will merge the result of `getLoadContext` into the `AppLoadContext`
  }
}

export function getLoadContext({ context }: GetLoadContextArgs) {
  /**
   *  initialize the kv store session object
   */
  if (context.cloudflare?.env?.SESSIONS_KV) {
    initKvSessionStorage(context.cloudflare.env.SESSIONS_KV);
  } else {
    throw new Error('SESSIONS_KV binding for a KV store on cloudflare is required')
  }
  return context;
}