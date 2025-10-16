import { UserErrors } from "./sharedTypes";

type QueryResourceArgs = {
  on: string;
  query: string;
  variables: any;
  mode: Mode;
  graphql: any;
};

type HasErrors = {
  signal: boolean;
  graphError: boolean;
  graphErrors: any[] | null;
  userError: boolean;
  userErrors: UserErrors | null;
  caught: boolean;
  reason?: string;
  on?: string;
  formError?: {
    code: string; 
    message:string;
  };
}

type QueryResource<T> = {
  resource: T | null;
  hasErrors: HasErrors;
  mode?: string;
  on?: string;
}

type Mode = 'query' | 'mutation';

// @todo this should be removed in favor of autocomplete on the type above
export const mode = {
  query: 'query',
  mutate: 'mutation',
}

/**
@description
 Return the resource from a graphql query.
 Provide userErrors and catch GraphQLErrors.
 userErrors can exist in the resource while GraphQLErrors are only placed inside of hasErrors.
 'on' is the resource name.
  await queryResource<MainRatingMetaobject> pass the type alias of the resource 'on' 
 */
// export async function queryResource({ on, query, variables, mode, graphql }: QueryResourceArgs): Promise<Resource> {
export async function queryResource<T>({
   on, 
   query, 
   variables, 
   mode, 
   graphql 
  }: QueryResourceArgs): Promise<QueryResource<T>> {


  try {
    /* Pass the query and the query variables to a shopify gql client */
    const request = await graphql(query, {variables});

    /* await async request.json() method of the request interface
    *  @see https://developer.mozilla.org/en-US/docs/Web/API/Request/json
    */
    const requested = await request.json();

    const resource : T  = requested?.data?.[on];

    return {
      resource,
      hasErrors: hasErrors({
        mode,
        // @ts-ignore
        userErrors: resource?.userErrors,
        caught: false,
        on,
      }),
      mode,
      on,
    };
  } catch(err: any) {
    const graphErrors : any = err?.body?.errors?.graphQLErrors || null;

    return {
      resource: null,
      hasErrors: hasErrors({
        mode,
        graphErrors,
        caught: true,
        on,
      }),
      mode,
      on,
    }
  }
}
// caughtNonGqlError: !graphQlErrors ? err.toString() : undefined,

/**
 * If there is an error confirm an array and provide some boolean conditions
 */
type hasErrorsArgs = {
  mode: Mode;
  userErrors?: any[];
  graphErrors?: any[];
  caught: boolean;
  on: string;
}

function hasErrors({mode, userErrors=[], graphErrors=[], caught=false, on=""}: hasErrorsArgs) : HasErrors {
  let graphError = false;
  let userError = false;

  if(mode==='mutation' && Array.isArray(userErrors)) userError = userErrors.length > 0;
  if(Array.isArray(graphErrors)) graphError = graphErrors.length > 0;

  return {
    signal: graphError || userError || caught,
    graphError,
    graphErrors: graphError ? graphErrors : null,
    userError,
    userErrors: userError ? userErrors : null,
    caught,
    on,
  }
}
