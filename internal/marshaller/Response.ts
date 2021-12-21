import type { Marshalled } from '../types.ts';

interface MarshalledResponse extends Marshalled<'Response'> {
    readonly status: number;
    readonly statusText: string;
    readonly headers: [string, string][];
    readonly body: ArrayBuffer;
}

export const marshall = async (r: Response): Promise<MarshalledResponse> => ({
    __marshaller__: 'Response',
    status: r.status,
    statusText: r.statusText,
    headers: [...r.headers.entries()],
    body: await r.arrayBuffer(),
});

export const unmarshall = (
    { __marshaller__, body, ...init }: MarshalledResponse,
): Response => new Response(body, init);
