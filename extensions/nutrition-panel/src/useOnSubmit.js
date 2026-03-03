import { makeGraphQLQuery } from "@local/extension-utils/graphql";
import { useLocalState } from "./state";

/**
 * Builds the metaobject fields array for nutrition data.
 * @param {Object} nutritionData - The nutrition data object
 * @param {string} [productId] - Optional product ID for create operations (adds product_reference field)
 * @returns {Array} Array of field objects with key/value pairs
 */
function buildNutritionFields(nutritionData, productId = null) {
  const fields = [
    { key: "name", value: nutritionData.name },
    { key: "calories", value: String(nutritionData.calories) },
    { key: "protein", value: String(nutritionData.protein) },
    { key: "carbs", value: String(nutritionData.carbs) },
    ...(nutritionData.image ? [{ key: "image", value: nutritionData.image }] : []),
  ];

  if (productId) {
    fields.push({ key: "product_reference", value: productId });
  }

  return fields;
}

async function createNutritionData(productId, nutritionData) {
  const fields = buildNutritionFields(nutritionData, productId);

  console.log('Creating metaobject with fields:', JSON.stringify(fields, null, 2));

  const createRes = await makeGraphQLQuery(
    `mutation CreateMetaobject($metaobject: MetaobjectCreateInput!) {
      metaobjectCreate(metaobject: $metaobject) {
        metaobject {
          id
          handle
        }
        userErrors {
          field
          message
          code
        }
      }
    }`,
    {
      metaobject: {
        type: "$app:nutrition_panel",
        capabilities: {
          publishable: {
            status: "ACTIVE"
          }
        },
        fields: fields,
      }
    }
  );

  console.log('metaobjectCreate response:', JSON.stringify(createRes, null, 2));

  const metaobjectId = createRes?.data?.metaobjectCreate?.metaobject?.id;
  if (!metaobjectId) {
    const errors = createRes?.data?.metaobjectCreate?.userErrors;
    throw new Error(`Failed to create metaobject: ${JSON.stringify(errors)}`);
  }

  const metafieldRes = await makeGraphQLQuery(
    `mutation SetMetafield($metafields: [MetafieldsSetInput!]!) {
      metafieldsSet(metafields: $metafields) {
        metafields {
          id
          namespace
          key
          value
        }
        userErrors {
          field
          message
          code
        }
      }
    }`,
    {
      metafields: [{
        ownerId: productId,
        namespace: "$app",
        key: "nutrition_panel",
        type: "metaobject_reference",
        value: metaobjectId,
      }]
    }
  );

  console.log("Metafield set response:", JSON.stringify(metafieldRes, null, 2));

  if (metafieldRes?.data?.metafieldsSet?.userErrors?.length > 0) {
    console.error("Metafield errors:", metafieldRes.data.metafieldsSet.userErrors);
    throw new Error(`Metafield errors: ${JSON.stringify(metafieldRes.data.metafieldsSet.userErrors)}`);
  }

  return createRes;
}

async function updateNutritionData(metaobjectId, nutritionData) {
  const fields = buildNutritionFields(nutritionData);

  console.log('Updating metaobject with fields:', JSON.stringify(fields, null, 2));

  return await makeGraphQLQuery(
    `mutation UpdateMetaobject($id: ID!, $metaobject: MetaobjectUpdateInput!) {
      metaobjectUpdate(id: $id, metaobject: $metaobject) {
        metaobject {
          id
          handle
        }
        userErrors {
          field
          message
          code
        }
      }
    }`,
    {
      id: metaobjectId,
      metaobject: {
        capabilities: {
          publishable: {
            status: "ACTIVE"
          }
        },
        fields: fields,
      }
    }
  );
}

function validateForm(nutritionData) {
  const errors = {};

  if (!nutritionData.name || nutritionData.name.trim() === "") {
    errors.name = true;
  }

  if (nutritionData.calories === null || nutritionData.calories === undefined || nutritionData.calories < 0) {
    errors.calories = true;
  }

  if (nutritionData.protein === null || nutritionData.protein === undefined || nutritionData.protein < 0) {
    errors.protein = true;
  }

  if (nutritionData.carbs === null || nutritionData.carbs === undefined || nutritionData.carbs < 0) {
    errors.carbs = true;
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
}

/**
 * Returns an onSubmit function that reads state from LocalState, validates and saves.
 * @param {string} productId
 * @param {Function} close
 * @returns {Function} onSubmit()
 */
export function useOnSubmit(productId, close) {
  const state = useLocalState('state');
  const dispatch = useLocalState('dispatch');

  return async () => {
    const nutritionData = {
      id: state.id,
      name: state.FormInputs.name,
      calories: state.FormInputs.calories,
      protein: state.FormInputs.protein,
      carbs: state.FormInputs.carbs,
      image: state.ImageUpload.image,
      imageUrl: state.ImageUpload.imageUrl,
    };

    const { isValid, errors } = validateForm(nutritionData);
    dispatch({
      type: 'FormInputs',
      payload: { type: 'setErrors', data: { errors: isValid ? null : errors } },
    });

    if (isValid) {
      try {
        dispatch({ type: 'setSaving', payload: { saving: true } });
        console.log("Saving nutrition data:", nutritionData);
        if (nutritionData.id) {
          console.log(`update ${nutritionData.name}`);
          await updateNutritionData(nutritionData.id, nutritionData);
        } else {
          await createNutritionData(productId, nutritionData);
        }
        close();
      } catch (error) {
        console.error("Error saving nutrition data:", error);
        dispatch({ type: 'setSaving', payload: { saving: false } });
      }
    }
  };
}
