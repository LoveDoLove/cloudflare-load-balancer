
// Cloudflare Worker: Custom Load Balancer Example
// This Worker proxies requests to multiple origin servers using round-robin load balancing.
// Update the ORIGIN_SERVERS array with your origin server URLs.
// References:
// - https://developers.cloudflare.com/workers/examples/load-balancer/
// - https://developers.cloudflare.com/workers/runtime-apis/fetch/

const ORIGIN_SERVERS = [
	'https://server1.example.com',
	'https://server2.example.com',
	'https://server3.example.com',
];

// Use a global index for round-robin (not perfect, but works for most cases)
let currentIndex = 0;

addEventListener('fetch', event => {
	event.respondWith(handleRequest(event.request));
});

/**
 * Proxies the request to one of the origin servers using round-robin.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
	// Select origin using round-robin
	const origin = ORIGIN_SERVERS[currentIndex % ORIGIN_SERVERS.length];
	currentIndex++;

	// Construct the new URL for the origin
	const url = new URL(request.url);
	const originUrl = origin + url.pathname + url.search;

	// Clone the request and update the destination
	const init = {
		method: request.method,
		headers: request.headers,
		body: request.body,
		redirect: 'follow',
	};

	try {
		const response = await fetch(originUrl, init);
		// Optionally, you can modify the response here
		return response;
	} catch (err) {
		// If the origin is unreachable, return a 502 error
		return new Response('Bad Gateway', { status: 502 });
	}
}
