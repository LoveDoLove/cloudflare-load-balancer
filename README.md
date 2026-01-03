<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->

<a id="readme-top"></a>

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![License][license-shield]][license-url]

<br />
<div align="center">
  <a href="https://github.com/LoveDoLove/cloudflare-load-balancer">
    <img src="images/logo.png" alt="Logo" width="80" height="80">
  </a>

<h3 align="center">Cloudflare Worker Load Balancer</h3>

  <p align="center">
    Advanced load balancer using Cloudflare Workers with weighted, backup, and disabled origin support.
    <br />
    <a href="https://github.com/LoveDoLove/cloudflare-load-balancer"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/LoveDoLove/cloudflare-load-balancer">View Demo</a>
    &middot;
    <a href="https://github.com/LoveDoLove/cloudflare-load-balancer/issues/new?labels=bug&template=bug-report---.md">Report Bug</a>
    &middot;
    <a href="https://github.com/LoveDoLove/cloudflare-load-balancer/issues/new?labels=enhancement&template=feature-request---.md">Request Feature</a>
  </p>
</div>

<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>

## About The Project

This repository contains a Cloudflare Worker that implements an advanced HTTP load balancer. It proxies requests to multiple origin servers and includes features useful for production deployments:

- Weighted routing and weighted random selection of primary origins
- Backup origins (used only if primary origins fail)
- Temporarily disable origins without removing them
- Per-origin and global timeouts
- Automatic retries and configurable failure handling
- Health check and stats endpoints (/health and /\_lb/stats)
- Sanitize request/response headers and forward Set-Cookie headers properly
- Prevents self-proxying (skips origins that match the worker hostname)
- Configurable debug logging and request tracking

Configuration is handled in `worker.js` using a top-level `ORIGINS` array and a `CONFIG` object. The worker is designed to be deployed to Cloudflare's edge network using the Wrangler CLI.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

- [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- JavaScript (ES6)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Getting Started

To deploy this load balancer, you need a Cloudflare account and access to [Cloudflare Workers](https://workers.cloudflare.com/).

### Prerequisites

- [Node.js](https://nodejs.org/) (for local development and using Wrangler CLI)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (Cloudflare's Worker deployment tool)

Install dependencies:

```sh
npm install
```

### Installation & Deployment

1. **Fork/Clone** the repository:
   ```sh
   git clone https://github.com/LoveDoLove/cloudflare-load-balancer.git
   cd cloudflare-load-balancer
   ```
2. **Rename the Project**:
   Update the `name` field in `wrangler.jsonc` to your preferred Worker name (e.g., `"my-lb"`).
3. **Configure Origins**:
   Open `wrangler.jsonc` and update the `ORIGINS_CONFIG` variable under the `vars` section. This is a JSON string containing your origin servers.
   ```jsonc
   "vars": {
     "ORIGINS_CONFIG": "[{\"url\":\"https://server1.example.com\",\"weight\":3},{\"url\":\"https://server2.example.com\",\"weight\":1},{\"url\":\"https://server3.example.com\",\"backup\":true}]"
   }
   ```
4. **Login & Deploy**:
   ```sh
   npx wrangler login
   npm run deploy
   ```
5. **Set Custom Domain (Optional)**:
   In the Cloudflare Dashboard, go to your Worker -> **Triggers** -> **Custom Domains** and add your domain (e.g., `lb.yourdomain.com`).

### Testing Locally

You can run the worker locally using Vitest or Wrangler dev:

```sh
# Run the test suite
npm test

# Start local dev server
npm start
```

### Configuration Details

The project uses Cloudflare Workers **Module syntax**. All logic is in `src/index.js`, which dynamically reads origins from the environment.

- **ORIGINS_CONFIG**: A JSON string array of origin objects.

  - `url` (string): **Required**. The backend server URL.
  - `weight` (number): Traffic weight (default: 1).
  - `backup` (boolean): Use only if primary origins fail (default: false).
  - `enabled` (boolean): Enable/disable the origin (default: true).
  - `timeout` (number): Milliseconds to wait (default: 10000).
  - `headers` (object): Custom headers for this origin.

- **Global CONFIG**: Internal constants in `src/index.js` control debug logging, health check paths, and retry counts.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

Once deployed, the Worker will automatically proxy incoming requests to your configured origins, using weighted random selection and failover logic. You can update the `ORIGINS` array in `worker.js` to adjust routing behavior.

**Example configuration:**

```js
const ORIGINS = [
	{
		url: 'https://server1.example.com',
		weight: 3,
		backup: false,
		enabled: true,
	},
	{
		url: 'https://server2.example.com',
		weight: 1,
		backup: false,
		enabled: true,
	},
	{
		url: 'https://server3.example.com',
		weight: 1,
		backup: true,
		enabled: true,
	},
];
```

**How it works:**

- Requests are routed to enabled, non-backup origins using weighted random selection.
- If all primary origins fail, backup origins are tried.
- If all attempts fail, a 502 Bad Gateway response is returned.

### More details

- The worker strips hop-by-hop headers and can inject custom headers globally or per-origin.
- Set-Cookie headers from origin responses are forwarded explicitly (cloudflare worker header handling limitation).
- The worker tracks request IDs when enabled in `CONFIG.TRACK_REQUESTS` to assist debugging.
- A `validateConfiguration()` check runs on startup (errors are logged but the worker still starts; it's helpful for local validation before publishing).

For more details, see the code and comments in [`worker.js`](./worker.js).

## Health Check & Stats Endpoints

- Health Check: GET /{HEALTH_CHECK_PATH} (default `/health`) — Returns 200 OK if at least one origin is enabled. Response includes timestamp and origin counts.
- Stats: GET /{STATS_PATH} (default `/_lb/stats`) — Returns JSON with current configuration and origins statuses (weights, enabled/backup flags).

Example:

```sh
curl https://your-worker.example.workers.dev/health
curl https://your-worker.example.workers.dev/_lb/stats
```

These endpoints are useful for monitoring and integration with health check systems like UptimeRobot or external load balancers.

For more details, see the code and comments in [`worker.js`](./worker.js).

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contributing

Contributions are welcome! Please fork the repository and submit a pull request, or open an issue for suggestions and bug reports.

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Top contributors:

<a href="https://github.com/LoveDoLove/cloudflare-load-balancer/graphs/contributors">
  <img src="https://contrib.rocks/image?repo=LoveDoLove/cloudflare-load-balancer" alt="contrib.rocks image" />
</a>

## License

Distributed under the Apache License 2.0. See [`LICENSE`](./LICENSE) for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contact

LoveDoLove - [GitHub](https://github.com/LoveDoLove)

Project Link: [https://github.com/LoveDoLove/cloudflare-load-balancer](https://github.com/LoveDoLove/cloudflare-load-balancer)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Acknowledgments

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Best-README-Template](https://github.com/othneildrew/Best-README-Template)

## Security & Notes

- Avoid committing secrets or API keys to the repository; use environment variables or Cloudflare Secrets/Workers KV for sensitive values.
- Set-Cookie headers are forwarded explicitly, but review cookie security flags (Secure, HttpOnly, SameSite) at your origin before proxying.
- When using `CONFIG.DEBUG = true`, logs may expose internal state. Keep DEBUG off for production.

If you need a custom build or extensions, feel free to open an issue describing the feature.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

[contributors-shield]: https://img.shields.io/github/contributors/LoveDoLove/cloudflare-load-balancer.svg?style=for-the-badge
[contributors-url]: https://github.com/LoveDoLove/cloudflare-load-balancer/graphs/contributors
[forks-shield]: https://img.shields.io/github/forks/LoveDoLove/cloudflare-load-balancer.svg?style=for-the-badge
[forks-url]: https://github.com/LoveDoLove/cloudflare-load-balancer/network/members
[stars-shield]: https://img.shields.io/github/stars/LoveDoLove/cloudflare-load-balancer.svg?style=for-the-badge
[stars-url]: https://github.com/LoveDoLove/cloudflare-load-balancer/stargazers
[issues-shield]: https://img.shields.io/github/issues/LoveDoLove/cloudflare-load-balancer.svg?style=for-the-badge
[issues-url]: https://github.com/LoveDoLove/cloudflare-load-balancer/issues
[license-shield]: https://img.shields.io/github/license/LoveDoLove/cloudflare-load-balancer.svg?style=for-the-badge
[license-url]: https://github.com/LoveDoLove/cloudflare-load-balancer/blob/master/LICENSE
