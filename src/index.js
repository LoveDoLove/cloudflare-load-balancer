/**
 * Global Configuration Options
 */
const CONFIG = {
	DEBUG: false,
	DEFAULT_TIMEOUT: 10000,
	MAX_RETRIES: 3,
	TRACK_REQUESTS: false,
	INJECT_HEADERS: {},
	REMOVE_REQUEST_HEADERS: ['connection', 'proxy-connection', 'keep-alive', 'transfer-encoding', 'te', 'trailer', 'upgrade', 'host'],
	REMOVE_RESPONSE_HEADERS: ['connection', 'proxy-connection', 'keep-alive', 'transfer-encoding', 'te', 'trailer', 'upgrade'],
	HEALTH_CHECK_PATH: 'health',
	STATS_PATH: '_lb/stats',
};

/**
 * UTILITY FUNCTIONS
 */

function generateRequestId() {
	const timestamp = Date.now().toString(36);
	const random = Math.random().toString(36).substring(2, 8);
	return `${timestamp}-${random}`;
}

function log(level, message, context = {}) {
	if (level === 'ERROR' || level === 'WARN' || CONFIG.DEBUG) {
		const timestamp = new Date().toISOString();
		const contextStr = Object.keys(context).length ? JSON.stringify(context) : '';
		console.log(`[${timestamp}] [${level}] ${message} ${contextStr}`);
	}
}

function validateOrigins(origins) {
	if (!Array.isArray(origins) || origins.length === 0) {
		throw new Error('ORIGINS must be a non-empty array.');
	}

	const urlRegex = /^https?:\/\/.+/i;
	let hasEnabledOrigin = false;

	origins.forEach((origin, index) => {
		if (!origin.url || typeof origin.url !== 'string') {
			throw new Error(`Origin[${index}]: Missing or invalid "url" field.`);
		}
		if (!urlRegex.test(origin.url)) {
			throw new Error(`Origin[${index}]: Invalid URL "${origin.url}".`);
		}

		origin.weight = origin.weight || 1;
		origin.backup = origin.backup || false;
		origin.enabled = origin.enabled !== false;
		origin.timeout = origin.timeout || CONFIG.DEFAULT_TIMEOUT;
		origin.headers = origin.headers || {};

		if (origin.enabled) hasEnabledOrigin = true;
	});

	if (!hasEnabledOrigin) {
		throw new Error('No enabled origins found.');
	}

	return origins;
}

function sanitizeHeaders(headers) {
	const h = new Headers(headers);
	CONFIG.REMOVE_REQUEST_HEADERS.forEach((header) => h.delete(header));
	return h;
}

function sanitizeResponseHeaders(headers) {
	const h = new Headers(headers);
	CONFIG.REMOVE_RESPONSE_HEADERS.forEach((header) => h.delete(header));
	h.delete('set-cookie');
	return h;
}

function forwardSetCookieHeaders(originHeaders, targetHeaders) {
	for (const [key, value] of originHeaders.entries()) {
		if (key.toLowerCase() === 'set-cookie') {
			targetHeaders.append('Set-Cookie', value);
		}
	}
}

function rewriteLocation(locationValue, requestUrl, originUrl) {
	try {
		const requestHostUrl = new URL(requestUrl);
		const originHostUrl = new URL(originUrl);
		const locationUrl = new URL(locationValue, originUrl);

		if (locationUrl.hostname === originHostUrl.hostname) {
			locationUrl.hostname = requestHostUrl.hostname;
			locationUrl.port = requestHostUrl.port;
			locationUrl.protocol = requestHostUrl.protocol;
		}
		return locationUrl.toString();
	} catch (err) {
		return locationValue;
	}
}

function selectWeightedRandomOrigin(origins) {
	if (!origins || origins.length === 0) return null;
	const totalWeight = origins.reduce((sum, o) => sum + (o.weight || 1), 0);
	let random = Math.random() * totalWeight;
	for (const origin of origins) {
		random -= origin.weight || 1;
		if (random < 0) return origin;
	}
	return origins[0];
}

function handleHealthCheck(origins) {
	const enabledCount = origins.filter((o) => o.enabled).length;
	const response = {
		status: enabledCount > 0 ? 'ok' : 'degraded',
		timestamp: new Date().toISOString(),
		origins: { enabled: enabledCount, total: origins.length },
	};
	return new Response(JSON.stringify(response, null, 2), {
		status: enabledCount > 0 ? 200 : 503,
		headers: { 'Content-Type': 'application/json' },
	});
}

function handleStats(origins) {
	const stats = {
		timestamp: new Date().toISOString(),
		config: CONFIG,
		origins: origins.map((o) => ({
			url: o.url,
			weight: o.weight,
			enabled: o.enabled,
			backup: o.backup,
			timeout: o.timeout,
		})),
		enabledOrigins: origins.filter((o) => o.enabled).length,
		primaryOrigins: origins.filter((o) => o.enabled && !o.backup).length,
		backupOrigins: origins.filter((o) => o.enabled && o.backup).length,
	};
	return new Response(JSON.stringify(stats, null, 2), {
		headers: { 'Content-Type': 'application/json' },
	});
}

/**
 * Main handleRequest function
 */
async function handleRequest(request, env) {
	let origins;
	try {
		if (!env.ORIGINS_CONFIG) {
			throw new Error('Missing ORIGINS_CONFIG environment variable.');
		}
		origins = validateOrigins(JSON.parse(env.ORIGINS_CONFIG));
	} catch (err) {
		log('ERROR', `Configuration Error: ${err.message}`);
		return new Response(JSON.stringify({ error: 'Configuration Error', message: err.message }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}

	const requestId = CONFIG.TRACK_REQUESTS ? generateRequestId() : null;
	const startTime = Date.now();

	try {
		const url = new URL(request.url);
		const pathname = url.pathname;

		if (pathname === `/${CONFIG.HEALTH_CHECK_PATH}`) return handleHealthCheck(origins);
		if (pathname === `/${CONFIG.STATS_PATH}`) return handleStats(origins);

		const workerHostname = url.hostname;
		const filterOrigins = (backup) =>
			origins.filter((o) => {
				if (!o.enabled || o.backup !== !!backup) return false;
				try {
					if (new URL(o.url).hostname === workerHostname) return false;
				} catch {
					return false;
				}
				return true;
			});

		const primaryOrigins = filterOrigins(false);
		const backupOrigins = filterOrigins(true);

		if (primaryOrigins.length === 0 && backupOrigins.length === 0) {
			return new Response(JSON.stringify({ error: 'Service Unavailable', message: 'No origins available', requestId }), {
				status: 503,
				headers: { 'Content-Type': 'application/json' },
			});
		}

		const attemptedOrigins = new Set();
		let lastError = null;

		for (const pool of [primaryOrigins, backupOrigins]) {
			for (let attempt = 0; attempt < pool.length; attempt++) {
				const availableOrigins = pool.filter((o) => !attemptedOrigins.has(o.url));
				if (availableOrigins.length === 0) break;

				const selectedOrigin = selectWeightedRandomOrigin(availableOrigins);
				attemptedOrigins.add(selectedOrigin.url);

				try {
					const originUrl = selectedOrigin.url + url.pathname + url.search;
					const headers = sanitizeHeaders(request.headers);
					Object.entries(CONFIG.INJECT_HEADERS).forEach(([k, v]) => headers.set(k, v));
					Object.entries(selectedOrigin.headers).forEach(([k, v]) => headers.set(k, v));

					let body = null;
					if (request.method !== 'GET' && request.method !== 'HEAD') body = await request.arrayBuffer();

					const controller = new AbortController();
					const timeoutId = setTimeout(() => controller.abort(), selectedOrigin.timeout);

					const response = await fetch(originUrl, {
						method: request.method,
						headers,
						body,
						redirect: 'manual',
						signal: controller.signal,
					});
					clearTimeout(timeoutId);

					const responseHeaders = sanitizeResponseHeaders(response.headers);
					const locationHeader = responseHeaders.get('location');
					if (locationHeader) {
						responseHeaders.set('Location', rewriteLocation(locationHeader, request.url, originUrl));
					}
					forwardSetCookieHeaders(response.headers, responseHeaders);

					return new Response(response.body, {
						status: response.status,
						statusText: response.statusText,
						headers: responseHeaders,
					});
				} catch (err) {
					lastError = err;
				}
			}
		}

		return new Response(
			JSON.stringify({
				error: 'Bad Gateway',
				message: 'All origins failed',
				requestId,
				lastError: lastError?.message,
			}),
			{
				status: 502,
				headers: { 'Content-Type': 'application/json' },
			}
		);
	} catch (err) {
		return new Response(JSON.stringify({ error: 'Internal Error', message: err.message, requestId }), {
			status: 500,
			headers: { 'Content-Type': 'application/json' },
		});
	}
}

export default {
	async fetch(request, env, ctx) {
		return handleRequest(request, env);
	},
};
