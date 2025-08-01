import type { WorkerBroker } from "../broker/mod.ts";

/**
 * Options for the WorkerBroker constructor.
 */
export interface WorkerBrokerOptions {
  /**
   * A function to calculate a key for the Worker given the
   * module specifier and segregation id.
   *
   * The default implementation will produce a unique key based on the
   * module specifier and segregation id (if present).
   *
   * Using your own key supplier will allow you full control over reuse
   * of Workers according to these values. So for example, you could share
   * a Worker for multiple modules based on the module specifier, and/or
   * based on the segregation id passed.
   */
  workerKeySupplier?: WorkerKeySupplier;

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
 * A URL specifier for a module.
 */
export type ModuleSpecifier = string | URL;

/**
 * A specifier for a Worker: a module URL and an optional segregation id.
 */
export type WorkerSpecifier = ModuleSpecifier | [
  ModuleSpecifier,
  segregationId?: string,
];

/**
 * Common proxy creation functions for the WorkerBroker and
 * it's proxy within workers.
 */
export interface WorkerProxyFactory {
  /**
   * Create a proxy object of all functions of the module in the Worker
   */
  workerProxy<M>(workerSpecifier: WorkerSpecifier): WorkerProxy<M>;

  /**
   * Create a proxy for a single function in the worker
   */
  workerFnProxy<F extends Fn>(
    workerSpecifier: WorkerSpecifier,
    functionName: string,
  ): (...args: Parameters<F>) => Promise<Awaited<ReturnType<F>>>;
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
  readonly targetSegregationId?: string;
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
   * The segregation id of the source Worker.
   */
  readonly sourceSegregationId?: string;
  /**
   * The name of the function to call within the module
   */
  readonly functionName?: string;
  /**
   * The arguments of the function call
   */
  readonly args?: Parameters<F>;
  /**
   * The serialized telemetry context for propagation to/from a Worker
   */
  readonly context?: TelemetryContext;
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
 * A function that calculates a key for the Worker for the given module.
 *
 * The hash of the moduleSpecifier URL (which may be used for cache busting purposes)
 * will have already been stripped from the URL.
 */
export type WorkerKeySupplier = (
  moduleSpecifier: URL,
  segregationId?: string,
) => string;

/**
 * A function called after a Worker is added or access from the WorkerBroker.
 * This may be used to implement a Worker cleanup strategy.
 */
export type WorkerCleaner = (
  event: WorkerEvent | WorkerBrokerEvent,
) => void;

/**
 * Functions called at various points within the Worker.
 */
export interface WorkerCallOptions {
  /**
   * Called on the first message, can be used to initialize the
   * global environment within the Worker.
   */
  initialCall?: WorkerCallAdvice;

  /**
   * Called and awaited immediately before the worker fn,
   * and within the same telemetry span.
   *
   * Throwing an error from this will propagate and prevent the
   * worker fn from being called, but `afterCall` will still
   * be called.
   */
  beforeCall?: WorkerCallAdvice;

  /**
   * Called and awaited immediately after the worker fn,
   * and within the same telemetry span.
   *
   * Within a finally clause, so this is always called even if
   * the worker fn or beforeCall throws an error.
   */
  afterCall?: WorkerCallAdvice;
}

/**
 * A function that is called within the Worker to allow custom behaviours.
 */
export type WorkerCallAdvice<F extends Fn = Fn> = (
  msg: WorkerMsgCall<F>,
) => void | Promise<void>;

/**
 * A event regarding an actual Worker
 */
export interface WorkerEvent {
  /**
   * The action that triggered the event
   */
  type: "create" | "get" | "remove";
  /**
   * The actual Worker (do not cache this)
   */
  worker: Worker;
  /**
   * An opaque unique key for the Worker, you can use
   * this to index information about Workers rather than
   * indexing the actual Worker (do not try to parse this)
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
   * The action that triggered the event
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

/**
 * Telemetry support functions for the WorkerBroker.
 */
export interface Telemetry {
  /**
   * Create a telemetry span for an internal WorkerMsg handling function
   * @param spanName the name of the handling function
   * @param msg a WorkerMsg
   * @param fn the function to call within the span (the span is ended when this returns)
   */
  msgSpan<T>(
    spanName: string,
    msg: WorkerMsg,
    fn: (log: TelemetryTools) => Promise<T>,
  ): Promise<T>;

  /**
   * Marshal the active telemetry context into the serializable context
   * propagation format.
   */
  marshalContext(): TelemetryContext;

  /**
   * The default worker module to use for this telemetry system
   */
  defaultWorkerModule: string;
}

/**
 * Telemetry functions passed to the callback within a `msgSpan`
 */
export interface TelemetryTools {
  /**
   * Log a telemetry event within the current span
   */
  event(name: string): void;
}

/**
 * Opaque context serialization for propagation to/from a Worker.
 * This MUST be serializable by `postMessage`.
 */
export type TelemetryContext = unknown;
