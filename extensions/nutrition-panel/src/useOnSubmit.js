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
    ...(nutritionData.nutrition_details ? [{ key: "nutrition_details", value: nutritionData.nutrition_details }] : []),
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
 * Save translations for a metaobject
 * @param {string} resourceId - The metaobject GID
 * @param {string} locale - The locale to save translations for
 * @param {Object} translations - Object with field keys and translated values
 */
async function saveTranslations(resourceId, locale, translations) {
  // First, get digest values from translatableResources
  const digestQuery = `#graphql
    query getDigests($resourceId: ID!) {
      translatableResource(resourceId: $resourceId) {
        translatableContent {
          key
          digest
          locale
        }
      }
    }
  `;

  const digestResponse = await makeGraphQLQuery(digestQuery, {
    resourceId,
  });

  const digestMap = {};
  digestResponse?.data?.translatableResource?.translatableContent?.forEach(content => {
    digestMap[content.key] = content.digest;
  });

  // Build translation inputs
  const translationInputs = Object.entries(translations)
    .filter(([key, value]) => value && value.trim())
    .map(([key, value]) => ({
      key,
      value,
      locale,
      translatableContentDigest: digestMap[key],
    }));

  if (translationInputs.length === 0) {
    return;
  }

  // Register translations
  const mutation = `#graphql
    mutation translationsRegister($resourceId: ID!, $translations: [TranslationInput!]!) {
      translationsRegister(resourceId: $resourceId, translations: $translations) {
        userErrors {
          message
          field
        }
        translations {
          key
          value
          locale
        }
      }
    }
  `;

  const response = await makeGraphQLQuery(mutation, {
    resourceId,
    translations: translationInputs,
  });

  if (response?.data?.translationsRegister?.userErrors?.length > 0) {
    const errorMsg = response.data.translationsRegister.userErrors[0].message;
    throw new Error(`Translation error: ${errorMsg}`);
  }

  console.log('Translations saved:', response?.data?.translationsRegister?.translations);
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
      nutrition_details: state.FormInputs.nutrition_details,
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
        
        let metaobjectId = nutritionData.id;
        
        if (metaobjectId) {
          console.log(`update ${nutritionData.name}`);
          await updateNutritionData(metaobjectId, nutritionData);
        } else {
          const result = await createNutritionData(productId, nutritionData);
          metaobjectId = result?.data?.metaobjectCreate?.metaobject?.id;
        }

        // Save translations if any exist for current locale
        const { selectedLocale, locales } = state.RegionSelector;
        const defaultLocale = locales?.find(l => l.primary)?.locale || 'en';
        const { currentLocaleTranslations } = state.TranslationModule;
        
        if (metaobjectId && selectedLocale && selectedLocale !== defaultLocale && Object.keys(currentLocaleTranslations).length > 0) {
          console.log('Saving translations for locale:', selectedLocale);
          await saveTranslations(metaobjectId, selectedLocale, currentLocaleTranslations);
        }

        close();
      } catch (error) {
        console.error("Error saving nutrition data:", error);
        dispatch({ type: 'setSaving', payload: { saving: false } });
      }
    }
  };
}
