/**
 * Cloudflare Worker: Lightweight Load Balancer
 *
 * Proxies HTTP requests to multiple origin servers with weighted routing and failover.
 * Forwards all headers and cookies, with minimal processing for stability and maintainability.
 *
 * References:
 * - https://developers.cloudflare.com/workers/examples/load-balancer/
 * - https://developers.cloudflare.com/workers/runtime-apis/fetch/
 *
 * Copyright (c) 2025 LoveDoLove
 * Licensed under the MIT License.
 */

/**
 * Array of origin server configuration objects.
 *
 * Each object must contain:
 *   - url: The origin server URL (string).
 *   - weight: Relative traffic weight for load balancing (number, default: 1).
 *   - backup: Indicates if the origin is a backup (boolean, default: false).
 *   - enabled: Indicates if the origin is active (boolean, default: true).
 *
 * Example:
 * {
 *   url: "https://server1.example.com",
 *   weight: 3,
 *   backup: false,
 *   enabled: true
 * }
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
 * Selects an origin server from the provided array using weighted random selection.
 *
 * @param {Array<Object>} origins - Array of origin configuration objects.
 * @returns {Object} The selected origin configuration object.
 */
function selectWeightedRandomOrigin(origins) {
  // Weighted random selection for load balancing
  const totalWeight = origins.reduce((sum, o) => sum + (o.weight || 1), 0);
  let r = Math.random() * totalWeight;
  for (const origin of origins) {
    r -= origin.weight || 1;
    if (r < 0) return origin;
  }
  return origins[0];
  // End of file

  function sanitizeHeaders(headers) {
    // Remove hop-by-hop headers and those that may cause issues
    const h = new Headers(headers);
    h.delete("host");
    h.delete("content-length");
    h.delete("accept-encoding");
    return h;
  }

  function forwardSetCookieHeaders(originHeaders, targetHeaders) {
    // Forward all Set-Cookie headers explicitly (required by Cloudflare Workers)
    for (const [key, value] of originHeaders.entries()) {
      if (key.toLowerCase() === "set-cookie") {
        targetHeaders.append("Set-Cookie", value);
      }
    }
  }

  /**
   * Proxies the incoming HTTP request to one of the configured origin servers.
   *
   * The function first attempts to route the request to enabled primary origins using weighted selection.
   * If all primary origins fail, it retries with enabled backup origins.
   * For each attempt, the request body is cloned and headers are sanitized to ensure compatibility.
   *
   * @param {Request} request - The incoming HTTP request object.
   * @returns {Promise<Response>} The proxied response from the selected origin, or a 502 error if all origins fail.
   */
  async function handleRequest(request) {
    // Get host to prevent proxying to self
    const workerHostname = new URL(request.url).hostname;
    const filterOrigins = (backup) =>
      ORIGINS.filter(
        (o) =>
          o.enabled !== false &&
          o.backup === !!backup &&
          new URL(o.url).hostname !== workerHostname
      );
    const primaries = filterOrigins(false);
    const backups = filterOrigins(true);

    let tried = new Set();
    let lastError = null;
    for (const pool of [primaries, backups]) {
      for (let i = 0; i < pool.length; i++) {
        const available = pool.filter((o) => !tried.has(o.url));
        if (!available.length) break;
        const origin = selectWeightedRandomOrigin(available);
        tried.add(origin.url);
        const url = new URL(request.url);
        const originUrl = origin.url + url.pathname + url.search;
        const headers = sanitizeHeaders(request.headers);
        let body = null;
        if (request.method !== "GET" && request.method !== "HEAD") {
          body = await request.arrayBuffer();
        }
        const fetchInit = {
          method: request.method,
          headers,
          body,
          redirect: "follow",
        };
        try {
          const resp = await fetch(originUrl, fetchInit);
          // Forward all headers and cookies
          if (
            [...resp.headers.keys()].some(
              (k) => k.toLowerCase() === "set-cookie"
            )
          ) {
            const outHeaders = new Headers(resp.headers);
            outHeaders.delete("set-cookie");
            forwardSetCookieHeaders(resp.headers, outHeaders);
            return new Response(resp.body, {
              status: resp.status,
              statusText: resp.statusText,
              headers: outHeaders,
            });
          }
          return resp;
        } catch (err) {
          lastError = err;
        }
      }
    }
    // All attempts failed
    return new Response("Bad Gateway: All origins failed", { status: 502 });
  }
}

/**
 * Cloudflare Worker entry point.
 *
 * Listens for fetch events and responds by invoking the load balancer handler.
 */
// Worker entry point
self.addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
