import { GraphqlType, MetafieldIdentifier } from "app/resources/shared-types";
import { queryResource } from "../queryResource";


type ResourceData = {
  metafieldDefinitionDelete: {
    deletedDefinitionId: string;
    userErrors: {
      field?: string[];
      message: string;
      code?: string;
    }[];
  };
};

type Args = {
  identifier: MetafieldIdentifier;
  deleteAllAssociatedMetafields: boolean;
  graphql: GraphqlType;
}

export async function  metafieldDefinitionDelete({identifier, deleteAllAssociatedMetafields, graphql}: Args ) {
  return await queryResource<ResourceData>({
     on: 'metafieldDefinitionDelete', 
     query: DELETE, 
     variables: {...identifier, deleteAllAssociatedMetafields}, 
     mode: 'mutation', 
     graphql 
  });
}

const DELETE = `#graphql
mutation MetafieldDefinitionDelete($identifier: MetafieldDefinitionIdentifierInput!, $deleteAllAssociatedMetafields: Boolean!) {
  metafieldDefinitionDelete(identifier: $identifier, deleteAllAssociatedMetafields: $deleteAllAssociatedMetafields) {
    deletedDefinitionId
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
  "id": "gid://shopify/MetafieldDefinition/1071456130",
  "deleteAllAssociatedMetafields": true
}
*/