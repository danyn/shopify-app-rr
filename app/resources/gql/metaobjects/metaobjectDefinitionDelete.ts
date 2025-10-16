import { queryResource } from '../queryResource';

type MetaobjectDefinitionDelete = {
  "deletedId": string;
  "userErrors": any[] 
}

export async function metaobjectDefinitionDelete(id: string, graphql:any) {
  return await queryResource<MetaobjectDefinitionDelete>({ 
    on: 'metaobjectDefinitionDelete',
    query: METAOBJECT_DEFINITION_DELETE,
    variables: {id},
    mode: 'mutation',
    graphql
  });
}

const METAOBJECT_DEFINITION_DELETE = `#graphql
mutation MetaobjectDefinitionDelete($id: ID!) {
  metaobjectDefinitionDelete(id: $id) {
    deletedId
    userErrors {
      field
      message
      code
    }
  }
}
`;






