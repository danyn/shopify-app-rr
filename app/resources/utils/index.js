export function handleize(str) {
  if(typeof str !== 'string') return str
  return str
    .toLowerCase()                 // convert to lowercase
    .trim()                        // remove surrounding whitespace
    .replace(/[^a-z0-9\s]/g, '')   // remove non-alphanumeric characters
    .replace(/\s+/g, '_');         // replace spaces with underscores
}

