# Prompt Guide: Cloudflare Load Balancer

## Context Rules

When working on this project, ensure you:

- **Prioritize Cloudflare Workers Ecosystem**: All code must be compatible with the Workers runtime (no Node.js specific modules like `fs` or `path`).
- **Handle Headers Correctly**: Always account for hop-by-hop headers and the specific `Set-Cookie` behavior in Workers.
- **Maintain Configuration Pattern**: Keep the `ORIGINS` and `CONFIG` structure unless explicitly asked to refactor to ES Modules/Environment variables.

## Prompting Templates

### New Origin Addition

> "Add a new origin to the `ORIGINS` array in `worker.js`. URL: [URL], Weight: [Weight], Backup: [true/false]. Ensure it follows the existing validation logic."

### Logic Modification

> "Modify the `handleRequest` flow in `worker.js` to [Description]. Maintain the existing logging and error handling patterns (using the `log` utility)."

### Debugging

> "Debug why [Issue] is occurring in `worker.js`. Enable `CONFIG.DEBUG` and `CONFIG.TRACK_REQUESTS` in your analysis and check the log outputs."

## Platinum Standards

1. **Accurate Logging**: Every failover or retry must be logged with `requestId`.
2. **Lean Execution**: Minimize memory overhead; avoid large dependencies.
3. **Resiliency**: Always assume origins might fail; never skip the fallback logic.
4. **No Leaks**: Never expose origin IP/URLs in redirect headers (`Location`).
5. **Cookie Integrity**: Never lose a `Set-Cookie` header during the proxy process.
