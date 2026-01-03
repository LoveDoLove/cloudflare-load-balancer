import { env, createExecutionContext, waitOnExecutionContext, SELF } from 'cloudflare:test';
import { describe, it, expect } from 'vitest';
import worker from '../src';

describe('Load Balancer', () => {
	it('responds to health checks', async () => {
		const request = new Request('http://example.com/health');
		const ctx = createExecutionContext();
		const response = await worker.fetch(request, env, ctx);
		await waitOnExecutionContext(ctx);
		const data = await response.json();
		expect(response.status).toBe(200);
		expect(data.status).toBe('ok');
	});

	it('returns 502 Bad Gateway when all origins fail', async () => {
		// Since we use server1.example.com in wrangler.jsonc, and it won't resolve localy,
		// it should return a 502 with a JSON error.
		const response = await SELF.fetch('http://example.com/api/test');
		expect(response.status).toBe(502);
		const data = await response.json();
		expect(data.error).toBe('Bad Gateway');
	});
});
