/**
 * Cloudflare Worker: Advanced Load Balancer
 *
 * Proxies HTTP requests to multiple origin servers with weighted routing, health checks, and failover.
 * Forwards all headers and cookies with comprehensive logging and debugging capabilities.
 *
 * Features:
 * - Weighted random selection of primary origins
 * - Automatic failover to backup origins
 * - Request tracking with unique IDs for debugging
 * - Configurable timeouts and retries
 * - Health check endpoints (/health, /_lb/stats)
 * - Detailed logging for troubleshooting
 * - Support for environment variables and secrets
 *
 * References:
 * - https://developers.cloudflare.com/workers/examples/load-balancer/
 * - https://developers.cloudflare.com/workers/runtime-apis/fetch/
 *
 * Copyright (c) 2025 LoveDoLove
 * Licensed under the MIT License.
 */

/**
 * ============================================================================
 * CONFIGURATION SECTION - Customize these settings for your deployment
 * ============================================================================
 */

/**
 * Array of origin server configuration objects.
 *
 * REQUIRED fields:
 *   - url: The origin server URL (string). Examples:
 *           "https://server1.example.com"
 *           "https://192.168.1.100:8080"
 *           "https://cdn.example.com"
 *
 * OPTIONAL fields (with defaults):
 *   - weight: Relative traffic weight for load balancing (number, default: 1)
 *             Higher values = more traffic. Example: weight: 3 gets 3x traffic
 *   - backup: Indicates if the origin is a backup (boolean, default: false)
 *             Backup origins only receive traffic if primary origins fail
 *   - enabled: Indicates if the origin is active (boolean, default: true)
 *              Set to false to temporarily disable an origin without removing it
 *   - timeout: Request timeout in milliseconds (number, default: 10000)
 *              How long to wait for a response before failing over
 *   - headers: Custom headers to inject (object, default: {})
 *              Example: { "X-Custom-Header": "value" }
 *
 * CONFIGURATION EXAMPLES:
 *
 * Simple 2-server setup:
 * const ORIGINS = [
 *   { url: "https://server1.example.com", weight: 1 },
 *   { url: "https://server2.example.com", weight: 1 },
 * ];
 *
 * Weighted setup with backup:
 * const ORIGINS = [
 *   { url: "https://server1.example.com", weight: 3, backup: false },
 *   { url: "https://server2.example.com", weight: 2, backup: false },
 *   { url: "https://server3.example.com", weight: 1, backup: true },
 * ];
 *
 * Mixed with custom headers and timeouts:
 * const ORIGINS = [
 *   {
 *     url: "https://api.example.com",
 *     weight: 2,
 *     timeout: 8000,
 *     headers: { "X-API-Key": "secret123" }
 *   },
 *   {
 *     url: "https://api-backup.example.com",
 *     backup: true,
 *     timeout: 15000
 *   },
 * ];
 *
 * With temporarily disabled server:
 * const ORIGINS = [
 *   { url: "https://server1.example.com", weight: 1 },
 *   { url: "https://server2-maintenance.example.com", enabled: false },
 * ];
 */
const ORIGINS = [
  {
    url: "https://server1.example.com",
    weight: 3,
    backup: false,
    enabled: true,
    timeout: 10000,
    headers: {},
  },
  {
    url: "https://server2.example.com",
    weight: 1,
    backup: false,
    enabled: true,
    timeout: 10000,
    headers: {},
  },
  {
    url: "https://server3.example.com",
    weight: 1,
    backup: true,
    enabled: true,
    timeout: 10000,
    headers: {},
  },
];

/**
 * Global Configuration Options
 */
const CONFIG = {
  // Enable detailed logging for debugging (set to false in production for less logs)
  DEBUG: false,

  // Request timeout in milliseconds (can be overridden per-origin)
  DEFAULT_TIMEOUT: 10000,

  // Maximum number of retry attempts per pool
  MAX_RETRIES: 3,

  // Enable request ID tracking for debugging (kept false for minimal passthrough)
  TRACK_REQUESTS: false,

  // Custom headers to inject into all requests (optional)
  INJECT_HEADERS: {
    // Example: "X-Forwarded-By": "cloudflare-lb"
  },

  // Hop-by-hop headers to strip from outgoing requests
  REMOVE_REQUEST_HEADERS: [
    "connection",
    "proxy-connection",
    "keep-alive",
    "transfer-encoding",
    "te",
    "trailer",
    "upgrade",
    "host", // let fetch set host based on origin URL
  ],

  // Hop-by-hop headers to strip from origin responses
  REMOVE_RESPONSE_HEADERS: [
    "connection",
    "proxy-connection",
    "keep-alive",
    "transfer-encoding",
    "te",
    "trailer",
    "upgrade",
  ],

  // Health check endpoints available at: /{HEALTH_CHECK_PATH}
  HEALTH_CHECK_PATH: "health",

  // Stats endpoint available at: /{STATS_PATH}
  STATS_PATH: "_lb/stats",
};

/**
 * ============================================================================
 * UTILITY FUNCTIONS - Do not modify unless extending functionality
 * ============================================================================
 */

/**
 * Generates a unique request ID for tracking and debugging
 * @returns {string} Unique ID combining timestamp and random value
 */
function generateRequestId() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substring(2, 8);
  return `${timestamp}-${random}`;
}

/**
 * Logs a message with optional context (only when DEBUG is enabled)
 * @param {string} level - Log level (INFO, WARN, ERROR, DEBUG)
 * @param {string} message - Message to log
 * @param {object} context - Additional context data
 */
function log(level, message, context = {}) {
  if (level === "ERROR" || level === "WARN" || CONFIG.DEBUG) {
    const timestamp = new Date().toISOString();
    const contextStr = Object.keys(context).length
      ? JSON.stringify(context)
      : "";
    console.log(`[${timestamp}] [${level}] ${message} ${contextStr}`);
  }
}

/**
 * Validates the ORIGINS configuration
 * @throws {Error} If configuration is invalid
 */
function validateConfiguration() {
  if (!Array.isArray(ORIGINS) || ORIGINS.length === 0) {
    throw new Error(
      "ORIGINS must be a non-empty array. Check your configuration."
    );
  }

  const urlRegex = /^https?:\/\/.+/i;
  let hasEnabledOrigin = false;

  ORIGINS.forEach((origin, index) => {
    // Validate required fields
    if (!origin.url || typeof origin.url !== "string") {
      throw new Error(
        `Origin[${index}]: Missing or invalid "url" field. Must be a string.`
      );
    }

    if (!urlRegex.test(origin.url)) {
      throw new Error(
        `Origin[${index}]: Invalid URL "${origin.url}". Must start with http:// or https://`
      );
    }

    // Validate optional fields
    if (origin.weight !== undefined && typeof origin.weight !== "number") {
      throw new Error(`Origin[${index}]: "weight" must be a number`);
    }

    if (
      origin.timeout !== undefined &&
      (typeof origin.timeout !== "number" || origin.timeout < 1000)
    ) {
      throw new Error(
        `Origin[${index}]: "timeout" must be a number >= 1000 milliseconds`
      );
    }

    if (origin.backup !== undefined && typeof origin.backup !== "boolean") {
      throw new Error(`Origin[${index}]: "backup" must be a boolean`);
    }

    if (origin.enabled !== undefined && typeof origin.enabled !== "boolean") {
      throw new Error(`Origin[${index}]: "enabled" must be a boolean`);
    }

    if (origin.headers !== undefined && typeof origin.headers !== "object") {
      throw new Error(`Origin[${index}]: "headers" must be an object`);
    }

    // Apply defaults
    origin.weight = origin.weight || 1;
    origin.backup = origin.backup || false;
    origin.enabled = origin.enabled !== false;
    origin.timeout = origin.timeout || CONFIG.DEFAULT_TIMEOUT;
    origin.headers = origin.headers || {};

    // Track if at least one origin is enabled
    if (origin.enabled) {
      hasEnabledOrigin = true;
    }
  });

  if (!hasEnabledOrigin) {
    throw new Error(
      "No enabled origins found. Check that at least one origin has enabled: true"
    );
  }

  log("INFO", "Configuration validation successful", {
    originsCount: ORIGINS.length,
  });
}

/**
 * Sanitizes headers by removing hop-by-hop and problematic headers
 * @param {Headers} headers - Original headers
 * @returns {Headers} Sanitized headers
 */
function sanitizeHeaders(headers) {
  const h = new Headers(headers);

  // Remove hop-by-hop headers only; keep content-length and accept-encoding
  CONFIG.REMOVE_REQUEST_HEADERS.forEach((header) => {
    h.delete(header);
  });

  return h;
}

/**
 * Sanitizes response headers by removing hop-by-hop headers and set-cookie
 * (Set-Cookie is re-appended explicitly via forwardSetCookieHeaders)
 * @param {Headers} headers - Origin response headers
 * @returns {Headers} Sanitized headers
 */
function sanitizeResponseHeaders(headers) {
  const h = new Headers(headers);

  // Remove hop-by-hop headers only; preserve content-length and location
  CONFIG.REMOVE_RESPONSE_HEADERS.forEach((header) => {
    h.delete(header);
  });

  // Set-Cookie will be forwarded explicitly if present
  h.delete("set-cookie");

  return h;
}

/**
 * Forwards Set-Cookie headers explicitly (required by Cloudflare Workers)
 * Set-Cookie headers cannot be added with the standard Headers API
 * @param {Headers} originHeaders - Headers from the origin response
 * @param {Headers} targetHeaders - Target headers to modify
 */
function forwardSetCookieHeaders(originHeaders, targetHeaders) {
  for (const [key, value] of originHeaders.entries()) {
    if (key.toLowerCase() === "set-cookie") {
      targetHeaders.append("Set-Cookie", value);
    }
  }
}

/**
 * Selects an origin server using weighted random selection
 *
 * Algorithm:
 * 1. Calculate total weight of all origins
 * 2. Generate random number between 0 and total weight
 * 3. Iterate through origins, subtracting weight until random < 0
 * 4. Selected origin is returned
 *
 * Example distribution with weights [3, 1]:
 * - server1 (weight 3): 75% chance
 * - server2 (weight 1): 25% chance
 *
 * @param {Array<Object>} origins - Array of origin configuration objects
 * @returns {Object} The selected origin configuration object
 */
function selectWeightedRandomOrigin(origins) {
  if (!origins || origins.length === 0) {
    return null;
  }

  const totalWeight = origins.reduce((sum, o) => sum + (o.weight || 1), 0);
  let random = Math.random() * totalWeight;

  for (const origin of origins) {
    random -= origin.weight || 1;
    if (random < 0) {
      return origin;
    }
  }

  // Fallback (should rarely happen)
  return origins[0];
}

/**
 * Handles health check requests
 * Returns 200 OK if at least one origin is enabled
 *
 * Endpoint: GET /health or /YOUR_HEALTH_CHECK_PATH
 * Response: { "status": "ok", "origins": { "enabled": 2, "total": 3 } }
 *
 * @returns {Response} Health check response
 */
function handleHealthCheck() {
  const enabledCount = ORIGINS.filter((o) => o.enabled).length;
  const response = {
    status: enabledCount > 0 ? "ok" : "degraded",
    timestamp: new Date().toISOString(),
    origins: {
      enabled: enabledCount,
      total: ORIGINS.length,
    },
  };

  return new Response(JSON.stringify(response, null, 2), {
    status: enabledCount > 0 ? 200 : 503,
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Handles statistics requests
 * Returns current load balancer statistics
 *
 * Endpoint: GET /_lb/stats
 * Response: Configuration details and status information
 *
 * @returns {Response} Statistics response
 */
function handleStats() {
  const stats = {
    timestamp: new Date().toISOString(),
    config: {
      debug: CONFIG.DEBUG,
      defaultTimeout: CONFIG.DEFAULT_TIMEOUT,
      maxRetries: CONFIG.MAX_RETRIES,
    },
    origins: ORIGINS.map((o) => ({
      url: o.url,
      weight: o.weight,
      enabled: o.enabled,
      backup: o.backup,
      timeout: o.timeout,
    })),
    enabledOrigins: ORIGINS.filter((o) => o.enabled).length,
    primaryOrigins: ORIGINS.filter((o) => o.enabled && !o.backup).length,
    backupOrigins: ORIGINS.filter((o) => o.enabled && o.backup).length,
  };

  return new Response(JSON.stringify(stats, null, 2), {
    headers: { "Content-Type": "application/json" },
  });
}

/**
 * Main request handler that proxies requests to configured origins
 *
 * Flow:
 * 1. Validate incoming request
 * 2. Check for special endpoints (/health, /_lb/stats)
 * 3. Filter primary origins (enabled, not backup, reachable)
 * 4. Filter backup origins (enabled, is backup, reachable)
 * 5. Try primary origins first, then fallback to backup origins
 * 6. For each origin, sanitize headers and attempt fetch with timeout
 * 7. If successful, forward response (handling Set-Cookie headers)
 * 8. If all fail, return 502 Bad Gateway
 *
 * @param {Request} request - The incoming HTTP request object
 * @returns {Promise<Response>} The proxied response or error response
 */
async function handleRequest(request) {
  const requestId = CONFIG.TRACK_REQUESTS ? generateRequestId() : null;
  const startTime = Date.now();

  try {
    const url = new URL(request.url);
    const pathname = url.pathname;

    log("INFO", `Incoming request: ${request.method} ${pathname}`, {
      requestId,
      userAgent: request.headers.get("user-agent")?.substring(0, 50),
    });

    // Handle health check endpoint
    if (pathname === `/${CONFIG.HEALTH_CHECK_PATH}`) {
      log("INFO", "Health check requested", { requestId });
      return handleHealthCheck();
    }

    // Handle statistics endpoint
    if (pathname === `/${CONFIG.STATS_PATH}`) {
      log("INFO", "Statistics requested", { requestId });
      return handleStats();
    }

    // Get Cloudflare Worker's hostname to prevent self-proxying
    const workerHostname = url.hostname;

    // Filter origins by type and reachability
    const filterOrigins = (backup) =>
      ORIGINS.filter((o) => {
        if (!o.enabled) return false;
        if (o.backup !== !!backup) return false;

        // Prevent self-proxying
        try {
          const originHost = new URL(o.url).hostname;
          if (originHost === workerHostname) {
            log("WARN", `Skipping self-referential origin: ${o.url}`, {
              requestId,
            });
            return false;
          }
        } catch (err) {
          log("ERROR", `Invalid origin URL: ${o.url}`, { requestId });
          return false;
        }

        return true;
      });

    const primaryOrigins = filterOrigins(false);
    const backupOrigins = filterOrigins(true);

    log("DEBUG", "Origin pools created", {
      requestId,
      primaryCount: primaryOrigins.length,
      backupCount: backupOrigins.length,
    });

    if (primaryOrigins.length === 0 && backupOrigins.length === 0) {
      log("ERROR", "No available origins to route request", { requestId });
      return new Response(
        JSON.stringify({
          error: "Service Unavailable",
          message: "No origins available",
          requestId,
        }),
        {
          status: 503,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Track attempted origins to avoid re-trying the same one
    const attemptedOrigins = new Set();
    let lastError = null;
    let lastOrigin = null;

    // Try each pool: primary first, then backup
    for (const pool of [primaryOrigins, backupOrigins]) {
      const poolType = pool === primaryOrigins ? "primary" : "backup";

      for (let attempt = 0; attempt < pool.length; attempt++) {
        // Get available (not yet tried) origins from the current pool
        const availableOrigins = pool.filter(
          (o) => !attemptedOrigins.has(o.url)
        );

        if (availableOrigins.length === 0) break;

        // Use weighted random selection
        const selectedOrigin = selectWeightedRandomOrigin(availableOrigins);
        attemptedOrigins.add(selectedOrigin.url);
        lastOrigin = selectedOrigin;

        log("DEBUG", `Attempting ${poolType} origin`, {
          requestId,
          origin: selectedOrigin.url,
          attempt: attempt + 1,
          totalAttempts: pool.length,
        });

        try {
          // Build the proxied URL
          // Build origin URL (exclude fragment/hash, it is not sent to servers)
          const originUrl = selectedOrigin.url + url.pathname + url.search;

          // Prepare headers: sanitize incoming headers
          const headers = sanitizeHeaders(request.headers);

          // Inject custom headers from configuration
          Object.entries(CONFIG.INJECT_HEADERS).forEach(([key, value]) => {
            headers.set(key, value);
          });

          // Inject custom headers from origin configuration
          Object.entries(selectedOrigin.headers).forEach(([key, value]) => {
            headers.set(key, value);
          });

          // Do not add extra tracking headers when forwarding

          // Prepare request body
          let body = null;
          if (request.method !== "GET" && request.method !== "HEAD") {
            body = await request.arrayBuffer();
          }

          // Create fetch request with timeout
          const controller = new AbortController();
          let timeoutId;

          const fetchInit = {
            method: request.method,
            headers,
            body,
            // Use manual redirect so client receives 3xx and Location, preserving URL changes
            redirect: "manual",
            signal: controller.signal,
          };

          log("DEBUG", "Fetching from origin", {
            requestId,
            url: originUrl,
            method: request.method,
          });

          const startOriginTime = Date.now();
          timeoutId = setTimeout(
            () => controller.abort(),
            selectedOrigin.timeout
          );
          const response = await fetch(originUrl, fetchInit);
          clearTimeout(timeoutId);

          const originTime = Date.now() - startOriginTime;

          log("INFO", "Origin responded successfully", {
            requestId,
            origin: selectedOrigin.url,
            status: response.status,
            responseTime: `${originTime}ms`,
          });

          // Sanitize response headers and handle Set-Cookie specially
          const responseHeaders = sanitizeResponseHeaders(response.headers);
          const hasCookies = [...response.headers.keys()].some(
            (k) => k.toLowerCase() === "set-cookie"
          );

          if (hasCookies) {
            forwardSetCookieHeaders(response.headers, responseHeaders);
          }

          // Do not mutate response headers beyond required sanitation

          const totalTime = Date.now() - startTime;
          log("INFO", "Response prepared and ready to send", {
            requestId,
            totalTime: `${totalTime}ms`,
          });

          return new Response(response.body, {
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
          });
        } catch (err) {
          if (timeoutId) clearTimeout(timeoutId);
          const originTime = Date.now() - startTime;
          log("WARN", `Origin request failed: ${err.message}`, {
            requestId,
            origin: selectedOrigin.url,
            error: err.message,
            time: `${originTime}ms`,
          });
          lastError = err;
          // Continue to next origin
        }
      }
    }

    // All origins have been exhausted
    log("ERROR", "All origins failed", {
      requestId,
      attemptedCount: attemptedOrigins.size,
      lastError: lastError?.message,
      totalTime: `${Date.now() - startTime}ms`,
    });

    return new Response(
      JSON.stringify({
        error: "Bad Gateway",
        message: "All origins failed to respond",
        requestId,
        attemptedOrigins: Array.from(attemptedOrigins),
        lastError: lastError?.message,
      }),
      {
        status: 502,
        headers: {
          "Content-Type": "application/json",
          ...(requestId && { "X-Request-ID": requestId }),
        },
      }
    );
  } catch (err) {
    log("ERROR", `Unhandled error in request handler: ${err.message}`, {
      requestId,
      stack: err.stack?.substring(0, 200),
    });

    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: CONFIG.DEBUG ? err.message : "An error occurred",
        requestId,
      }),
      {
        status: 500,
        headers: {
          "Content-Type": "application/json",
          ...(requestId && { "X-Request-ID": requestId }),
        },
      }
    );
  }
}

/**
 * ============================================================================
 * INITIALIZATION & STARTUP
 * ============================================================================
 */

// Validate configuration on startup
try {
  validateConfiguration();
} catch (err) {
  console.error(
    "FATAL: Configuration validation failed:",
    err.message,
    "\n\nPlease check your ORIGINS configuration in worker.js"
  );
  // Note: The worker will still start but will return 500 errors
  // This allows you to fix the configuration without full deployment failure
}

/**
 * ============================================================================
 * CLOUDFLARE WORKER EVENT LISTENER
 * ============================================================================
 *
 * This is the entry point for all requests to the Cloudflare Worker.
 * It listens for "fetch" events and routes them through the handleRequest handler.
 *
 * In Cloudflare Workers, this is the standard way to handle HTTP requests.
 * The 'event.respondWith()' method sends the response back to the client.
 */
self.addEventListener("fetch", (event) => {
  event.respondWith(handleRequest(event.request));
});
