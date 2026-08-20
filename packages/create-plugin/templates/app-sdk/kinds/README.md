# Kinds (grafana-app-sdk)

This directory declares your app's API as [CUE](https://cuelang.org/) "kinds", which
[grafana-app-sdk](https://github.com/grafana/grafana-app-sdk) turns into TypeScript types and an app
manifest.

| File | Purpose |
| ---- | ------- |
| `manifest.cue` | The app manifest: app name, and the versions/kinds your app serves. |
| `example.cue` | An example kind. Rename it and edit its `spec` to model your own resource. |
| `config.cue` | Code generation settings (output paths). You rarely need to change this. |
| `cue.mod/module.cue` | The CUE module definition. |

## Generating code

After every change under this directory:

```bash
{{ packageManagerName }} run generate:kinds
```

That script always runs the `grafana-app-sdk` version set as `VERSION` at the top of
`scripts/generate-kinds.mjs`, reusing a copy in `node_modules/.cache/` or downloading and checksum-verifying one for
your platform. A `grafana-app-sdk` on your `PATH` is ignored, so everyone on the project generates with
the same version. To run a local build instead, set `GRAFANA_APP_SDK_BIN` to its path. It writes:

| Output | Path |
| ------ | ---- |
| TypeScript types | `src/generated/<kind>/<version>/` |
| App manifest (JSON) | `src/app-sdk-manifest.json` |

Generated code is meant to be committed, so schema changes show up in review and a fresh clone builds
without running code generation.

> **No Go toolchain is needed.** This plugin has no Go backend, so `kinds/config.cue` sets
> `codegen: goEnabled: false` and the generator emits only TypeScript and the definitions. Nothing
> shells out to `go`.

## How the manifest reaches Grafana

The generator writes the manifest straight into `src/app-sdk-manifest.json`, so the frontend build's
existing `**/*.json` copy pattern (`.config/bundler/copyFiles.ts`) carries it into the plugin bundle as
`dist/app-sdk-manifest.json` with no dedicated copy step. Grafana reads it when the
`appplugins.loadAppManifest` and `appplugins.registerAPIServer` feature toggles are enabled — the Docker
dev server in this repo enables both for you. Note the toggles are experimental and off by default in
Grafana.

With the manifest in place, Grafana serves storage and CRUD for your kinds through its aggregated API
server, and users can also manage the objects with `kubectl`.

## Adding a backend later

Storage and CRUD come from the manifest alone, so this plugin needs no backend. Admission
(validation/mutation), conversion, and custom routes would require adding a Go backend — the app-sdk is
designed for that progression, so there's no lock-in from starting frontend-only.
