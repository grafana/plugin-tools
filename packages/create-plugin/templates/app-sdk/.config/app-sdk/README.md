# Kinds (grafana-app-sdk)

The [kinds/](../../kinds) directory declares your app's API as [CUE](https://cuelang.org/) "kinds", which
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
`.config/app-sdk/generate-kinds.mjs`, reusing a copy in `node_modules/.cache/` or downloading and checksum-verifying one for
your platform. A `grafana-app-sdk` on your `PATH` is ignored, so everyone on the project generates with
the same version. To run a local build instead, set `GRAFANA_APP_SDK_BIN` to its path. It writes:

| Output | Path |
| ------ | ---- |
| TypeScript types | `src/generated/<kind>/<version>/` |
| App manifest (JSON) | `src/app-sdk-manifest.json` |
| Go types (backend only) | `pkg/generated/` |

Generated code is meant to be committed, so schema changes show up in review and a fresh clone builds
without running code generation.

> **Note:** No Go toolchain is needed to run generate:kinds unless generating Go code.** 

## How the manifest reaches Grafana

The generator writes the manifest straight into `src/app-sdk-manifest.json`, so the frontend build's
existing `**/*.json` copy pattern (`.config/bundler/copyFiles.ts`) carries it into the plugin bundle as
`dist/app-sdk-manifest.json` with no dedicated copy step. Grafana reads it when the
`appplugins.loadAppManifest` and `appplugins.registerAPIServer` feature toggles are enabled — the Docker
dev server in this repo enables both for you. Note the toggles are experimental and off by default in
Grafana.

With the manifest in place, Grafana serves storage and CRUD for your kinds through its aggregated API
server, and users can also manage the objects with `kubectl`.

## Adding a backend

Storage and CRUD come from the manifest alone, so a plugin with no backend still gets them. A backend will
be required for:

- Admission logic (i.e. validation/mutation)
- Conversion logic (i.e. between API versions)
- Custom routes and subresource routes
- Controller logic (informers, watchers, or any other background work)

If this plugin has a backend, `pkg/provider/provider.go` is where you wire those up as your app grows.
