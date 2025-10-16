export type UserError = {
  field: string[];
  message: string;
  code: string;
};
export type UserErrors = UserError[];

export type Metafield = {
  id: string;
  namespace: string;
  key: string;
  value: string; // often a stringified JSON array/object
  description: string | null;
  ownerType: "API_PERMISSION" | string;
  definition: any | null; // can be typed more specifically if you know the shape
};

export type MetafieldTypes = "single_line_text_field" | "multi_line_text_field" | "json" | "number_integer" | "number_decimal" | "date" | "file_reference" | string;

type MetaobjectField = {
  jsonValue: any | null;
  value: string | null;
  type: MetafieldTypes;
  key: string;
};

type MetaobjectTitle = {
  value: string;
};

export type Metaobject = {
  id: string;
  type: string;
  handle: string;
  title: MetaobjectTitle;
  fields: MetaobjectField[];
};

export type MetaobjectResponse = {
  metaobject: Metaobject;
  userErrors: any[];
};
