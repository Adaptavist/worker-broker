import type { Fn, Marshalled } from "./types.ts";

interface MarshallerModule<I = unknown, O = unknown> {
  marshal(value: I): O | Promise<O>;
  unmarshal(value: O): I | Promise<I>;
}

// deno-lint-ignore no-explicit-any
const classes: Record<string, [any, () => Promise<MarshallerModule>]> = {
  "Response": [Response, () => import("./marshaller/Response.ts")],
  "Request": [Request, () => import("./marshaller/Request.ts")],
};

/**
 * Convert an object into a serializable/transferable object,
 * so it can be passed between Workers.
 */
export const marshal = async (val: unknown): Promise<unknown> => {
  for (const marshaller in classes) {
    if (val instanceof classes[marshaller][0]) {
      const marshallerModule = await classes[marshaller][1]();
      return marshallerModule.marshal(val);
    }
  }
  return val;
};

/**
 * Restore a object that was previously marshalled.
 */
export const unmarshal = async <T = unknown>(val: unknown): Promise<T> => {
  if (isMarshalled(val)) {
    const marshallerModule = await classes[val.__marshaller__][1]();
    return marshallerModule.unmarshal(val) as Promise<T>;
  }
  return val as T;
};

/**
 * Marshal the arguments for a function.
 */
export const marshalArgs = <F extends Fn>(
  args: Parameters<F>,
): Promise<unknown[]> => Promise.all(args.map(marshal));

/**
 * Unmarshal the arguments for a function.
 */
export const unmarshalArgs = <F extends Fn>(
  args: unknown[],
): Promise<Parameters<F>> =>
  Promise.all(args.map(unmarshal)) as Promise<Parameters<F>>;

const isMarshalled = (val: unknown): val is Marshalled =>
  !!val && typeof val === "object" &&
  typeof (val as Marshalled).__marshaller__ === "string";
