import { makeGraphQLQuery } from "@local/extension-utils/graphql";
import { useLocalState } from "./state";

/**
 * Returns a handleFileUpload function that dispatches upload state to LocalState.
 * @returns {Function} handleFileUpload(files)
 */
export function useFileUpload() {
  const dispatch = useLocalState('dispatch');

  return async (files) => {
    if (!files || files.length === 0) return;

    const file = files[0];

    dispatch({ type: 'ImageUpload', payload: { type: 'uploadStart', data: {} } });

    try {
      const { fileId, url: imageUrl, width: imageWidth , height: imageHeight } = await uploadImageToShopify(file);

      dispatch({
        type: 'ImageUpload',
        payload: {
          type: 'uploadSuccess',
          data: { image: fileId, imageUrl, imageWidth, imageHeight },
        },
      });

      console.log("Image uploaded successfully:", fileId);
      console.log("Image URL:", imageUrl);
    } catch (error) {
      console.error("Error uploading image:", error);
      dispatch({
        type: 'ImageUpload',
        payload: {
          type: 'uploadError',
          data: { message: error.message || "Failed to upload image" },
        },
      });
    }
  };
}

/**
 * High-level async function to upload an image file to Shopify
 * Handles the complete 3-step workflow: staged upload → upload to S3 → create file → poll for ready
 * 
 * @param {File} file - The browser File object to upload
 * @returns {Promise<{fileId: string, status: string, url: string, width: number, height: number}>} - Returns the Shopify file GID and final status
 * @throws {Error} - Throws if any step fails
 */
async function uploadImageToShopify(file) {
  // Step 1: Create staged upload target
  const stagedTarget = await createStagedUpload(file);

  // Step 2: Upload file to staged target (S3)
  await uploadToStagedTarget(file, stagedTarget);

  // Step 3: Create file record in Shopify
  const fileId = await createShopifyFile(stagedTarget.resourceUrl, file.name);

  // Step 4: Poll until file is ready
  const { status, url, width, height } = await pollUntilReady(fileId);

  return { fileId, status, url, width, height };
}

/**
 * Creates a staged upload target via Shopify GraphQL API
 * @param {File} file - The file to get upload parameters for
 * @returns {Promise<{url: string, resourceUrl: string, parameters: Array}>}
 */
async function createStagedUpload(file) {
  const query = `
    mutation stagedUploadsCreate($input: [StagedUploadInput!]!) {
      stagedUploadsCreate(input: $input) {
        stagedTargets {
          url
          resourceUrl
          parameters {
            name
            value
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: [{
      filename: file.name,
      mimeType: file.type,
      httpMethod: "POST",
      resource: "IMAGE"
    }]
  };

  const response = await makeGraphQLQuery(query, variables);

  if (!response.data || !response.data.stagedUploadsCreate) {
    throw new Error('Invalid response from stagedUploadsCreate');
  }

  if (response.data.stagedUploadsCreate.userErrors?.length > 0) {
    throw new Error(`Staged upload failed: ${response.data.stagedUploadsCreate.userErrors[0].message}`);
  }

  const stagedTargets = response.data.stagedUploadsCreate.stagedTargets;
  if (!stagedTargets || stagedTargets.length === 0) {
    throw new Error('No staged target returned');
  }

  return stagedTargets[0];
}

/**
 * Uploads the file to the staged target URL (typically S3)
 * @param {File} file - The file to upload
 * @param {Object} stagedTarget - The staged target with URL and parameters
 * @returns {Promise<void>}
 */
async function uploadToStagedTarget(file, stagedTarget) {
  const formData = new FormData();

  // Add all parameters from staged upload response
  stagedTarget.parameters.forEach(({ name, value }) => {
    formData.append(name, value);
  });

  // Add the actual file (must be last)
  formData.append('file', file);

  const response = await fetch(stagedTarget.url, {
    method: 'POST',
    body: formData
  });

  if (!response.ok) {
    throw new Error(`File upload to staged target failed: ${response.statusText}`);
  }
}

/**
 * Creates a file record in Shopify using the staged upload
 * @param {string} resourceUrl - The resource URL from staged upload
 * @param {string} altText - Alt text for the image (using filename)
 * @returns {Promise<string>} - The Shopify file GID
 */
async function createShopifyFile(resourceUrl, altText) {
  const query = `
    mutation fileCreate($files: [FileCreateInput!]!) {
      fileCreate(files: $files) {
        files {
          id
          fileStatus
          alt
          ... on MediaImage {
            id
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    files: [{
      alt: altText,
      contentType: "IMAGE",
      originalSource: resourceUrl
    }]
  };

  const response = await makeGraphQLQuery(query, variables);

  if (response.errors?.length > 0) {
    throw new Error(`File create failed: ${response.errors[0].message}`);
  }

  if (!response.data || !response.data.fileCreate) {
    throw new Error('Invalid response from fileCreate');
  }

  if (response.data.fileCreate.userErrors?.length > 0) {
    throw new Error(`File create failed: ${response.data.fileCreate.userErrors[0].message}`);
  }

  const files = response.data.fileCreate.files;
  if (!files || files.length === 0) {
    throw new Error('No files returned from fileCreate');
  }

  const fileData = files[0];
  if (!fileData?.id) {
    throw new Error('File creation did not return a file ID');
  }

  return fileData.id;
}

/**
 * Polls the file status until it's READY or FAILED
 * @param {string} fileId - The Shopify file GID to check
 * @param {number} maxAttempts - Maximum polling attempts (default: 30)
 * @param {number} intervalMs - Interval between polls in milliseconds (default: 2000)
 * @returns {Promise<{status: string, url: string, width: number, height: number}>}
 */
async function pollUntilReady(fileId, maxAttempts = 30, intervalMs = 2000) {
  const query = `
    query CheckFileStatus($id: ID!) {
      node(id: $id) {
        ... on MediaImage {
          fileStatus
          image {
            url
            width
            height
          }
        }
      }
    }
  `;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const response = await makeGraphQLQuery(query, { id: fileId });

    if (!response.data || !response.data.node) {
      throw new Error('Invalid response when checking file status');
    }

    const status = response.data.node.fileStatus;
    const url = response.data.node.image?.url || null;
    const width = response.data.node.image?.width || null;
    const height = response.data.node.image?.height || null;

    if (status === 'READY') {
      return { status: 'READY', url, width, height };
    }

    if (status === 'FAILED') {
      throw new Error('File processing failed');
    }

    // Wait before next poll
    await sleep(intervalMs);
  }

  throw new Error('File processing timeout - exceeded maximum polling attempts');
}

/**
 * Sleep utility for polling delays
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Get the image URL for a file GID
 * @param {string} fileId - The Shopify file GID
 * @returns {Promise<string|null>} - The image URL or null
 */
async function getImageUrl(fileId) {
  const query = `
    query GetImageUrl($id: ID!) {
      node(id: $id) {
        ... on MediaImage {
          image {
            url
          }
        }
      }
    }
  `;

  try {
    const response = await makeGraphQLQuery(query, { id: fileId });
    return response.data?.node?.image?.url || null;
  } catch (error) {
    console.error('Error fetching image URL:', error);
    return null;
  }
}
