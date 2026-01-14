/**
 * Cloudflare Workers Entry Point for React Router Application
 * 
 * This is a Cloudflare Workers application (not Pages) using React Router's
 * Cloudflare adapter, which was originally designed for Cloudflare Pages.
 * We adapt the Workers interface to work with the Pages-oriented adapter.
 * 
 * Flow:
 * 1. Cloudflare Workers calls the `fetch` handler with (request, env, ctx)
 * 2. We construct an EventContext object (what the React Router adapter expects)
 * 3. The requestHandler processes it through React Router
 * 4. React Router calls our getLoadContext to set up route loader/action context
 * 5. Response is returned back to the client
 * 
 * @see https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/
 * @see https://reactrouter.com/start/framework/routing
 * @see https://developers.cloudflare.com/pages/functions/api-reference/#eventcontext
 */

import { createRequestHandler } from "@react-router/cloudflare";
import { type ServerBuild } from "react-router";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore This file won’t exist if it hasn’t yet been built
import * as build from "./build/server"; // eslint-disable-line import/no-unresolved
import { getLoadContext } from "./load-context";

/**
 * Create the React Router request handler
 * 
 * Uses React Router's Cloudflare adapter (designed for Pages) in a Workers context.
 * This creates a function that:
 * - Takes an EventContext object (what the adapter expects)
 * - Routes it through your React Router app
 * - Calls getLoadContext to provide context to your loaders/actions
 * - Returns an HTTP Response
 * 
 * Type assertions are needed because:
 * - `build` is imported from a file that doesn't exist until after compilation
 * - getLoadContext types don't perfectly align with React Router's internal types
 * 
 * These type assertions are safe and work correctly at runtime.
 * 
 * @see https://reactrouter.com/start/framework/routing#entry-server
 */

const requestHandler = createRequestHandler({ 
  build: build as any as ServerBuild,
  getLoadContext: ({ request, context }: any) => getLoadContext({ request, context })
});

/**
 * Cloudflare Workers Fetch Handler
 * 
 * This is called by Cloudflare Workers for every HTTP request.
 * It must export a default object with a `fetch` method that matches
 * the ExportedHandler<Env> interface.
 * 
 * @param request - The incoming HTTP request
 * @param env - Environment bindings (KV, D1, secrets, etc.) defined in wrangler.jsonc
 * @param ctx - Execution context with waitUntil and passThroughOnException
 * @returns HTTP Response
 * 
 * @see https://developers.cloudflare.com/workers/runtime-apis/handlers/fetch/
 */
export default {
  async fetch(request, env, ctx) {
    try {
      /**
       * Construct EventContext for React Router's Cloudflare adapter
       * 
       * React Router's Cloudflare adapter was designed for Cloudflare Pages and
       * expects a single EventContext argument. Since this is a Workers application,
       * we need to construct the EventContext from our Workers arguments.
       * 
       * EventContext properties:
       * - request: The HTTP request from Workers
       * - env: Environment bindings from Workers (SESSIONS_KV, DB_SUBSCRIPTIONS, etc.)
       * - params: Route parameters (empty here, React Router handles this internally)
       * - data: Additional context data (empty here)
       * - waitUntil: From Workers ctx - keeps Worker alive for background tasks
       * - passThroughOnException: From Workers ctx - fall through behavior
       * - next: Middleware chaining (not used in Workers context)
       * - functionPath: Pages Function path (not applicable in Workers)
       * 
       * @see https://developers.cloudflare.com/pages/functions/api-reference/#eventcontext
       */
      // Package into EventContext format expected by PagesFunction
      const eventContext = {
        request,
        env,
        params: {},
        data: {},
        waitUntil: ctx.waitUntil.bind(ctx),
        passThroughOnException: ctx.passThroughOnException.bind(ctx),
        next: async () => new Response(null),
        functionPath: '',
      };
      
      /**
       * Type assertion needed because we're adapting Workers to a Pages-oriented API.
       * The EventContext structure we construct matches what the handler expects,
       * it's just TypeScript that doesn't perfectly align the types. Works correctly at runtime.
       */
      return await requestHandler(eventContext);
    } catch (error) {
      console.log(error);
      return new Response("An unexpected error occurred", { status: 500 });
    }
  },
} satisfies ExportedHandler<Env>;
