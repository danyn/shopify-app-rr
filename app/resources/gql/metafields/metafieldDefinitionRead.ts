
import { MetafieldIdentifier } from "app/resources/shared-types";
import { queryResource } from "../queryResource";
// https://shopify.dev/docs/api/admin-graphql/latest/objects/MetaobjectDefinition
type GetMetaobjectDefinitionId = {
  id: string;
  name: string;
  metafieldsCount: number;
};



export async function getMetafieldDefinitionId(identifier: MetafieldIdentifier , graphql:any) {
  return await queryResource<GetMetaobjectDefinitionId>({ 
    on: 'metafieldDefinition', 
    query: GET_METAFIELD_DEFINITION_ID, 
    variables: identifier, 
    mode: 'query', 
    graphql
  });
}


const GET_METAFIELD_DEFINITION_ID  = `#graphql
query MetafieldDefinitionByIdentifier($identifier: MetafieldDefinitionIdentifierInput!) {
  metafieldDefinition(identifier:$identifier ) {
    id
    name
    metafieldsCount
  }
}
`

/*

{"identifier": {"ownerType": "PRODUCT", "namespace": "custom", "key": "nutriscore_1"}}

*/