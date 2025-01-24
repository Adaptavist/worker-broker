export const fetch: typeof globalThis.fetch = async (input, init) => {
  console.log("FETCH VIA PROXY:", input, init);
  const response = await globalThis.fetch(input, init);
  console.log("RESPONSE:", response.status, response.statusText);
  return response;
};
