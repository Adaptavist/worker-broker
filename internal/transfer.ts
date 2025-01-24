/**
 * Recursively find all Transferable objects in all given arguments.
 */
export const findTransferables = (
  ...args: unknown[]
): Promise<Transferable[]> => Promise.resolve(getTransferables(args));

const getTransferables = (args: unknown[]): Transferable[] =>
  args.flatMap((val) => {
    if (isTransferable(val)) {
      return [val];
    } else if (Array.isArray(val)) {
      return getTransferables(val);
    } else if (val && typeof val === "object") {
      return getTransferables(Object.values(val));
    } else {
      return [];
    }
  });

/**
 * Guard to determine whether a value is Transferable.
 */
const isTransferable = (val: unknown): val is Transferable =>
  val instanceof ArrayBuffer;

/**
 * Check whether the runtime supports transferable web streams.
 * Currently always false, as Deno doesn't, but may eventually
 * be implemented to allow future compatibility.
 * (See jsr:@okikio/transferables)
 */
export function hasTransferableStreams(): Promise<boolean> {
  return Promise.resolve(false);
}
