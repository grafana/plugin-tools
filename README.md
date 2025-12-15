<div align="center">
  <img
    src="./docusaurus/website/static/img/logo.svg"
    alt="Grafana Logo"
    width="100px"
    padding="40px"
  />
  <h1>Grafana Plugin tools</h1>
  <p>Create and Sign Grafana plugins with ease.</p>
</div>
<div align="center">
  <a href="https://github.com/grafana/plugin-tools/actions/workflows/ci.yml">
    <img src="https://github.com/grafana/plugin-tools/actions/workflows/ci.yml/badge.svg" alt="Node CI" />
  </a>&nbsp;
  <a href="https://nodejs.org">
    <img src="https://img.shields.io/badge/NPM-%23CB3837.svg?style=for-the-badge&amp;logo=npm&amp;logoColor=white" alt="NPM" />
  </a>&nbsp;
  <a href="https://nx.dev/">
    <img src="https://img.shields.io/badge/nx-143055?style=for-the-badge&amp;logo=nx&amp;logoColor=white" alt="Nx" />
  </a>&nbsp;
  <a href="https://github.com/intuit/auto">
    <img src="https://img.shields.io/badge/release-auto.svg?colorA=888888&amp;colorB=9B065A&amp;label=auto" alt="Auto Release" />
  </a>
  <br />
  <br />
</div>

### Packages

This is a mono-repo of NPM packages to help plugin developers extend Grafana in amazing ways!

| Package Name                                                                       | Description                             | Version                                                                                                                             | Downloads                                                                                                                                       |
| ---------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| [**`@grafana/create-plugin`**](./packages/create-plugin/README.md)                 | A CLI tool for scaffolding a new plugin | [![npm](https://img.shields.io/npm/v/@grafana/create-plugin)](https://www.npmjs.com/package/@grafana/create-plugin)                 | [![npm](https://img.shields.io/npm/dw/@grafana/create-plugin)](https://npmcharts.com/compare/@grafana/create-plugin?interval=7)                 |
| [**`@grafana/sign-plugin`**](./packages/sign-plugin/README.md)                     | A CLI tool for signing plugins          | [![npm](https://img.shields.io/npm/v/@grafana/sign-plugin)](https://www.npmjs.com/package/@grafana/sign-plugin)                     | [![npm](https://img.shields.io/npm/dw/@grafana/sign-plugin)](https://npmcharts.com/compare/@grafana/sign-plugin?interval=7)                     |
| [**`@grafana/plugin-e2e`**](./packages/plugin-e2e/README.md)                       | Test Grafana plugins with playwright    | [![npm](https://img.shields.io/npm/v/@grafana/plugin-e2e)](https://www.npmjs.com/package/@grafana/plugin-e2e)                       | [![npm](https://img.shields.io/npm/dw/@grafana/plugin-e2e)](https://npmcharts.com/compare/@grafana/plugin-e2e?interval=7)                       |
| [**`@grafana/eslint-plugin-plugins`**](./packages/eslint-plugin-plugins/README.md) | Lint rules for Grafana plugins          | [![npm](https://img.shields.io/npm/v/@grafana/eslint-plugin-plugins)](https://www.npmjs.com/package/@grafana/eslint-plugin-plugins) | [![npm](https://img.shields.io/npm/dw/@grafana/eslint-plugin-plugins)](https://npmcharts.com/compare/@grafana/eslint-plugin-plugins?interval=7) |
| [**`@grafana/plugin-types-bundler`**](./packages/plugin-types-bundler/README.md)   | Bundle Grafana plugin typescript types  | [![npm](https://img.shields.io/npm/v/@grafana/plugin-types-bundler)](https://www.npmjs.com/package/@grafana/plugin-types-bundler)   | [![npm](https://img.shields.io/npm/dw/@grafana/plugin-types-bundler)](https://npmcharts.com/compare/@grafana/plugin-types-bundler?interval=7)   |
| [**`@grafana/tsconfig`**](./packages/tsconfig/README.md)                           | Grafana's typescript config             | [![npm](https://img.shields.io/npm/v/@grafana/tsconfig)](https://www.npmjs.com/package/@grafana/tsconfig)                           | [![npm](https://img.shields.io/npm/dw/@grafana/tsconfig)](https://npmcharts.com/compare/@grafana/tsconfig?interval=7)                           |

### Overview

This Mono-repo uses [NPM](https://nodejs.org) for package management, [NX](https://nx.dev/) to efficiently orchestrate tasks across the codebase, and [Auto](https://intuit.github.io/auto/) for streamlined and automated package publishing. We've carefully chosen and integrated these technologies to enhance development workflows. Before diving into the codebase, make sure to consult the [contributing guide](./CONTRIBUTING.md) for a smooth collaboration experience.

### Additional resources

📖 Learn from tutorials and documentation in the [Grafana developer portal](https://grafana.com/developers).<br/>
✨ Gain inspiration from our [plugin examples](https://github.com/grafana/grafana-plugin-examples/) to get started quickly and implement new features in your plugin.<br/>
🛠️ Use the [Grafana plugin SDK for Go](https://github.com/grafana/grafana-plugin-sdk-go) to simplify the development of backend components.<br/>
✅ Ensure your plugin is ready for publishing to the [Grafana plugin catalog](https://grafana.com/grafana/plugins/) with our [validator](https://github.com/grafana/plugin-validator/) tool.

## Contributors ✨

Thanks goes to these wonderful people ([emoji key](https://allcontributors.org/docs/en/emoji-key)):

<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="https://timur.digital/"><img src="https://avatars.githubusercontent.com/u/580672?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Timur Olzhabayev</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=tolzhabayev" title="Code">💻</a> <a href="#infra-tolzhabayev" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/grafana/plugin-tools/commits?author=tolzhabayev" title="Documentation">📖</a></td>
    <td align="center"><a href="https://guerra.in/"><img src="https://avatars.githubusercontent.com/u/16373015?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Giuseppe Guerra</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=xnyo" title="Code">💻</a></td>
    <td align="center"><a href="https://www.heywesty.com/"><img src="https://avatars.githubusercontent.com/u/73201?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jack Westbrook</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=jackw" title="Code">💻</a> <a href="https://github.com/grafana/plugin-tools/commits?author=jackw" title="Documentation">📖</a> <a href="#infra-jackw" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/grafana/plugin-tools/commits?author=jackw" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/sunker"><img src="https://avatars.githubusercontent.com/u/2388950?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Erik Sundell</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=sunker" title="Code">💻</a> <a href="#infra-sunker" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/grafana/plugin-tools/commits?author=sunker" title="Documentation">📖</a> <a href="https://github.com/grafana/plugin-tools/commits?author=sunker" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/sarahzinger"><img src="https://avatars.githubusercontent.com/u/6620164?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sarah Zinger</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=sarahzinger" title="Documentation">📖</a> <a href="https://github.com/grafana/plugin-tools/commits?author=sarahzinger" title="Code">💻</a></td>
    <td align="center"><a href="https://tomasbasham.dev/"><img src="https://avatars.githubusercontent.com/u/3389856?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tomas Basham</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=tomasbasham" title="Documentation">📖</a> <a href="https://github.com/grafana/plugin-tools/commits?author=tomasbasham" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/mckn"><img src="https://avatars.githubusercontent.com/u/172951?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Marcus Andersson</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=mckn" title="Documentation">📖</a> <a href="https://github.com/grafana/plugin-tools/commits?author=mckn" title="Tests">⚠️</a> <a href="https://github.com/grafana/plugin-tools/commits?author=mckn" title="Code">💻</a> <a href="#infra-mckn" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/iwysiu"><img src="https://avatars.githubusercontent.com/u/5421859?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Isabella Siu</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=iwysiu" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/romain-gaillard"><img src="https://avatars.githubusercontent.com/u/15131586?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Romain Gaillard</b></sub></a><br /><a href="#infra-romain-gaillard" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/grafana/plugin-tools/commits?author=romain-gaillard" title="Documentation">📖</a></td>
    <td align="center"><a href="https://leventebalogh.com/"><img src="https://avatars.githubusercontent.com/u/9974811?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Levente Balogh</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=leventebalogh" title="Code">💻</a> <a href="https://github.com/grafana/plugin-tools/commits?author=leventebalogh" title="Documentation">📖</a> <a href="#infra-leventebalogh" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/grafana/plugin-tools/commits?author=leventebalogh" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/academo"><img src="https://avatars.githubusercontent.com/u/227916?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Esteban Beltran</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=academo" title="Code">💻</a> <a href="https://github.com/grafana/plugin-tools/commits?author=academo" title="Documentation">📖</a> <a href="https://github.com/grafana/plugin-tools/commits?author=academo" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/sympatheticmoose"><img src="https://avatars.githubusercontent.com/u/19860021?v=4?s=100" width="100px;" alt=""/><br /><sub><b>David Harris</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=sympatheticmoose" title="Code">💻</a> <a href="https://github.com/grafana/plugin-tools/commits?author=sympatheticmoose" title="Documentation">📖</a> <a href="#infra-sympatheticmoose" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    <td align="center"><a href="https://bkgann.wordpress.com/"><img src="https://avatars.githubusercontent.com/u/7364245?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Brian Gann</b></sub></a><br /><a href="#infra-briangann" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    <td align="center"><a href="https://github.com/dprokop"><img src="https://avatars.githubusercontent.com/u/2376619?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Dominik Prokop</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=dprokop" title="Documentation">📖</a> <a href="#infra-dprokop" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/grafana/plugin-tools/commits?author=dprokop" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/josmperez"><img src="https://avatars.githubusercontent.com/u/45749060?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Joseph Perez</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=josmperez" title="Documentation">📖</a> <a href="#infra-josmperez" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/grafana/plugin-tools/commits?author=josmperez" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/sd2k"><img src="https://avatars.githubusercontent.com/u/5464991?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ben Sully</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=sd2k" title="Documentation">📖</a> <a href="https://github.com/grafana/plugin-tools/commits?author=sd2k" title="Code">💻</a></td>
    <td align="center"><a href="https://slorello.com/"><img src="https://avatars.githubusercontent.com/u/42971704?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Steve Lorello</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=slorello89" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/Ukochka"><img src="https://avatars.githubusercontent.com/u/20494436?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Yulia Shanyrova</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=Ukochka" title="Documentation">📖</a> <a href="#infra-Ukochka" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/grafana/plugin-tools/commits?author=Ukochka" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/aangelisc"><img src="https://avatars.githubusercontent.com/u/15019026?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Andreas Christou</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=aangelisc" title="Documentation">📖</a> <a href="https://github.com/grafana/plugin-tools/commits?author=aangelisc" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/mikkancso"><img src="https://avatars.githubusercontent.com/u/13637610?v=4?s=100" width="100px;" alt=""/><br /><sub><b>mikkancso</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=mikkancso" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/zoltanbedi"><img src="https://avatars.githubusercontent.com/u/13729989?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Zoltán Bedi</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=zoltanbedi" title="Documentation">📖</a> <a href="#infra-zoltanbedi" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/grafana/plugin-tools/commits?author=zoltanbedi" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/joanlopez"><img src="https://avatars.githubusercontent.com/u/5459617?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Joan López de la Franca Beltran</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=joanlopez" title="Code">💻</a></td>
    <td align="center"><a href="https://ludovic-muller.fr/"><img src="https://avatars.githubusercontent.com/u/9420561?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ludovic Muller</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=ludovicm67" title="Code">💻</a></td>
    <td align="center"><a href="https://grafana.com/"><img src="https://avatars.githubusercontent.com/u/43478413?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Grot (@grafanabot)</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=grafanabot" title="Code">💻</a> <a href="https://github.com/grafana/plugin-tools/commits?author=grafanabot" title="Documentation">📖</a> <a href="#infra-grafanabot" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    <td align="center"><a href="https://www.nersc.gov/"><img src="https://avatars.githubusercontent.com/u/91281131?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Nicolas Ventura</b></sub></a><br /><a href="#infra-6nv" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    <td align="center"><a href="https://oshirohugo.github.io/"><img src="https://avatars.githubusercontent.com/u/5558280?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Hugo Kiyodi Oshiro</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=oshirohugo" title="Code">💻</a> <a href="https://github.com/grafana/plugin-tools/commits?author=oshirohugo" title="Tests">⚠️</a> <a href="https://github.com/grafana/plugin-tools/commits?author=oshirohugo" title="Documentation">📖</a> <a href="#infra-oshirohugo" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a></td>
    <td align="center"><a href="https://github.com/kevinwcyu"><img src="https://avatars.githubusercontent.com/u/19530599?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Kevin Yu</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=kevinwcyu" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/ashharrison90"><img src="https://avatars.githubusercontent.com/u/20999846?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ashley Harrison</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=ashharrison90" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/ivanortegaalba"><img src="https://avatars.githubusercontent.com/u/5699976?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ivan Ortega Alba</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=ivanortegaalba" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/s4kh"><img src="https://avatars.githubusercontent.com/u/15072209?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Syerikjan Kh</b></sub></a><br /><a href="#infra-s4kh" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/grafana/plugin-tools/commits?author=s4kh" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/jalevin"><img src="https://avatars.githubusercontent.com/u/1669620?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Jeff Levin</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=jalevin" title="Documentation">📖</a> <a href="https://github.com/grafana/plugin-tools/commits?author=jalevin" title="Code">💻</a></td>
    <td align="center"><a href="http://matyax.com/"><img src="https://avatars.githubusercontent.com/u/1069378?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Matias Chomicki</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=matyax" title="Documentation">📖</a></td>
    <td align="center"><a href="http://www.hugohaggmark.com/"><img src="https://avatars.githubusercontent.com/u/562238?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Hugo Häggmark</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=hugohaggmark" title="Documentation">📖</a> <a href="#infra-hugohaggmark" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="https://github.com/grafana/plugin-tools/commits?author=hugohaggmark" title="Tests">⚠️</a> <a href="https://github.com/grafana/plugin-tools/commits?author=hugohaggmark" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/juanicabanas"><img src="https://avatars.githubusercontent.com/u/11707172?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Juan Cabanas</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=juanicabanas" title="Documentation">📖</a></td>
    <td align="center"><a href="https://mattcowley.co.uk/"><img src="https://avatars.githubusercontent.com/u/12371363?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Matt Cowley</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=MattIPv4" title="Tests">⚠️</a> <a href="https://github.com/grafana/plugin-tools/commits?author=MattIPv4" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/apps/renovate-sh-app"><img src="https://avatars.githubusercontent.com/u/7195757?v=4?s=100" width="100px;" alt=""/><br /><sub><b>renovate-sh-app[bot]</b></sub></a><br /><a href="https://github.com/grafana/plugin-tools/commits?author=renovate-sh-app[bot]" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

This project follows the [all-contributors](https://github.com/all-contributors/all-contributors) specification. Contributions of any kind welcome!
