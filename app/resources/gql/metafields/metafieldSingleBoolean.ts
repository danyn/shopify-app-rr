import { GraphqlType } from "app/resources/shared-types";
import { queryResource } from "../queryResource";


/* Write, ... */
/*
  @see https://shopify.dev/docs/api/admin-graphql/latest/mutations/metafieldsSet
*/
const UPSERT = `#graphql
mutation UpsertSingleBooleanMetafield($metafieldsSetInput: [MetafieldsSetInput!]!) {
  metafieldsSet(metafields: $metafieldsSetInput) {
    metafields {
      key
      value: jsonValue,
    }
    userErrors {
      field
      message
    }
  }
}`;

type FieldBoolean = 'true' | 'false';
type SetInput = {
  value: FieldBoolean;
  ownerId:  string; //ex. appInstallationId for appData
  namespace: string;
  key: string;
}

function setInput ({value, ownerId , namespace, key}: SetInput) {
  return {
    metafieldsSetInput : [{
      key,
      namespace,
      ownerId,
      type: "boolean",
      value,
    },] 
  } 
  
}
type SingleBooleanWriteArgs = SetInput & {
  graphql: GraphqlType; 
}

type SingleBooleanWrite = {
  metafields: Array<{
    key: string;
    value: boolean;
  }>;
};


export async function upsertSingleBooleanMetafield({value, ownerId , namespace, key, graphql}: SingleBooleanWriteArgs) {
  const metafieldsSetInput = setInput({value, ownerId , namespace, key});
  const variables = {
    ...metafieldsSetInput,
    namespace,
    key,
  }
 
  return await queryResource<SingleBooleanWrite>({ 
    on: 'metafieldsSet', 
    query: UPSERT, 
    variables, 
    mode: 'mutation', 
    graphql 
  });
}

/* Read */
const READ = `#graphql
query ReadSingleBooleanMetafield ($namespace: String!, $key: String!) {
  currentAppInstallation {
    id
    boolean_flag: metafield(namespace: $namespace, key: $key) {
      value: jsonValue
   }
 }
}`;

//query outputs on the resource key
type SingleBooleanRead =  {
  id: string; //app installation id
  boolean_flag: {
    value: boolean,
  } | null;
}


type SingleBooleanReadArgs =  {
  namespace: string;
  key: string;
  graphql: GraphqlType;
}

export async function readSingleBooleanMetafield({namespace, key, graphql}:SingleBooleanReadArgs) {
  
  return await queryResource<SingleBooleanRead>({ 
    on: 'currentAppInstallation', 
    query: READ, 
    variables: {namespace, key}, 
    mode: 'query', 
    graphql 
  });
}