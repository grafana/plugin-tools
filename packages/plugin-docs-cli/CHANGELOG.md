# Changelog

## [0.13.0](https://github.com/grafana/plugin-tools/compare/@grafana/plugin-docs-cli@0.12.0...@grafana/plugin-docs-cli@0.13.0) (2026-10-22)


### Features

* **create-plugin:** scaffold docs snippets with fallback text ([#3021](https://github.com/grafana/plugin-tools/issues/3021)) ([7ef65e4](https://github.com/grafana/plugin-tools/commit/7ef65e418a9ed5951d62184954511297196aa0ee))

## [0.12.0](https://github.com/grafana/plugin-tools/compare/@grafana/plugin-docs-cli@0.11.0...@grafana/plugin-docs-cli@0.12.0) (2026-10-21)


### Features

* **plugin-docs-parser:** render shared snippets in plugin docs ([#2995](https://github.com/grafana/plugin-tools/issues/2995)) ([3d8f526](https://github.com/grafana/plugin-tools/commit/3d8f526ccc7b9c3e18023a4e5c7d5e3f10257eae))


### Bug Fixes

* **deps:** Update dependency ejs to v7.0.2 ([#3012](https://github.com/grafana/plugin-tools/issues/3012)) ([9fc2dea](https://github.com/grafana/plugin-tools/commit/9fc2dea7d3892d8ea7ea37d90e81428bd0c78b7c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @grafana/plugin-docs-parser bumped from 0.5.0 to 0.6.0

## [0.11.0](https://github.com/grafana/plugin-tools/compare/@grafana/plugin-docs-cli@0.10.0...@grafana/plugin-docs-cli@0.11.0) (2026-10-21)


### Features

* **plugin-docs-cli:** add validate --dist for built docs ([#3007](https://github.com/grafana/plugin-tools/issues/3007)) ([d1b68c9](https://github.com/grafana/plugin-tools/commit/d1b68c9a6d020aa0261989efc094fa7fd9ab4505))
* **plugin-docs-cli:** support keywords frontmatter ([#3001](https://github.com/grafana/plugin-tools/issues/3001)) ([9e837c0](https://github.com/grafana/plugin-tools/commit/9e837c019d3749e5d551293c7e4ee371423bc928))


### Bug Fixes

* **plugin-docs-cli:** skip fenced code blocks when checking for h1 headings ([#3002](https://github.com/grafana/plugin-tools/issues/3002)) ([5e22c65](https://github.com/grafana/plugin-tools/commit/5e22c6568edaebd308e1c61825081a56b11aaa32))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @grafana/plugin-docs-parser bumped from 0.4.1 to 0.5.0

## [0.10.0](https://github.com/grafana/plugin-tools/compare/@grafana/plugin-docs-cli@0.9.0...@grafana/plugin-docs-cli@0.10.0) (2026-10-19)


### Features

* **create-plugin:** support app plugins in add docs codemod ([#3000](https://github.com/grafana/plugin-tools/issues/3000)) ([46703b6](https://github.com/grafana/plugin-tools/commit/46703b694dd9d38166dc1a82b77ac3534a5a37d8))
* **create-plugin:** support data sources in `add docs` codemod ([#2993](https://github.com/grafana/plugin-tools/issues/2993)) ([01e0b4c](https://github.com/grafana/plugin-tools/commit/01e0b4c1e9d8bbed2308de0b600499319cf61be5))

## [0.9.0](https://github.com/grafana/plugin-tools/compare/@grafana/plugin-docs-cli@0.8.0...@grafana/plugin-docs-cli@0.9.0) (2026-10-19)


### Features

* **create-plugin:** add docs codemod ([#2834](https://github.com/grafana/plugin-tools/issues/2834)) ([2a173ca](https://github.com/grafana/plugin-tools/commit/2a173caa5be5dfe5a901eef138f9239cdca7ae05))

## [0.8.0](https://github.com/grafana/plugin-tools/compare/@grafana/plugin-docs-cli@0.7.0...@grafana/plugin-docs-cli@0.8.0) (2026-10-15)


### ⚠ BREAKING CHANGES

* **plugin-docs-cli:** require configure page for data sources ([#2985](https://github.com/grafana/plugin-tools/issues/2985))

### Features

* **plugin-docs-cli:** require configure page for data sources ([#2985](https://github.com/grafana/plugin-tools/issues/2985)) ([b4715b8](https://github.com/grafana/plugin-tools/commit/b4715b834e353b1df89eea589ffd527a1e17712d))


### Bug Fixes

* **deps:** Update dependency ejs to v7 ([#2965](https://github.com/grafana/plugin-tools/issues/2965)) ([5a6c44e](https://github.com/grafana/plugin-tools/commit/5a6c44e04fa81cb0685ea198ae0dee1ce3c64a7e))
* **plugin-docs-cli:** skip meta files in builds and report briefs as suggestions ([#2986](https://github.com/grafana/plugin-tools/issues/2986)) ([c21afe7](https://github.com/grafana/plugin-tools/commit/c21afe79f10eb43ad9d497a4aaa7dd1a2db5cac5))
* **plugin-docs-cli:** skip only whole node_modules and dist folders ([#2984](https://github.com/grafana/plugin-tools/issues/2984)) ([698533d](https://github.com/grafana/plugin-tools/commit/698533dcc72fa39cee1ae5c1e657200614fca9b9))
* **plugin-docs:** pin dependencies for better security ([#2976](https://github.com/grafana/plugin-tools/issues/2976)) ([98c1323](https://github.com/grafana/plugin-tools/commit/98c13230224b8fa87aed02d0e9d5e7279c592916))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @grafana/plugin-docs-parser bumped from 0.4.0 to 0.4.1

## [0.7.0](https://github.com/grafana/plugin-tools/compare/@grafana/plugin-docs-cli@0.6.0...@grafana/plugin-docs-cli@0.7.0) (2026-10-13)


### Features

* **plugin-docs-cli:** drop strict mode so serve matches validate ([#2961](https://github.com/grafana/plugin-tools/issues/2961)) ([f0c6ec3](https://github.com/grafana/plugin-tools/commit/f0c6ec3210da5f3f78e393b5d1971326c52e1ef2))
* **plugin-docs-cli:** ship plugin docs guides with the package ([#2963](https://github.com/grafana/plugin-tools/issues/2963)) ([6ccda39](https://github.com/grafana/plugin-tools/commit/6ccda3975d0453adc7888f3d59d65b1e7cbb6196))


### Bug Fixes

* **deps:** Update dependency github-slugger to v2 ([#2803](https://github.com/grafana/plugin-tools/issues/2803)) ([39cdcc9](https://github.com/grafana/plugin-tools/commit/39cdcc934c0d2ff87908af5292dd9a184ffb9553))

## [0.6.0](https://github.com/grafana/plugin-tools/compare/@grafana/plugin-docs-cli@0.5.0...@grafana/plugin-docs-cli@0.6.0) (2026-10-09)


### Features

* **plugin-docs-cli:** support Node 22 ([#2936](https://github.com/grafana/plugin-tools/issues/2936)) ([62aba57](https://github.com/grafana/plugin-tools/commit/62aba578f32edba6c71155ff8df4ca6960981d8b))
* **plugin-docs:** add callouts and a supported markdown guide ([#2935](https://github.com/grafana/plugin-tools/issues/2935)) ([dea07b0](https://github.com/grafana/plugin-tools/commit/dea07b0f0f205ea9952870690e068a4d62a374f3))
* **plugin-docs:** add collapsible sections and table line breaks ([#2942](https://github.com/grafana/plugin-tools/issues/2942)) ([8eed737](https://github.com/grafana/plugin-tools/commit/8eed73799134a6c32adc94193902fee0a94c6075))
* **plugin-docs:** add syntax highlighting ([#2940](https://github.com/grafana/plugin-tools/issues/2940)) ([72c9a2c](https://github.com/grafana/plugin-tools/commit/72c9a2c9e6bc3575ccfa7b9a9941428fc201e3d3))
* **plugin-docs:** add youtube embeds and short videos ([#2941](https://github.com/grafana/plugin-tools/issues/2941)) ([484c881](https://github.com/grafana/plugin-tools/commit/484c88129e774204f9c535e188f13213a295d16e))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @grafana/plugin-docs-parser bumped from ^0.3.1 to ^0.4.0

## [0.5.0](https://github.com/grafana/plugin-tools/compare/@grafana/plugin-docs-cli@0.4.0...@grafana/plugin-docs-cli@0.5.0) (2026-10-06)


### Features

* **plugin-docs-cli:** align preview with catalog-website layout ([#2913](https://github.com/grafana/plugin-tools/issues/2913)) ([c78f171](https://github.com/grafana/plugin-tools/commit/c78f171baf8d065f9dd24fd2e643d4d210dab500))
* **plugin-docs-cli:** allow ../ links that stay in the docs folder ([#2917](https://github.com/grafana/plugin-tools/issues/2917)) ([0ccb386](https://github.com/grafana/plugin-tools/commit/0ccb386e80250a0ae684602c11062bb2167d1927))
* **plugin-docs-cli:** reject a custom slug on the root index.md ([#2915](https://github.com/grafana/plugin-tools/issues/2915)) ([752f68e](https://github.com/grafana/plugin-tools/commit/752f68ebca197dfaa434e33da7f97b78465a14f1))
* **plugin-docs-cli:** require typed pages per plugin type ([#2910](https://github.com/grafana/plugin-tools/issues/2910)) ([ab8d63c](https://github.com/grafana/plugin-tools/commit/ab8d63cf55b1dc6d244d66c27566b5d13185728d))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @grafana/plugin-docs-parser bumped from ^0.3.0 to ^0.3.1

## [0.4.0](https://github.com/grafana/plugin-tools/compare/@grafana/plugin-docs-cli@0.3.0...@grafana/plugin-docs-cli@0.4.0) (2026-09-22)


### Features

* **plugin-docs-cli:** add writing-style validation rules ([#2866](https://github.com/grafana/plugin-tools/issues/2866)) ([4668e57](https://github.com/grafana/plugin-tools/commit/4668e57b7f043420198c1bf79b03c739d5c7aff3))

## [0.3.0](https://github.com/grafana/plugin-tools/compare/@grafana/plugin-docs-cli@0.2.2...@grafana/plugin-docs-cli@0.3.0) (2026-09-16)


### Features

* **plugin-docs-cli:** add docs-path, size and SEO length validation rules ([#2864](https://github.com/grafana/plugin-tools/issues/2864)) ([bb1c414](https://github.com/grafana/plugin-tools/commit/bb1c4140b11e652c9381eaf4b65959019199c4b6))
* **plugin-docs-cli:** inline content into the manifest ([#2875](https://github.com/grafana/plugin-tools/issues/2875)) ([0f5a6d1](https://github.com/grafana/plugin-tools/commit/0f5a6d1dc362b40aa6b12fc2689a5f5c7ffa748e))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @grafana/plugin-docs-parser bumped from ^0.2.0 to ^0.3.0

## [0.2.2](https://github.com/grafana/plugin-tools/compare/@grafana/plugin-docs-cli@0.2.1...@grafana/plugin-docs-cli@0.2.2) (2026-08-21)


### Bug Fixes

* **plugin-docs-cli:** treat AGENTS.md as a repo-meta file ([#2845](https://github.com/grafana/plugin-tools/issues/2845)) ([1b52480](https://github.com/grafana/plugin-tools/commit/1b52480ad08487057fba45eb89b5e49eba205120))

## [0.2.1](https://github.com/grafana/plugin-tools/compare/@grafana/plugin-docs-cli@0.2.0...@grafana/plugin-docs-cli@0.2.1) (2026-08-21)


### Bug Fixes

* **plugin-docs-cli:** mask inline code before HTML checks ([#2840](https://github.com/grafana/plugin-tools/issues/2840)) ([3cd0785](https://github.com/grafana/plugin-tools/commit/3cd078521d109f53bbb52e175f8ad8ca43637b5a))
* **plugin-docs-cli:** skip repo-meta files during docs scanning and validation ([#2833](https://github.com/grafana/plugin-tools/issues/2833)) ([0e10c49](https://github.com/grafana/plugin-tools/commit/0e10c4907a18314ea0dd529091f16ca542e71d4d))

## [0.2.0](https://github.com/grafana/plugin-tools/compare/@grafana/plugin-docs-cli@0.1.0...@grafana/plugin-docs-cli@0.2.0) (2026-07-09)


### Features

* **plugin-docs-cli:** Extract TOC headings at build time ([#2744](https://github.com/grafana/plugin-tools/issues/2744)) ([0a05680](https://github.com/grafana/plugin-tools/commit/0a05680e7961c52fcf68e567a5e58ffb1c4ae8e7))


### Bug Fixes

* **plugin-docs-cli:** limit doc page nesting to 3  ([#2745](https://github.com/grafana/plugin-tools/issues/2745)) ([95bb69a](https://github.com/grafana/plugin-tools/commit/95bb69a3011343948e2450db9afa6c9c14b79c1c))


### Dependencies

* The following workspace dependencies were updated
  * dependencies
    * @grafana/plugin-docs-parser bumped from ^0.1.0 to ^0.2.0

## v0.0.12 (Tue May 26 2026)

#### 🐛 Bug Fix

- Plugin Docs: Resolve relative asset paths from doc file directory [#2611](https://github.com/grafana/plugin-tools/pull/2611) ([@sunker](https://github.com/sunker))

#### Authors: 1

- Erik Sundell ([@sunker](https://github.com/sunker))

---

## v0.0.11 (Tue May 26 2026)

#### 🐛 Bug Fix

- Plugin Docs CLI: Always sort root index.md first in manifest [#2636](https://github.com/grafana/plugin-tools/pull/2636) ([@sunker](https://github.com/sunker))

#### Authors: 1

- Erik Sundell ([@sunker](https://github.com/sunker))

---

## v0.0.10 (Thu Mar 19 2026)

#### 🐛 Bug Fix

- Plugin Docs: Publish packages to NPM [#2537](https://github.com/grafana/plugin-tools/pull/2537) ([@sunker](https://github.com/sunker))

#### Authors: 1

- Erik Sundell ([@sunker](https://github.com/sunker))

---

## 0.0.1 (Unreleased)

### Features

- Package structure created
