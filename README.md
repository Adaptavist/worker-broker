# Worker Broker

**THIS IS VERY EXPERIMENTAL**

The idea is to allow multiple untrusted code modules to act like microservices,
interacting with each other via a 'WorkerBroker' with very low latencies.

The individual worker modules have to trust the broker, but don't have to trust
each other.

Useful for apps that would like to allow users to implement their own extended
functionality via JS/TS modules.

## Exported Modules

NOTE: There is no default `@jollytoad/worker-broker` module, instead...

- `@jollytoad/worker-broker/broker` - main broker, to be used by the core of the
  system, NOT by worker modules.
- `@jollytoad/worker-broker/worker` - utilities for use by modules within a
  Worker
- `@jollytoad/worker-broker/onmessage` - the default Worker `onmessage` handler
- `@jollytoad/worker-broker/debug` - enable/disable debugging logs
- `@jollytoad/worker-broker/cleaner` - a WorkerCleaner that cleans out least
  recently used Worker based on memory pressure and/or an overall Worker count
  limit

## Usage

Our examples below will make use of the following simple module `./hello.ts`:

```ts
export function hello(name: string) {
  return `Hello ${name}`;
}
```

### Creating a Worker and calling a function within it

```ts
import { WorkerBroker } from "@jollytoad/worker-broker/broker";
import type { hello } from "./hello.ts";

// Create the WorkerBroker
const broker = new WorkerBroker();

// Create a proxy of a function within the Worker, it will have the same signature as the
// `hello` function within the module, apart the from return type will be wrapped in a Promise.
const proxiedHello = broker.workerFnProxy<typeof hello>(
  new URL("./hello.ts", import.meta.url),
  "hello",
);

// You can call the function exactly as you normally would, albeit `await` the return value.
const result = await proxiedHello("World");
```

#### What just happened?

The call to `broker.workerFnProxy()` created a proxy function that appears to
almost exactly match the `hello` function within that module (except for
returning a Promise). A Worker is not yet created.

On the first call to this `proxiedHello()` function the WorkerBroker will create
a new Worker identified by the module URL (ie. `./hello.ts`), but passing it's
own entry point module to the Worker.

This entry point module is just initialized with a stub message handler.

Following this, a `postMessage` to the Worker is performed, passing the names of
the module and function, and the arguments. The stub handler will dynamically
import the `./hello.ts` module, call the `hello` function and `postMessage` the
result back to the main thread.

The Worker is kept alive for any further calls.

#### Multiple Workers per module

By default Workers are identified by the URL of the module you import and so any
further use of the `broker.worker*` methods, with the same module URL will reuse
this same Worker.

If you want multiple Workers for the same module you can pass a tuple in place
of the module URL, containing the URL and a unique 'segregation' identifier:

```ts
const segregationId = "user-123";

const proxiedHello = broker.workerFnProxy<typeof hello>(
  [new URL("./hello.ts", import.meta.url), segregationId],
  "hello",
);
```

This is useful if you want to ensure each user hits their own isolated instance
of a Worker, esp if the module is from an untrusted source.

#### Proxying the entire module

As the general idea is to have a service provided by a module in Worker, you
probably want to proxy all of the functions within the module rather just one...

```ts
import { WorkerBroker } from "@jollytoad/worker-broker/broker";
import type * as Hello from "./hello.ts";

// Create the WorkerBroker
const broker = new WorkerBroker();

// Create a proxy of all functions of the module within the Worker
const helloService = broker.workerProxy<typeof Hello>(
  new URL("./hello.ts", import.meta.url),
);

// You can now call a function from the proxied service
const result = await helloService.hello("World");
```

### Worker to Worker calls

Workers can make calls to other workers using the functions exported from
`@jollytoad/worker-broker/worker`.

For example, the following module will make use of our `./hello.ts`:

```ts
import { brokerProxy } from "@jollytoad/worker-broker/worker";
import type * as Hello from "./hello.ts";

// Create a proxy to the WorkerBroker
const broker = brokerProxy();

// Create a proxy of all functions of the module within the Worker
const helloService = broker.workerProxy<typeof Hello>(
  new URL("./hello.ts", import.meta.url),
);

export function helloWorld() {
  return helloService.hello("World");
}
```

You can see the creation of the proxy to `./hello.ts` is almost exactly the
same, the main difference being use of `brokerProxy` to get a handle to the
WorkerBroker.

### Cache-busting

If you are using WorkerBroker in a development cycle, where modules within
Workers are likely to change, then you can force these modules to be
re-imported.

The `broker.workerImport()` function be used to import a module into a Worker
without making a function call.

Passing a unique `cacheBuster` argument will force the module to be re-imported
by attaching the value as the hash of the module URL:

```ts
await broker.workerImport(
  new URL("./hello.ts", import.meta.url),
  Date.now(),
);
```

### Worker customization

You can customize the creation of a Worker by passing a `workerConstructor` to
the `WorkerBroker` when it's created...

```ts
const broker = new WorkerBroker({
  workerConstructor: (moduleSpecifier, segregationId) => {
    return new Worker(import.meta.resolve("./my_worker.ts"), {
      type: "module",
      deno: {
        env: false,
        ffi: false,
        import: "inherit",
        net: false,
        read: [moduleSpecifier, libPathUrl],
        run: false,
        sys: false,
        write: false,
      },
    });
  },
});
```

Allowing you configure the Worker based on the module URL and/or the segregation
id. You can also supply your own worker entry point module.

We supply a function to create the `onmessage` handler within the worker, this
is the most simple example of a Worker entry point module:

```ts
import { onmessage } from "@jollytoad/worker-broker/onmessage";

declare const self: Worker;

self.onmessage = onmessage();
```

Take a look at the example app for a more detailed example of Worker
customization.

### Worker clean-up

Each new Worker uses a not insignificant amount of memory, and the WorkerBroker
does not terminate any workers it creates by default. So you may want to
consider some kind of clean up strategy if you plan to have many workers.

You can pass a `workerCleaner` to the WorkerBroker to deal with this, which is
just a simple function that receives events from the WorkerBroker.

We provide a simple default implementation of a WorkerCleaner, but you have to
explicitly pass it to the WorkerBroker constructor...

```ts
import { WorkerBroker } from "@jollytoad/worker-broker/broker";
import { cleaner } from "@jollytoad/worker-broker/cleaner";

const broker = new WorkerBroker({
  workerCleaner: cleaner({
    memoryCeiling: 100_000_000,
    workerCount: 10,
  }),
});
```

This example will terminate the least recently used workers if the Deno process
exceeds 100Mb total memory usage, or the number of workers exceeds 10.

You can implement you own `WorkerCleaner` function if you need more specific
behaviour.

#### WorkerEvents

There are four types of event that are passed to the `WorkerCleaner`.

- `create` - when a new Worker is created and accessed for the first time
- `get` - when an existing Worker is accessed
- `remove` - when a Worker was removed from the broker
- `terminate` - when the WorkerBroker (along with all Workers) is terminated

Your WorkerCleaner can maintain is own last-used table from this, and determine
it's course of action, the event contains the `WorkerBroker` and the individual
`Worker` in question (except for `terminate`), so it can call back to the broker
to perform a `remove` of any other worker.

## Example App

An example app (web server) demonstrates the use of the WorkerBroker to split
the functionality into multiple trusted and untrusted workers that can
communicate via a proxied module interface.

Start the example app with:

```sh
deno task start
```

### Endpoints

The entrypoint of the app is `example/app/main.ts`.

The app exposes two endpoints:

- `http://localhost:8000/<module-name>`

Where `<module-name>` is the name of a module file in `workers/untrusted`
(without the `.ts` extension). This forces a module to be imported into a
Worker, and subsequent calls force a reload of the module with a cache busting
hash on the module URL (more about this later).

- `http://localhost:8000/<module-name>/<function-name>`

This will call the exported function from the named module, returning the result
in Response.

### Example modules/functions

Try the following URLs:

- http://localhost:8000/hello/world
- http://localhost:8000/fetch_example
- http://localhost:8000/test1/ok
- http://localhost:8000/test1/forbidden
- http://localhost:8000/test1/redirect
- http://localhost:8000/test1/error

### State isolation

To see the module state isolation in action, try these:

- http://localhost:8000/test1/state -> you should see: `test1`
- http://localhost:8000/test1/state?set=foo -> `foo`, this has set state within
  the imported module.
- http://localhost:8000/test1/state -> `foo`
- http://localhost:8000/test2/state -> `test2`, despite this worker using the
  same state module as above.
- http://localhost:8000/test2/state?set=bar -> `bar`
- http://localhost:8000/test2/state -> `bar`
- http://localhost:8000/test1/state -> still `foo`

Both these worker modules import the same `state.ts` module that keeps an
internal state.

You can do the same experiment with these, that set a global variable instead:

- http://localhost:8000/test1/global
- http://localhost:8000/test2/global

### Cache busting

WorkerBroker also allows modules to be reloaded, by adding a caching busting
hash value to the module URL of a Worker. The WorkerBroker will remember the
last cache busting value used for a particular module, and continue to use it
for all future imports of the module.

Calling the `<module-name>` endpoint in the example app will force this
behaviour.

To see this in action, try hitting the following in order:

- http://localhost:8000/test1/state?set=changed -> `changed`
- http://localhost:8000/test1/state -> `changed`
- http://localhost:8000/test1 - this forces the `test1.ts` module to be
  reimported within the Worker
- http://localhost:8000/test1/state -> `test1` - the state has been reset to
  it's original value
