import type { Fn, WorkerMsgCall, WorkerMsgResult } from "./types.ts";

/**
 * Create a result message of a Worker call.
 *
 * The args of the incoming message are not included in the result, in case
 * they contain transferable objects that have already been detached and
 * therefore cannot be transferred/cloned again.
 *
 * @param msg the incoming message
 * @param props the result/error properties
 * @returns
 */
export function createResult<F extends Fn>(
  msg: WorkerMsgCall<F>,
  props: Pick<WorkerMsgResult<Fn>, "result" | "error">,
): WorkerMsgResult<F> {
  const { args: _args, kind: _kind, ...originalMsg } = msg;

  return {
    kind: "result",
    ...originalMsg,
    ...props,
  };
}
