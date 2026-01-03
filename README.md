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

This repository contains a high-performance Cloudflare Worker that implements an advanced HTTP load balancer. It proxies requests to multiple origin servers with features designed for reliability and flexibility.

Key Features:

- **Weighted Routing**: Distribute traffic across primary origins using configurable weights.
- **Automatic Failover**: Seamlessly switch to backup origins if all primary origins fail.
- **Origin Management**: Temporarily disable origins or adjust timeouts without code changes via environment variables.
- **Health & Stats**: Built-in endpoints for monitoring system status and configuration.
- **Header Sanitization**: Properly handles hop-by-hop headers and cookie forwarding.
- **Request Tracking**: Optional tracking IDs for end-to-end debugging.

<p align="right">(<a href="#readme-top">back to top</a>)</p>

### Built With

- [![Cloudflare Workers][Cloudflare-badge]][Cloudflare-url]
- [![JavaScript][JS-badge]][JS-url]
- [![Vitest][Vitest-badge]][Vitest-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- GETTING STARTED -->

## Getting Started

To deploy this load balancer, you'll need a Cloudflare account and the Wrangler CLI.

### Prerequisites

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
3. Update `wrangler.jsonc` with your configuration.
4. Deploy the worker
   ```sh
   npm run deploy
   ```

<p align="right">(<a href="#readme-top">back to top</a>)</p>

<!-- USAGE EXAMPLES -->

## Usage

The load balancer is configured via the `ORIGINS_CONFIG` environment variable in `wrangler.jsonc`. This variable accepts a JSON string array of origin objects.

Example configuration in `wrangler.jsonc`:

```json
"vars": {
  "ORIGINS_CONFIG": "[{\"url\":\"https://s1.example.com\",\"weight\":3,\"enabled\":true,\"timeout\":10000},{\"url\":\"https://s2.example.com\",\"weight\":1},{\"url\":\"https://backup.example.com\",\"backup\":true}]"
}
```

### Endpoints

- `/health`: Returns 200 OK if at least one origin is healthy.
- `/_lb/stats`: Returns current stats and configuration in JSON format.

_For more examples, please refer to the [Documentation](https://github.com/LoveDoLove/cloudflare-load-balancer)_

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

LoveDoLove - [GitHub](https://github.com/LoveDoLove)

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
