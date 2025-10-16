import { queryResource } from '../queryResource';


type MetaobjectDefinitionCreate = {
  metaobjectDefinition: {
    id: string;
    name: string;
    type: string;  
  } | null;
  userErrors: {
    field: string[];
    message: string;
    code: string;
  }[];
};


export async function metaobjectDefinitionCreate( definition: any, graphql:any) {

  return await queryResource<MetaobjectDefinitionCreate>({ 
    on: 'metaobjectDefinitionCreate',
    query: METAOBJECT_DEFINITION_CREATE,
    variables: definition,
    mode: 'mutation',
    graphql
  });

}


/**
@see https://shopify.dev/docs/api/admin-graphql/latest/mutations/metaobjectDefinitionCreate
@see https://shopify.dev/docs/apps/build/custom-data/ownership
*/
const METAOBJECT_DEFINITION_CREATE = `#graphql
mutation MetaobjectDefinitionCreate($definition: MetaobjectDefinitionCreateInput!) {
  metaobjectDefinitionCreate(definition: $definition) {
    metaobjectDefinition {
      id
      name
      type
    }
    userErrors {
      field
      message
      code
    }
  }
}`;


