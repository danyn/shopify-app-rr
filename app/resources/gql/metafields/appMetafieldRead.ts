import { queryResource } from "../queryResource";

/**
 * @description Get a metafield that belongs to the app installation using namespace and key
 * @see https://shopify.dev/docs/apps/build/custom-data/ownership#app-data-metafields
 * @see https://shopify.dev/docs/api/admin-graphql/latest/objects/AppInstallation
 */
export async function appMetafieldRead<T = AppMetafield>(namespace: string, key: string, graphql: any){
  return await queryResource<T>({ 
    on: 'currentAppInstallation', 
    query: APP_METAFIELD_READ, 
    variables: {namespace, key}, 
    mode: 'query',
    graphql,
  }); 
}

const APP_METAFIELD_READ = `#graphql
query AppMetafield  ($namespace: String!, $key: String!) {
  currentAppInstallation {
    id
    metafield(key: $key, namespace: $namespace) {
      id
      value
      jsonValue
    }
  }
}
`;

type AppMetafield =  {
  id: string;
  metafield: {
    id : string;
    value: string;
    jsonValue: any;
  }
}
