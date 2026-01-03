<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->

<a id="readme-top"></a>

<!-- PROJECT SHIELDS -->

[![Contributors][contributors-shield]][contributors-url]
[![Forks][forks-shield]][forks-url]
[![Stargazers][stars-shield]][stars-url]
[![Issues][issues-shield]][issues-url]
[![project_license][license-shield]][license-url]

<!-- PROJECT LOGO -->
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

<!-- TABLE OF CONTENTS -->
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

<!-- ABOUT THE PROJECT -->

## About The Project

This project provides a robust, production-ready Cloudflare Worker that acts as a high-performance HTTP load balancer. It allows you to distribute traffic across multiple origin servers based on configurable weights, with built-in support for failover to backup servers and maintenance modes.

Key Features:

- **Weighted Random Selection**: Distribute traffic proportionally across primary origins.
- **Automatic Failover**: Seamlessly routes traffic to backup origins if primary origins are unavailable or return errors.
- **Dynamic Configuration**: Configure origins, weights, timeouts, and headers via environment variables.
- **Health Monitoring**: Built-in `/health` and `/_lb/stats` endpoints for real-time status updates.
- **Header & Cookie Handling**: Accurate forwarding of request/response headers and `Set-Cookie` support.
- **Request Tracking**: Optional unique request IDs for end-to-end troubleshooting.
- **Security-First**: Sanitizes hop-by-hop headers and prevents origin URL leakage through Location header rewriting.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

- [![Cloudflare Workers][Cloudflare-badge]][Cloudflare-url]
- [![JavaScript][JS-badge]][JS-url]
- [![Vitest][Vitest-badge]][Vitest-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

To get your load balancer up and running, follow these steps.

### Prerequisites

You need the following installed:

- Node.js and npm
  ```sh
  npm install npm@latest -g
  ```
- Wrangler CLI
  ```sh
  npm install -g wrangler
  ```

### Installation

1. Clone the repo
   ```sh
   git clone https://github.com/LoveDoLove/cloudflare-load-balancer.git
   ```
2. Install NPM packages
   ```sh
   npm install
   ```
3. Update your origin configuration in `wrangler.jsonc` (see [Usage](#usage)).
4. Deploy to Cloudflare
   ```sh
   npm run deploy
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

## Usage

The load balancer is primarily configured through the `ORIGINS_CONFIG` variable in `wrangler.jsonc`. This allows you to update your infrastructure without redeploying code.

### Configuration Schema

An origin object can have the following properties:

| Property  | Type      | Default      | Description                                         |
| :-------- | :-------- | :----------- | :-------------------------------------------------- |
| `url`     | `string`  | **Required** | The destination origin URL (must include protocol). |
| `weight`  | `number`  | `1`          | Relative traffic weight (higher = more traffic).    |
| `backup`  | `boolean` | `false`      | If true, only used if all primary origins fail.     |
| `enabled` | `boolean` | `true`       | Quickly enable/disable an origin.                   |
| `timeout` | `number`  | `10000`      | Request timeout in milliseconds.                    |
| `headers` | `object`  | `{}`         | Custom headers to inject for this specific origin.  |

### Example `wrangler.jsonc`

```json
"vars": {
  "ORIGINS_CONFIG": "[{\"url\":\"https://primary-1.example.com\",\"weight\":3},{\"url\":\"https://primary-2.example.com\",\"weight\":1},{\"url\":\"https://backup.example.com\",\"backup\":true}]"
}
```

### Stats and Health

- **Health Check**: `GET /health` - Returns 200 OK if the system is functional.
- **System Stats**: `GET /_lb/stats` - Returns detailed information about current configuration and origin pools.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTRIBUTING -->

## Contributing

Contributions are what make the open source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

If you have a suggestion that would make this better, please fork the repo and create a pull request. You can also simply open an issue with the tag "enhancement".
Don't forget to give the project a star! Thanks again!

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

<!-- LICENSE -->

## License

Distributed under the Apache License 2.0. See `LICENSE` for more information.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- CONTACT -->

## Contact

LoveDoLove - [GitHub](https://github.com/LoveDoLove) - [Discord](https://discord.com/invite/FyYEmtRCRE)

Project Link: [https://github.com/LoveDoLove/cloudflare-load-balancer](https://github.com/LoveDoLove/cloudflare-load-balancer)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- ACKNOWLEDGMENTS -->

## Acknowledgments

- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Best-README-Template](https://github.com/othneildrew/Best-README-Template)

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- MARKDOWN LINKS & IMAGES -->

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
[Cloudflare-badge]: https://img.shields.io/badge/Cloudflare-F38020?style=for-the-badge&logo=Cloudflare&logoColor=white
[Cloudflare-url]: https://workers.cloudflare.com/
[JS-badge]: https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black
[JS-url]: https://developer.mozilla.org/en-US/docs/Web/JavaScript
[Vitest-badge]: https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white
[Vitest-url]: https://vitest.dev/
