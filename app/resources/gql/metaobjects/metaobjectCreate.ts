import { queryResource } from "../queryResource";
import { MetaobjectResponse } from "../sharedTypes";

export async function createMetaobject(metaobject:any, graphql:any){
  return await queryResource<MetaobjectResponse>({ 
    on: 'metaobjectCreate',
    query: CREATE_METAOBJECT,
    variables: {metaobject},
    mode: 'mutation',
    graphql,
  })
}

/**
 * @see https://shopify.dev/docs/api/admin-graphql/2024-07/mutations/metaobjectCreate
 */
const CREATE_METAOBJECT = `#graphql
  mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
    metaobjectCreate(metaobject: $metaobject) {
      metaobject {
          id
          type
          handle
          title: field(key: "title") {
            value
          }
          fields {
            jsonValue
            value
            type
            key
          }
        }
      
      userErrors {
        field
        message
        code
      }
    }
  }
  `;