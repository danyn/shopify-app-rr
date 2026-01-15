import { type PlatformProxy } from "wrangler";
import { initKvSessionStorage } from './app/shopify.server';

/**
 * load-context.ts
 * 
 * In a Cloudflare Workers environment. This file is responsible for setting up the 
 * request context for the React Router app's loaders and actions.
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

export function getLoadContext({ context, request }: GetLoadContextArgs) {
  /**
   *  initialize the kv store session object
   */
  if (context.cloudflare?.env?.SESSIONS_KV) {
    initKvSessionStorage(context.cloudflare.env.SESSIONS_KV);
  } else {
    throw new Error('SESSIONS_KV binding for a KV store on cloudflare is required')
  }
  /* Return the context  */
  return context;
}

/**
  It is passing the context through to the loaders and actions
  So that they can access the variables and databases
  But the type inference is not working once in a route's loader.
  It is being called and doin the init of the session KV.
 */