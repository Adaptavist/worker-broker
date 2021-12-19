/// <reference no-default-lib="true" />
/// <reference lib="deno.worker" />

export async function sendMessage(message: string) {
    const response = await fetch('https://jollytoad.free.beeceptor.com/worker-broker/test', {
        method: 'POST',
        headers: {
            'content-type': 'application/json'
        },
        body: JSON.stringify({
            message
        })
    })
    return {
        reply: await response.text()
    }
}
