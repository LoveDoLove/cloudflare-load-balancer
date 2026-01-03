# Project Analysis: Cloudflare Load Balancer

## Overview

This project is an **Advanced Load Balancer** transitioning to a **Wrangler-managed ES Module Worker**. It is designed to handle high-traffic distribution across multiple origins with a focus on zero-downtime reconfiguration and cost-effective edge logic.

## Technical Stack

- **Platform**: Cloudflare Workers (Standard/Managed)
- **Framework**: Wrangler v3+ (Wrangler-only project)
- **Syntax**: ES Modules (ESM)
- **Runtime APIs**: Fetch API, KV, D1 (Roadmapped), Vitest (Testing)
- **Deployment**: `npm run deploy` (Wrangler CLI)

## Core Features (v1.0 Legacy)

1. **Weighted Load Balancing**: Distributed distribution based on hardcoded weights (migrating to `vars`).
2. **Failover Logic**: Reactive failover during request handling (migrating to Circuit Breaker).
3. **Identity Management**: Unique `requestId` tracking for debugging.
4. **Safety**: Redirect rewriting and header sanitization to prevent origin leakage.

## Current State: Migration Phase

We are currently transitioning from a monolithic `worker.js` (Service Worker syntax) at the root to a modular ESM structure in `src/`.

### Active Roadmap (v2 "Edge Commander")

#### Phase 1: Modernization (Current Focus)

- [ ] Migrate `worker.js` core logic to `src/index.js` using ESM.
- [ ] Move `ORIGINS` array to `wrangler.jsonc` `vars` to allow zero-downtime updates.
- [ ] Implement in-memory caching for configuration to stay within KV free tier limits.

#### Phase 2: Intelligence

- [ ] **Circuit Breaker**: Auto-skip servers that fail multiple consecutive requests.
- [ ] **Sticky Sessions**: Cookie-based affinity for stateful session persistence.
- [ ] **Smart Routing**: Latency-based steering using `request.cf.region`.

#### Phase 3: Reliability & Ops

- [ ] **R2 Fallback**: Maintenance mode served from object storage if all origins fail.
- [ ] **Analytics Engine**: Push metrics to Cloudflare Analytics via `ctx.waitUntil`.

## Project Structure

- `src/index.js`: Main entry point (ESM).
- `worker.js`: Legacy Service Worker implementation (Reference only).
- `wrangler.jsonc`: Infrastructure configuration and environment variables.
- `PROMPT_GUIDE.md`: Guidelines for maintainable edge development.
