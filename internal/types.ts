// deno-lint-ignore no-explicit-any
export type Fn = (...args: any[]) => any;

export interface WorkerMsgCall<F extends Fn> {
    readonly kind: 'call';
    readonly id: string;
    readonly targetModule: string;
    readonly sourceModule?: string;
    readonly functionName: string;
    readonly args: Parameters<F>;
}

export interface WorkerMsgResult<F extends Fn>
    extends Omit<WorkerMsgCall<F>, 'kind'> {
    readonly kind: 'result';
    readonly result?: ReturnType<F>;
    readonly error?: unknown;
}

export type WorkerMsg<F extends Fn> = WorkerMsgCall<F> | WorkerMsgResult<F>;

export type WorkerSupplier = (moduleSpecifier: string) => Worker;

export type WorkerProxy<M> = {
    [P in keyof M]: M[P] extends Fn
        ? (...args: Parameters<M[P]>) => Promise<ReturnType<M[P]>>
        : never;
};

export interface Marshalled<T extends string = string> {
    readonly __marshaller__: T;
}
