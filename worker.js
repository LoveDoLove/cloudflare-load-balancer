// Cloudflare Worker: Advanced Load Balancer Example
// This Worker proxies requests to multiple origin servers with support for weighted routing, backup origins, and disabled origins.
// Update the ORIGINS array with your origin server configurations.
// References:
// - https://developers.cloudflare.com/workers/examples/load-balancer/
// - https://developers.cloudflare.com/workers/runtime-apis/fetch/

/**
 * List of origin server configurations.
 * - url: string (origin URL)
 * - weight: number (relative traffic weight, default 1)
 * - backup: boolean (true if backup, default false)
 * - enabled: boolean (true if enabled, default true)
 */
const ORIGINS = [
  {
    url: "https://server1.example.com",
    weight: 3,
    backup: false,
    enabled: true,
  },
  {
    url: "https://server2.example.com",
    weight: 1,
    backup: false,
    enabled: true,
  },
  {
    url: "https://server3.example.com",
    weight: 1,
    backup: true,
    enabled: true,
  },
  // Add more origins as needed
];

/**
 * Selects an origin using weighted random selection.
 * @param {Array} origins - Array of origin objects
 * @returns {Object} Selected origin object
 */
function selectWeightedRandomOrigin(origins) {
  const totalWeight = origins.reduce((sum, o) => sum + (o.weight || 1), 0);
  let r = Math.random() * totalWeight;
  for (const origin of origins) {
    r -= origin.weight || 1;
    if (r < 0) return origin;
  }
  // Fallback (should not happen)
  return origins[0];
}

/**
 * Attempts to proxy the request to a list of origins, trying backups if needed.
 * @param {Request} request
 * @returns {Promise<Response>}
 */
async function handleRequest(request) {
  // Filter enabled, non-backup origins
  let primaries = ORIGINS.filter(
    (o) => o.enabled !== false && o.backup !== true
  );
  let backups = ORIGINS.filter((o) => o.enabled !== false && o.backup === true);

  // Try primaries first, then backups if all primaries fail
  let triedOrigins = new Set();
  let lastError = null;

  for (let phase = 0; phase < 2; phase++) {
    let pool = phase === 0 ? primaries : backups;
    let attempts = pool.length;
    for (let i = 0; i < attempts; i++) {
      // Select an origin not yet tried
      let available = pool.filter((o) => !triedOrigins.has(o.url));
      if (available.length === 0) break;
      let origin = selectWeightedRandomOrigin(available);
      triedOrigins.add(origin.url);

      // Build the proxied URL
      const url = new URL(request.url);
      const originUrl = origin.url + url.pathname + url.search;

      // Clone the request for fetch
      const init = {
        method: request.method,
        headers: request.headers,
        body: request.body,
        redirect: "follow",
      };

      try {
        const response = await fetch(originUrl, init);
        // Optionally, you can modify the response here
        return response;
      } catch (err) {
        lastError = err;
        // Try next origin
      }
    }
  }

  // If all attempts fail, return 502
  return new Response("Bad Gateway: All origins failed", { status: 502 });
}

addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
