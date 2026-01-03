# Prompt Guide: Cloudflare Load Balancer (Wrangler Edition)

## Context Rules

When working on this project, ensure you:

- **ES Modules (ESM) Priority**: Always use `export default { fetch(request, env, ctx) }`. Do not use `addEventListener`.
- **Environment Bindings**: Use the `env` argument to access KV, D1, Secrets, and Vars.
- **Zero-Downtime Config**: Prioritize `wrangler.jsonc [vars]` for static origins and `env.DYNAMIC_CONFIG` (KV) for live overrides.
- **Asynchronous Processing**: Use `ctx.waitUntil()` for any work that doesn't block the response (logging, analytics, background health checks).

## Prompting Templates

### Feature Migration (Legacy -> ESM)

> "Migrate the [Component Name] from the root `worker.js` to `src/index.js`. Move global constants to `env` or `vars` where appropriate. Ensure the code follows the ESM structure."

### Dynamic Origin Management

> "Add logic to `src/index.js` to read origins from `env.ORIGINS` (JSON string in Vars). If an override exists in KV (`env.CONFIG_STORE`), merge it with the default list."

### Observability Patterns

> "Implement a structured logger that captures the origin URL, response status, and timing. Use `ctx.waitUntil()` to push this data to a logging endpoint or Analytics Engine."

## Platinum Standards

1. **Cost Efficiency**: Optimize for the Cloudflare Free Tier—cache KV reads in global memory to stay under 100k reads/day.
2. **Lean Execution**: Keep dependencies minimal. Use standard Web APIs (Fetch, Headers, Request) over npm packages.
3. **No Leaks**: Never expose origin hostnames or sensitive headers to the client. Always sanitize `Location` and `Set-Cookie` headers.
4. **Resiliency**: Implement "Circuit Breakers" to protect users from failing origins. Fail fast and move to the next healthy node.
