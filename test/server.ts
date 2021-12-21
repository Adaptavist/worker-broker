import { WorkerBroker } from '../broker/mod.ts';

startServer({ hostname: 'localhost', port: 8080 });

async function startServer(options: Deno.ListenOptions) {
    const server = Deno.listen(options);

    console.debug(
        'Server started:',
        `http://${options.hostname}:${options.port}`,
    );

    for await (const conn of server) {
        handleConn(conn);
    }
}

async function handleConn(conn: Deno.Conn) {
    const httpConn = Deno.serveHttp(conn);
    const broker = new WorkerBroker();

    console.debug(`Connection open:`, httpConn.rid);

    for await (const requestEvent of httpConn) {
        console.debug(`Request:`, requestEvent.request.url);

        const response = await handleRequest(broker, requestEvent.request);

        console.debug(`Response:`, response);

        await requestEvent.respondWith(response);
    }

    console.debug(`Connection closed:`, httpConn.rid);
}

async function handleRequest(
    broker: WorkerBroker,
    request: Request,
): Promise<Response> {
    const { targetModule, functionName, params } = requestToFnCall(request);
    try {
        const result = await broker.workerFnProxy(targetModule, functionName)(
            params,
        );
        if (result instanceof Response) {
            return result;
        } else {
            return new Response(JSON.stringify(result), {
                status: 200,
                headers: {
                    'content-type': 'application/json',
                },
            });
        }
    } catch (e: unknown) {
        if (e instanceof Response) {
            return e;
        } else if (
            e instanceof Error && e.message.includes('Cannot load module')
        ) {
            return new Response(null, {
                status: 404,
            });
        } else {
            return new Response(String(e), {
                status: 500,
                headers: {
                    'content-type': 'text/plain',
                },
            });
        }
    }
}

interface FnCall {
    readonly targetModule: URL;
    readonly functionName: string;
    readonly params: Record<string, string>;
}

function requestToFnCall(request: Request): FnCall {
    const url = new URL(request.url);
    const [functionName, moduleName] = url.pathname.split('/').filter((s) =>
        !!s
    ).reverse();
    return {
        targetModule: new URL(`./http/${moduleName}.ts`, import.meta.url),
        functionName,
        params: urlParams(url.searchParams),
    };
}

function urlParams(searchParams: URLSearchParams): Record<string, string> {
    const params: Record<string, string> = {};
    searchParams.forEach(([value, key]) => {
        params[key] = value;
    });
    return params;
}
