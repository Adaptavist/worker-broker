/**
 * A generic function.
 */
// deno-lint-ignore no-explicit-any
export type Fn = (...args: any[]) => any;

/**
 * The representation of a function call to a Worker.
 */
export interface WorkerMsgCall<F extends Fn> {
  /**
   * Indicate a function call
   */
  readonly kind: "call";
  /**
   * A unique identifier for this message
   */
  readonly id: string;
  /**
   * The specifier of the module containing the function
   */
  readonly targetModule: string;
  /**
   * The module from which the call originates
   */
  readonly sourceModule?: string;
  /**
   * The name of the function to call within the module
   */
  readonly functionName: string;
  /**
   * The arguments of the function call
   */
  readonly args: Parameters<F>;
}

/**
 * The representation of the result from a Worker function.
 */
export interface WorkerMsgResult<F extends Fn>
  extends Omit<WorkerMsgCall<F>, "kind"> {
  /**
   * Indicate a result of a function call
   */
  readonly kind: "result";
  /**
   * The actual result of the function call
   */
  readonly result?: ReturnType<F>;
  /**
   * An error thrown by the function
   */
  readonly error?: unknown;
}

/**
 * A message to/from a Worker.
 */
export type WorkerMsg<F extends Fn> = WorkerMsgCall<F> | WorkerMsgResult<F>;

/**
 * A function that supplies a Worker for the given module.
 */
export type WorkerSupplier = (moduleSpecifier: string) => Worker;

/**
 * A proxy object of all functions of a module in a Worker.
 * All return types of the function will be wrapped in a Promise.
 */
export type WorkerProxy<M> = {
  [P in keyof M]: M[P] extends Fn
    ? (...args: Parameters<M[P]>) => Promise<ReturnType<M[P]>>
    : never;
};

/**
 * A value that has been 'marshalled' into a form that is serialisable,
 * and can then be passed in a WorkerMsg.
 */
export interface Marshalled<T extends string = string> {
  readonly __marshaller__: T;
}
