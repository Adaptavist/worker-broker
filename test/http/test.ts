export function ok() {
    return 'ok';
}

export function error() {
    throw new Error('Not ok');
}

export function forbidden() {
    throw new Response(null, {
        status: 403,
    });
}

export function redirect() {
    return new Response(null, {
        status: 302,
        headers: {
            location: 'https://example.com',
        },
    });
}
