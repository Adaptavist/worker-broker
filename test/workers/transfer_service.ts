export function service(
  params: { thing: ArrayBuffer; multiplier: number },
): ArrayBuffer {
  return new Uint8Array(params.thing).map((v) => v * params.multiplier).buffer;
}
