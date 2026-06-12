# {{pluginName}} documentation

This folder contains the multi-page documentation for **{{pluginName}}**, published at `grafana.com/grafana/plugins/<slug>/docs/<page>`.

## What to document

Document every feature of the plugin. The codemod scaffolded these pages as stubs — fill in each one:

| File                 | Purpose                                                                   |
| -------------------- | ------------------------------------------------------------------------- |
| `index.md`           | Overview, what the plugin does, requirements.                             |
| `configuration.md`   | Connection settings, auth, provisioning, troubleshooting.                 |
| `query-editor.md`    | How queries are built; example queries in `dashboard.json` target format. |
| `troubleshooting.md` | Real failures users hit, with diagnostic steps.                           |

If the plugin supports any of these features, additional pages are scaffolded automatically when you re-run `create-plugin add datasource-docs`:

| File                    | Trigger                                                               |
| ----------------------- | --------------------------------------------------------------------- |
| `macros.md`             | SQL macros (plugins importing `sqlds` or `@grafana/sql`).             |
| `template-variables.md` | Variable queries (`metricFindQuery`, `*VariableSupport`).             |
| `annotations.md`        | Annotation queries (`plugin.json` `annotations: true`).               |
| `alerting.md`           | Alert rules (`plugin.json` `alerting: true` AND `backend: true`).     |
| `dashboard.md`          | Bundled dashboards (`plugin.json` `includes` with `type: dashboard`). |

Other pages worth adding manually when they apply:

| File               | When                                                                        |
| ------------------ | --------------------------------------------------------------------------- |
| `streaming.md`     | If the DataSource class implements `runStream`.                             |
| `permissions.md`   | If the plugin declares RBAC roles.                                          |
| `prerequisites.md` | Substantial external setup (cloud accounts, IAM).                           |
| `iam-setup.md`     | Step-by-step cloud-console setup, when prerequisites deserves its own page. |

## Preview and validate locally

```bash
npm run docs:serve     # local preview at http://localhost:3001 with live reload
npm run docs:validate  # check for issues before pushing (strict mode)
```

## How docs are published

Multi-page docs are only published when `docsPath` is set in `src/plugin.json`. If it is not set, this folder is ignored by the publishing pipeline.

When `docsPath` is set:

1. The `validate-docs.yml` workflow runs on every PR that touches `docs/**` or `src/plugin.json` — it runs `plugin-docs-cli validate --strict`.
2. On tag push (release), the docs validator runs again as part of the plugin-validator step. Errors at this stage fail the release.
3. On successful validation, `plugin-docs-cli` builds the docs and writes `dist/docs/` — the manifest plus all markdown and image files.
4. `dist/docs/` rides along inside the plugin archive (`.zip`) uploaded to GCS.
5. Grafana's plugin publishing flow syncs the archive to the CDN, then surfaces the docs at `grafana.com/grafana/plugins/<slug>/docs/`.

## How to disable multi-page docs

If you no longer want multi-page docs for this plugin:

1. Remove the `docsPath` field from `src/plugin.json`.
2. Cut a new release. The next deploy publishes the plugin without the docs subtree; existing pages at `grafana.com/grafana/plugins/<slug>/docs/` stop being served once the new version replaces the old one.

You can leave this folder in place — the publishing pipeline ignores it without `docsPath`. Delete it if you want a clean tree.
