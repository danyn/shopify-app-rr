import { queryResource } from '../queryResource';



type MetaobjectDefinition = {
  metaobjectDefinition: {
    id: string;
    name: string;
    type: string;
    access: {
      admin: string;
      storefront: string;
    };
    fieldDefinitions: {
      name: string;
      key: string;
    }[];
  }
};


export async function metaobjectDefinitionUpdate( id: string, definition: any, graphql:any) {

  return await queryResource<MetaobjectDefinition>({ 
    on: 'metaobjectDefinitionUpdate',
    query: METAOBJECT_DEFINITION_UPDATE,
    variables: {id, definition},
    mode: 'mutation',
    graphql
  });

}

/**
 * @see https://shopify.dev/docs/api/admin-graphql/latest/mutations/metaobjectdefinitionupdate
 */
const METAOBJECT_DEFINITION_UPDATE = `#graphql
mutation MetaobjectDefinitionUpdate($id: ID!, $definition: MetaobjectDefinitionUpdateInput!) {
  metaobjectDefinitionUpdate(id: $id, definition: $definition) {
    metaobjectDefinition {
      id
      name
      displayNameKey
      fieldDefinitions {
        name
        key
        type {
          name
        }
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

/*
{
  "id": "gid://shopify/MetaobjectDefinition/578408816",
  "definition": {
    "displayNameKey": "description",
    "fieldDefinitions": [
      {
        "create": {
          "key": "description",
          "name": "Description",
          "type": "single_line_text_field"
        }
      }
    ]
  }
}

*/ 