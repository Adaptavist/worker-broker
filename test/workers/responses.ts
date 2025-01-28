export function throwForbidden() {
  throw new Response(null, {
    status: 403,
    statusText: "Forbidden",
  });
}

export function returnForbidden() {
  return new Response(null, {
    status: 403,
    statusText: "Forbidden",
  });
}
