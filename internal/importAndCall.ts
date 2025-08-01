import { marshal, unmarshalArgs } from "./marshal.ts";
import { getTelemetry } from "@jollytoad/worker-broker/telemetry";
import type {
  Fn,
  WorkerCallOptions,
  WorkerMsgCall,
  WorkerMsgResult,
} from "./types.ts";

/**
 * Import the target module and (optionally) call the function
 */
export const importAndCall = async <F extends Fn>(
  msg: WorkerMsgCall<F>,
  options?: WorkerCallOptions,
): Promise<WorkerMsgResult<F>> => {
  let props: Pick<WorkerMsgResult<Fn>, "result" | "error"> = {};
  const { msgSpan } = getTelemetry();

  try {
    const m = await msgSpan("import", msg, () => import(msg.targetModule));

    if (msg.functionName) {
      const fn = m[msg.functionName];

      if (typeof fn === "function") {
        const args = msg.args?.length ? await unmarshalArgs(msg.args) : [];

        const result = await msgSpan("call", msg, async () => {
          try {
            await options?.beforeCall?.(msg);
            return await fn.apply(msg, args);
          } finally {
            await options?.afterCall?.(msg);
          }
        });

        props = {
          result: await marshal(result),
        };
      } else {
        props = {
          error: "Function not found",
        };
      }
    }
  } catch (error: unknown) {
    props = {
      error: await marshal(error),
    };
  }

  return {
    ...msg,
    kind: "result",
    ...props,
  };
};
