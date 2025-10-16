
import { queryResource } from "../queryResource";
// https://shopify.dev/docs/api/admin-graphql/latest/objects/MetaobjectDefinition
type GetMetaobjectDefinitionId = {
  id: string;
  name: string;
  type: string;
  metaobjectsCount: number;
};

export async function getMetaobjectDefinitionId(type:string, graphql:any) {
  return await queryResource<GetMetaobjectDefinitionId>({ 
    on: 'metaobjectDefinitionByType', 
    query: GET_METAOBJECT_DEFINITION_ID, 
    variables: {type,}, 
    mode: 'query', 
    graphql
  });
}


const GET_METAOBJECT_DEFINITION_ID = `#graphql
query MetaobjectDefinitionByType($type: String!) {
  metaobjectDefinitionByType(type:$type) {
    id
    name
    type
    metaobjectsCount
  }
}
`;


