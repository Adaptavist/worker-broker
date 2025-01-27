/**
 * Example of wrapping the native fetch fn for use in untrusted worker modules.
 */
export const fetch: typeof globalThis.fetch = async (input, init) => {
  console.log("FETCH VIA PROXY:", input, init);
  const response = await globalThis.fetch(input, init);
  console.log("RESPONSE:", response.status, response.statusText);
  return response;
};
