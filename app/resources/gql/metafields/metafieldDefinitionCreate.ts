import { GraphqlType, MetafieldOwnerType } from "app/resources/shared-types";
import { queryResource } from "../queryResource";
import {  } from '@shopify/admin-api-client';
// https://shopify.dev/docs/apps/build/custom-data/metafields/definitions
// https://shopify.dev/docs/apps/build/custom-data/permissions
// https://shopify.dev/docs/api/admin-graphql/latest/input-objects/metafielddefinitioninput

export type MetafieldDefinitionInput = {
  definition: {
  name: string;
  key: string;
  namespace?: string;
  description?: string | null;
  ownerType: MetafieldOwnerType;
  type: string;
  validations?: {
    name: string;
    value: string;
  }[];
  access?: {
    admin?: "MERCHANT_READ" | "MERCHANT_READ_WRITE";
    storefront?: "PUBLIC_READ" | "NONE";
  };
  standardTemplate?: {
    name: string;
  };
  capabilities?: {
    adminFilterable?: {
      enabled: boolean;
    }
    smartCollectionCondition?: {
      enabled: boolean;
    }
    uniqueValues?: {
      enabled: boolean;
    }
  }
  }
};

type T =  {
  createdDefinition: {
      id: string;
      name: string;
      namespace: string;
      key: string;
    },
    userErrors: []
  }

export async function metafieldDefinitionCreate(definition: MetafieldDefinitionInput, graphql: GraphqlType ) {
  return await queryResource<T>({
    on: 'metafieldDefinitionCreate',
    query: CREATE,
    variables: definition,
    mode: "mutation",
    graphql,
  });
}


// https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafielddefinitioncreate
const CREATE = `#graphql
mutation MetafieldDefinitionCreate($definition: MetafieldDefinitionInput!) {
  metafieldDefinitionCreate(definition: $definition) {
    createdDefinition {
      id
      name
      namespace
      key
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
  "definition": {
    "name": "Ingredients",
    "namespace": "bakery",
    "key": "ingredients",
    "description": "A list of ingredients used to make the product.",
    "type": "multi_line_text_field",
    "ownerType": "PRODUCT"
  }
}


*/ 