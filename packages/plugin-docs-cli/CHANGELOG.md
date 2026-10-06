# Changelog

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
