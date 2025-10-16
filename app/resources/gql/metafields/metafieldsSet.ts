import { queryResource } from "../queryResource";
import { Metafield, MetafieldTypes, UserError } from "../sharedTypes";

type MetafieldSetInput = {
  metafieldsSetInput: {
    namespace: string;
    key: string;
    type: MetafieldTypes;
    value: string;
    ownerId: string;
  }[];
};


type MetafieldsSetResource = {
  metafields: Metafield[];
  userErrors: UserError[];
  key?: string; /* optional for surfacing a needed metaobject key */
};


export async function  metafieldsSet(metafieldSetInput: MetafieldSetInput, graphql: any) {
  return await queryResource<MetafieldsSetResource>({
    on: 'metafieldsSet', 
    query: METAFIELDS_SET, 
    variables: metafieldSetInput, /* appInstallationId */
    mode: 'mutation', 
    graphql
  });
}


/**
 * @description put an array of up to 25 metafields at once.
 * @see https://shopify.dev/docs/api/admin-graphql/2024-07/mutations/metafieldsSet
 */
const METAFIELDS_SET = `#graphql 
  mutation MetafieldsSet($metafieldsSetInput: [MetafieldsSetInput!]!) {
    metafieldsSet(metafields: $metafieldsSetInput) {
      metafields {
        id
        namespace
        key
        value
        description
        ownerType
        definition {
          ownerType
          type {
            category
            name
          }
        }
      }
      userErrors {
        field
        message
      }
    }
  }
  `;
  
  
  
  /*
  vars:
  {
    "metafieldsSetInput": [
      {
        "namespace": "secret_keys",
        "key": "api_key",
        "type": "single_line_text_field",
        "value": "aS1hbS1hLXNlY3JldC1hcGkta2V5Cg==",
        "ownerId": "gid://shopify/AppInstallation/3"
      }
    ]
  }
  */