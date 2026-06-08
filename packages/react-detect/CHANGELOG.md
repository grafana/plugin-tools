# Changelog

## [0.8.0](https://github.com/grafana/plugin-tools/compare/react-detect@0.7.0...react-detect@0.8.0) (2026-06-08)


### Features

* add --distDir arg to specify built plugin directory ([#2558](https://github.com/grafana/plugin-tools/issues/2558)) ([810a82b](https://github.com/grafana/plugin-tools/commit/810a82ba711e3a832a1a94903b3e28a0b61fc1df))
* add arg to prevent exit code 1 and improve json output ([#2406](https://github.com/grafana/plugin-tools/issues/2406)) ([455eba6](https://github.com/grafana/plugin-tools/commit/455eba6abe1e03797c8c981f8320b315b95d4f78))
* allow skipping dependency and build tooling analysis ([#2397](https://github.com/grafana/plugin-tools/issues/2397)) ([bcc2e27](https://github.com/grafana/plugin-tools/commit/bcc2e275733fe5a92579a7a5cc043db301ca93c1))
* externalize jsx-runtime ([#2448](https://github.com/grafana/plugin-tools/issues/2448)) ([d430c12](https://github.com/grafana/plugin-tools/commit/d430c127e628e0bc992de2082a841040d7fc822d))
* support reading lock files for plugins in monorepos ([#2454](https://github.com/grafana/plugin-tools/issues/2454)) ([18310ce](https://github.com/grafana/plugin-tools/commit/18310ce4fb85546f2f83a3dc21be8ff10ac5d355))
* support yarn v1 ([#2395](https://github.com/grafana/plugin-tools/issues/2395)) ([81f956b](https://github.com/grafana/plugin-tools/commit/81f956bbdf341a679f6dd62a242bc0e032d87838))


### Bug Fixes

* narrow defaultProps detection to React components only ([#2559](https://github.com/grafana/plugin-tools/issues/2559)) ([e3f489a](https://github.com/grafana/plugin-tools/commit/e3f489ac5c5ab653d3c933c786b54b61b2e87e9f))
* reduce false positives ([#2434](https://github.com/grafana/plugin-tools/issues/2434)) ([8dd5e89](https://github.com/grafana/plugin-tools/commit/8dd5e89934231795f50b018f19a3f2ba15536a1c))
* reduce false positives in findStringRefs ([#2551](https://github.com/grafana/plugin-tools/issues/2551)) ([58063ef](https://github.com/grafana/plugin-tools/commit/58063efbea6fad414cc2932bb395917c58b386b6))
* silence warnings so json flag prints valid json ([#2417](https://github.com/grafana/plugin-tools/issues/2417)) ([1f0645c](https://github.com/grafana/plugin-tools/commit/1f0645c9093acf46fa0377a0183a3cee06694cd3))

## v0.6.4 (Wed Apr 22 2026)

#### 🐛 Bug Fix

- feat: add --distDir arg to specify built plugin directory [#2558](https://github.com/grafana/plugin-tools/pull/2558) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

## v0.6.3 (Tue Apr 07 2026)

#### 🐛 Bug Fix

- fix: narrow defaultProps detection to React components only [#2559](https://github.com/grafana/plugin-tools/pull/2559) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

## v0.6.2 (Wed Apr 01 2026)

#### 🐛 Bug Fix

- fix: reduce false positives in findStringRefs [#2551](https://github.com/grafana/plugin-tools/pull/2551) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

## v0.6.1 (Tue Feb 17 2026)

#### 🐛 Bug Fix

- feat: support reading lock files for plugins in monorepos [#2454](https://github.com/grafana/plugin-tools/pull/2454) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

## v0.6.0 (Fri Feb 13 2026)

#### 🚀 Enhancement

- feat: externalize jsx-runtime [#2448](https://github.com/grafana/plugin-tools/pull/2448) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

## v0.5.2 (Fri Feb 06 2026)

#### 🐛 Bug Fix

- fix: reduce false positives [#2434](https://github.com/grafana/plugin-tools/pull/2434) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

## v0.5.1 (Fri Jan 23 2026)

#### 🐛 Bug Fix

- fix: silence warnings so json flag prints valid json [#2417](https://github.com/grafana/plugin-tools/pull/2417) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

## v0.5.0 (Mon Jan 19 2026)

#### 🚀 Enhancement

- feat: add arg to prevent exit code 1 and improve json output [#2406](https://github.com/grafana/plugin-tools/pull/2406) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

## v0.4.0 (Thu Jan 15 2026)

#### 🚀 Enhancement

- feat: allow skipping dependency and build tooling analysis [#2397](https://github.com/grafana/plugin-tools/pull/2397) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

## v0.3.0 (Thu Jan 15 2026)

#### 🚀 Enhancement

- feat: support yarn v1 [#2395](https://github.com/grafana/plugin-tools/pull/2395) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

## v0.2.1 (Thu Jan 08 2026)

#### 🐛 Bug Fix

- refactor: update docker tag for react19 dev preview image [#2378](https://github.com/grafana/plugin-tools/pull/2378) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))

---

## v0.2.0 (Thu Jan 08 2026)

#### 🚀 Enhancement

- React Detect: New package [#2358](https://github.com/grafana/plugin-tools/pull/2358) ([@jackw](https://github.com/jackw))

#### Authors: 1

- Jack Westbrook ([@jackw](https://github.com/jackw))
