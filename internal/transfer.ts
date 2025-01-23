/**
 * Recursively find all Transferable objects in all given arguments.
 */
export const findTransferables = (...args: unknown[]): Transferable[] =>
  args.flatMap((val) => {
    if (isTransferable(val)) {
      return [val];
    } else if (Array.isArray(val)) {
      return findTransferables(...val);
    } else if (val && typeof val === "object") {
      return findTransferables(...Object.values(val));
    } else {
      return [];
    }
  });

/**
 * Guard to determine whether a value is Transferable.
 */
export const isTransferable = (val: unknown): val is Transferable =>
  val instanceof ArrayBuffer;
