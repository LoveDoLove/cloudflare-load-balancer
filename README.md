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

This project implements an advanced load balancer using [Cloudflare Workers](https://developers.cloudflare.com/workers/). It proxies requests to multiple origin servers, supporting weighted routing, backup origins, and disabled origins. The configuration is managed in a single JavaScript file (`worker.js`).

**Key Features:**

- Weighted random selection of primary origins
- Automatic failover to backup origins
- Easy configuration of enabled/disabled origins
- Simple deployment to Cloudflare's edge network

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

Install Wrangler globally:

```sh
npm install -g wrangler
```

### Installation

1. Clone the repository:
   ```sh
   git clone https://github.com/LoveDoLove/cloudflare-load-balancer.git
   cd cloudflare-load-balancer
   ```
2. Configure your origins in `worker.js`:
   ```js
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
   ];
   ```
3. Authenticate Wrangler with your Cloudflare account:
   ```sh
   wrangler login
   ```
4. Publish the Worker:
   ```sh
   wrangler publish
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Usage

Once deployed, the Worker will automatically proxy incoming requests to your configured origins, using weighted random selection and failover logic. You can update the `ORIGINS` array in `worker.js` to adjust routing behavior.

**Example configuration:**

```js
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
];
```

**How it works:**

- Requests are routed to enabled, non-backup origins using weighted random selection.
- If all primary origins fail, backup origins are tried.
- If all attempts fail, a 502 Bad Gateway response is returned.

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

Distributed under the MIT License. See [`LICENSE`](./LICENSE) for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Contact

LoveDoLove - [GitHub](https://github.com/LoveDoLove)

Project Link: [https://github.com/LoveDoLove/cloudflare-load-balancer](https://github.com/LoveDoLove/cloudflare-load-balancer)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

## Acknowledgments

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Best-README-Template](https://github.com/othneildrew/Best-README-Template)

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
