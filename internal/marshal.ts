import type { Fn, Marshalled } from "./types.ts";

// deno-lint-ignore no-explicit-any
const classes: Record<string, any> = {
  "Response": Response,
  "Request": Request,
};

/**
 * Convert an object into a serializable/transferable object,
 * so it can be passed between Workers.
 */
export const marshal = async (val: unknown): Promise<unknown> => {
  for (const marshaller in classes) {
    if (val instanceof classes[marshaller]) {
      return (await import(`./marshaller/${marshaller}.ts`)).marshal(
        val,
      );
    }
  }
  return val;
};

/**
 * Restore a object that was previously marshalled.
 */
export const unmarshal = async <T = unknown>(val: unknown): Promise<T> => {
  if (isMarshalled(val)) {
    return await (await import(`./marshaller/${val.__marshaller__}.ts`))
      .unmarshal(val);
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
