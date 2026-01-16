import { createMetaobject } from "../../../resources/gql/metaobjects/metaobjectCreate";
import { createValidHandle, generateRandomSuffix } from "../../../resources/utils/index.js";

/**
 * Metaobject type identifier for nutrition panels
 */
export const METAOBJECT_TYPE = "$app:nutrition_panel";

/**
 * Create a metaobject with custom handle and retry logic for duplicates
 * @param metaobjectData - Metaobject data to create
 * @param titleFieldValue - Title value to use for handle generation
 * @param graphql - GraphQL client
 * @returns Created metaobject resource, errors, and handle info
 */
export async function createMetaobjectWithRetry(metaobjectData: any, titleFieldValue: string, graphql: any) {
  const { handle: baseHandle, warnings } = createValidHandle(titleFieldValue);
  
  console.log(`Attempting to create metaobject with handle: "${baseHandle}"`, {
    originalTitle: titleFieldValue,
    generatedHandle: baseHandle,
    warnings: warnings.length > 0 ? warnings : undefined
  });
  
  // First attempt with base handle
  let { resource, hasErrors } = await createMetaobject(
    { ...metaobjectData, handle: baseHandle },
    graphql
  );
  
  // Check if error is specifically a handle conflict
  const isTakenError = hasErrors.signal && hasErrors.userErrors?.some(
    (error) => error.code === "TAKEN" && error.field?.includes("handle")
  );
  
  if (isTakenError) {
    const randomSuffix = generateRandomSuffix();
    const retryHandle = `${baseHandle}-${randomSuffix}`;
    
    console.log(`Handle conflict detected for "${baseHandle}", retrying with suffix: "${retryHandle}"`);
    
    // Retry with random suffix
    const retryResult = await createMetaobject(
      { ...metaobjectData, handle: retryHandle },
      graphql
    );
    
    if (retryResult.hasErrors.signal) {
      console.error(`Failed to create metaobject even with retry handle "${retryHandle}":`, retryResult.hasErrors);
    } else {
      console.log(`Successfully created metaobject with retry handle: "${retryHandle}"`);
    }
    
    return {
      ...retryResult,
      handleInfo: {
        originalHandle: baseHandle,
        finalHandle: retryHandle,
        wasRetried: true,
        warnings
      }
    };
  }
  
  // Check for other handle-related validation errors
  const hasHandleValidationError = hasErrors.signal && hasErrors.userErrors?.some(
    (error) => (error.code === "TOO_LONG" || error.code === "TOO_SHORT") && error.field?.includes("handle")
  );
  
  if (hasHandleValidationError) {
    console.error(`Handle validation error for "${baseHandle}":`, hasErrors.userErrors);
  } else if (!hasErrors.signal) {
    console.log(`Successfully created metaobject with handle: "${baseHandle}"`);
  }
  
  return {
    resource,
    hasErrors,
    handleInfo: {
      originalHandle: baseHandle,
      finalHandle: baseHandle,
      wasRetried: false,
      warnings
    }
  };
}
