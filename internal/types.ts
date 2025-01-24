import type { WorkerBroker } from "../broker/mod.ts";

/**
 * Options for the WorkerBroker constructor.
 */
export interface WorkerBrokerOptions {
  /**
   * A custom Worker construction function, if you want to
   * supply an alternative Worker module, or custom options.
   */
  workerConstructor?: WorkerSupplier;

  /**
   * A function call whenever a Worker is created or accessed
   * from the WorkerBroken. May be used to implement a
   * clean up strategy.
   */
  workerCleaner?: WorkerCleaner;
}

/**
 * A generic function.
 */
// deno-lint-ignore no-explicit-any
export type Fn = (...args: any[]) => any;

/**
 * The representation of a function call to a Worker.
 */
export interface WorkerMsgCall<F extends Fn = Fn> {
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
   * An identifier to segregate Workers even for the same
   * module. This may be a user id for example.
   */
  readonly segregationId?: string;
  /**
   * A value added as the hash of an import URL of a module,
   * as a way to force a re-import of the module.
   */
  readonly cacheBuster?: string;
  /**
   * The module from which the call originates
   */
  readonly sourceModule?: string;
  /**
   * The name of the function to call within the module
   */
  readonly functionName?: string;
  /**
   * The arguments of the function call
   */
  readonly args?: Parameters<F>;
}

/**
 * The representation of the result from a Worker function.
 */
export interface WorkerMsgResult<F extends Fn = Fn>
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
export type WorkerMsg<F extends Fn = Fn> =
  | WorkerMsgCall<F>
  | WorkerMsgResult<F>;

/**
 * A function that supplies a Worker for the given module.
 */
export type WorkerSupplier = (
  moduleSpecifier: URL,
  segregationId?: string,
) => Worker;

/**
 * A function called after a Worker is added or access from the WorkerBroker.
 * This may be used to implement a Worker cleanup strategy.
 */
export type WorkerCleaner = (
  event: WorkerEvent | WorkerBrokerEvent,
) => void;

/**
 * A event regarding an actual Worker
 */
export interface WorkerEvent {
  /**
   * The action that trigger the event
   */
  type: "create" | "get" | "remove";
  /**
   * The actual Worker (do not cache this)
   */
  worker: Worker;
  /**
   * A unique key for the Worker, you can use
   * this to index information about Workers rather than
   * the actual Worker
   */
  key: string;
  /**
   * The moduleSpec of the Worker
   */
  moduleSpecifier: URL;
  /**
   * The segregationId of the Worker
   */
  segregationId?: string;
  /**
   * The WorkerBroker from which this event originated
   */
  broker: WorkerBroker;
}

/**
 * A event regarding the whole WorkerBroker
 */
export interface WorkerBrokerEvent {
  /**
   * The action that trigger the event
   */
  type: "terminate";
  /**
   * The WorkerBroker from which this event originated
   */
  broker: WorkerBroker;
}

/**
 * A proxy object of all functions of a module in a Worker.
 * All return types of the function will be wrapped in a Promise.
 */
export type WorkerProxy<M> = {
  [P in keyof M]: M[P] extends Fn
    ? (...args: Parameters<M[P]>) => Promise<Awaited<ReturnType<M[P]>>>
    : never;
};

/**
 * A value that has been 'marshalled' into a form that is serialisable,
 * and can then be passed in a WorkerMsg.
 */
export interface Marshalled<T extends string = string> {
  /**
   * The name of the marshaller
   */
  readonly __marshaller__: T;
}
