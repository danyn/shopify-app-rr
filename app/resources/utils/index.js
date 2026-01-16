import slugify from 'slugify';

export function handleize(str) {
  if(typeof str !== 'string') return str
  return str
    .toLowerCase()                 // convert to lowercase
    .trim()                        // remove surrounding whitespace
    .replace(/[^a-z0-9\s]/g, '')   // remove non-alphanumeric characters
    .replace(/\s+/g, '_');         // replace spaces with underscores
}

/**
 * Generate a URL-friendly handle from a title using slugify
 * @param {string} title - The title to slugify
 * @returns {string} - URL-friendly handle
 */
export function generateHandle(title) {
  if (!title || typeof title !== 'string') {
    return '';
  }
  
  return slugify(title, {
    lower: true,
    strict: true,
    remove: /[*+~.()'",!:@]/g // Remove special characters
  });
}

/**
 * Generate a random alphanumeric suffix for handle uniqueness
 * @param {number} length - Length of random string (default: 6)
 * @returns {string} - Random alphanumeric string
 */
export function generateRandomSuffix(length = 6) {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Validate handle length and format for Shopify metaobjects
 * @param {string} handle - Handle to validate
 * @returns {{valid: boolean, error?: string}} - Validation result
 */
export function validateHandle(handle) {
  if (!handle || typeof handle !== 'string') {
    return { valid: false, error: 'Handle is required and must be a string' };
  }
  
  // Conservative length limits based on common web standards
  const MIN_LENGTH = 3;
  const MAX_LENGTH = 60;
  
  if (handle.length < MIN_LENGTH) {
    return { valid: false, error: `Handle must be at least ${MIN_LENGTH} characters long` };
  }
  
  if (handle.length > MAX_LENGTH) {
    return { valid: false, error: `Handle must be no more than ${MAX_LENGTH} characters long` };
  }
  
  // Check for valid characters (alphanumeric and hyphens)
  if (!/^[a-z0-9-]+$/.test(handle)) {
    return { valid: false, error: 'Handle can only contain lowercase letters, numbers, and hyphens' };
  }
  
  // Check for valid start/end (no hyphens at start or end)
  if (handle.startsWith('-') || handle.endsWith('-')) {
    return { valid: false, error: 'Handle cannot start or end with a hyphen' };
  }
  
  return { valid: true };
}

/**
 * Generate a valid handle from title with validation and fallback
 * @param {string} title - The title to convert to handle
 * @returns {{handle: string, warnings: string[]}} - Generated handle with any warnings
 */
export function createValidHandle(title) {
  const warnings = [];
  
  if (!title) {
    const fallbackHandle = `item-${Date.now()}`;
    warnings.push('No title provided, using timestamp-based handle');
    return { handle: fallbackHandle, warnings };
  }
  
  let handle = generateHandle(title);
  
  // If slugification resulted in empty string, use fallback
  if (!handle) {
    handle = `item-${Date.now()}`;
    warnings.push('Title could not be slugified, using timestamp-based handle');
    return { handle, warnings };
  }
  
  const validation = validateHandle(handle);
  
  if (!validation.valid) {
    // Try to fix the handle
    if (handle.length > 60) {
      handle = handle.substring(0, 57); // Leave room for potential suffix
      warnings.push('Handle was truncated due to length limit');
    }
    
    if (handle.length < 3) {
      handle = `${handle}-item`;
      warnings.push('Handle was extended to meet minimum length requirement');
    }
    
    // Re-validate after fixes
    const revalidation = validateHandle(handle);
    if (!revalidation.valid) {
      handle = `item-${Date.now()}`;
      warnings.push('Handle validation failed after fixes, using timestamp-based fallback');
    }
  }
  
  return { handle, warnings };
}

