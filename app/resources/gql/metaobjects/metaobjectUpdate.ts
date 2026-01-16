import { queryResource } from "../queryResource";
import { MetaobjectResponse } from "../sharedTypes";

/**
 * Updates a metaobject with new field values, handle, or capabilities.
 * Useful for assigning alternate templates via the onlineStore capability.
 * 
 * @example Assign an alternate template
 * ```typescript
 * const result = await updateMetaobject(
 *   "gid://shopify/Metaobject/123",
 *   {
 *     capabilities: {
 *       onlineStore: {
 *         templateSuffix: "alternate"
 *       }
 *     }
 *   },
 *   admin.graphql
 * );
 * ```
 * 
 * @see https://shopify.dev/docs/api/admin-graphql/latest/mutations/metaobjectUpdate
 */
export async function updateMetaobject(
  id: string,
  metaobject: any,
  graphql: any
) {
  return await queryResource<MetaobjectResponse>({ 
    on: 'metaobjectUpdate',
    query: UPDATE_METAOBJECT,
    variables: { id, metaobject },
    mode: 'mutation',
    graphql,
  });
}

const UPDATE_METAOBJECT = `#graphql
  mutation UpdateMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
    metaobjectUpdate(id: $id, metaobject: $metaobject) {
      metaobject {
        id
        type
        handle
        capabilities {
          publishable {
            status
          }
          onlineStore {
            templateSuffix
          }
        }
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
