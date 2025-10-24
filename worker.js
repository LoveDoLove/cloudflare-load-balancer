/**
 * Cloudflare Worker: Advanced Load Balancer
 *
 * This Worker implements a load balancer that proxies HTTP requests to multiple origin servers.
 * Features include weighted routing, backup origin support, and dynamic origin enablement.
 *
 * To configure, update the ORIGINS array with the desired origin server details.
 *
 * Documentation:
 * - Cloudflare Workers Load Balancer Example: https://developers.cloudflare.com/workers/examples/load-balancer/
 * - Cloudflare Workers Fetch API: https://developers.cloudflare.com/workers/runtime-apis/fetch/
 *
 * Copyright (c) 2025 LoveDoLove
 * Licensed under the MIT License. See LICENSE file in the project root for full license information.
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

      // Clone and sanitize headers for proxying
      const headers = new Headers(request.headers);
      headers.delete("host");
      headers.delete("content-length");
      headers.delete("accept-encoding");

      // Clone the request body for each attempt
      let body = null;
      if (request.method !== "GET" && request.method !== "HEAD") {
        // Read the body as an ArrayBuffer and recreate for each fetch
        body = await request.arrayBuffer();
      }

      // Reconstruct the Request for fetch
      const fetchInit = {
        method: request.method,
        headers,
        body: body,
        redirect: "follow",
      };

      try {
        const response = await fetch(originUrl, fetchInit);
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

/**
 * Cloudflare Worker entry point.
 *
 * Listens for fetch events and responds by invoking the load balancer handler.
 */
addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
