---
name: bootstrap-plugin-docs
description: One-shot helper that fills the scaffolded plugin docs stubs by reading the plugin's source code and any existing docs. Works on greenfield plugins (drives content from source) and brownfield plugins (mines README content and routes it). Use right after `create-plugin add datasource-docs`.
---

# Bootstrap Plugin Docs

> **Path conventions:** Throughout this skill, `<docsPath>/` refers to the docs folder configured in `src/plugin.json` via the `docsPath` field (default: `docs`). Read that value before following any step that touches a path inside the docs folder.

## Usage

```
/bootstrap-plugin-docs
```

Run once after `create-plugin add datasource-docs`. The skill works on greenfield plugins (no existing docs - drives content from source) and on brownfield plugins (existing README content - mines and routes it onto pages). Both paths are first-class.

For ongoing per-page work after the bootstrap, use `write-plugin-docs`.

## Steps

1. Inventory everything available. Read in parallel:
   - `src/plugin.json` (plugin type, name, declared capabilities like `annotations`, `alerting`, `backend`, `streaming`, `metrics`)
   - `src/datasource.ts`, `src/components/QueryEditor.tsx`, `src/components/ConfigEditor.tsx`, `src/types.ts`, and any other source entry points
   - `provisioning/dashboards/*.json` if present - bundled example dashboards. Real working datasource queries already wired to panels. These are high-signal source material for example-query content; lift queries from here before inventing new ones.
   - `README.md` and `CHANGELOG.md` if present (these may be near-empty boilerplate for fresh plugins - that's fine)
   - Image assets under `src/img/`, `src/img/screenshots/`, `screenshots/`, `<docsPath>/img/`. If usable screenshots already exist in any of these locations, you may copy the relevant files into `<docsPath>/img/` during the fill pass and reference them from the doc pages. If no usable screenshots exist, flag the gap in the final summary - never generate new images.

2. **Build a working understanding from source. This step is mandatory; do not skip even when README is rich.** Determine:
   - **What the plugin does in one sentence.** Combine signals from the data source class's purpose, ConfigEditor fields, query types, and `plugin.json` `info.description`.
   - **What external system it connects to.** Inferred from auth fields, URLs, SDK imports (`@grafana/sql`, `github.com/grafana/sqlds`, AWS/GCP/Azure SDKs, third-party clients).
   - **Configuration shape.** Every field in `ConfigEditor.tsx` plus the `JsonData` / `SecureJsonData` types.
   - **Query shape.** Every field in `QueryEditor.tsx` plus the query type definition.
   - **Macros (SQL plugins only).** Look for a `Macros()` method on the Driver struct (Go) or registrations with `sqlds.DefaultMacros`.
   - **Supported features.** Annotations, alerting, streaming, variables, recorded queries, RBAC. Inferred from imports, method implementations, `plugin.json` fields.

   If source is genuinely thin (a barely-modified scaffold), say so in the final summary; do not invent.

3. **Harvest existing docs, if any.** Skip this step entirely when `README.md` is at or near scaffold default (under ~30 lines, only plugin name + install snippet + license). Otherwise:
   - For each README section, decide which scaffolded stub page it maps to (`<docsPath>/configuration.md`, `<docsPath>/query-editor.md`, `<docsPath>/index.md`, etc.).
   - Note content that does not map to any existing stub - those become candidates for new pages.
   - Quote verbatim when style already matches `<docsPath>/AGENTS.md`; rewrite when it does not.

4. Detect optional features the codemod could not auto-scaffold and propose pages for them. The codemod has already scaffolded pages backed by deterministic signals (`plugin.json` fields, authoritative source tokens like `metricFindQuery` or `github.com/grafana/sqlds`). The catalog below covers softer features that need contextual judgment - propose these pages to the user when you detect the trigger. Ask before scaffolding.

   **Datasource soft-signal catalog** (trigger → filename → scope):

   | Trigger                                                            | Filename                                                           | Scope                                                                                 |
   | ------------------------------------------------------------------ | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
   | `runStream` method on the DataSource class                         | `<docsPath>/streaming.md`                                          | Live/streaming queries via the DataSource API; what data flows and the consumer side. |
   | Recorded queries support in source                                 | `<docsPath>/recorded-queries.md`                                   | Setup, limitations and example use cases.                                             |
   | RBAC role declarations in `plugin.json`                            | `<docsPath>/permissions.md`                                        | What each role grants, default assignments.                                           |
   | Substantial external setup needed before configuring the plugin    | `<docsPath>/prerequisites.md`                                      | Cloud account setup, IAM, network access.                                             |
   | External cloud setup is substantial enough to deserve its own page | `<docsPath>/iam-setup.md` or `<docsPath>/service-account-setup.md` | Step-by-step setup in the external console.                                           |

   For pages the codemod already scaffolded (`annotations.md`, `alerting.md`, `template-variables.md`, `macros.md`, `dashboard.md`), do NOT propose them again - they already exist as stubs ready for you to fill in step 6.

5. **Prompt the author for non-source-backed context.** These questions matter more in greenfield runs, but ask in every run - source can't answer them. Ask explicitly:

   > "In one sentence, what problem does this plugin solve for the user?"
   > "Who is the target user (DBA, SRE, data engineer, application developer, security analyst, etc.)?"
   > "Are there external setup steps not visible in source - cloud console configuration, IAM roles, network access, third-party account creation, API token issuance?"
   > "Are there topics that don't map to source - prerequisites, conceptual overviews, troubleshooting, FAQs? List them and I'll scaffold them as new pages."

   If the author skips or has no answer, scaffold what source supports and flag the gaps in the final summary. Each named topic becomes a new page via `write-plugin-docs` Branch B.

6. For every page in the resulting list (scaffolded stubs + new pages):
   - Hand off to `write-plugin-docs`.
   - Pass the source understanding (always present), README excerpts (only when harvested in step 3) and author answers (only when given in step 5) as the page brief.
   - **Estimate per-page length.** Project the final size based on the content the page will absorb. If any threshold will be exceeded, plan to split the page into a folder:
     - More than 6 H2 sections, or
     - More than ~400 lines, or
     - More than ~3,000 words

     To split a page (example: `query-editor.md`):
     - Replace the single `<docsPath>/query-editor.md` with a folder `<docsPath>/query-editor/`.
     - Create `<docsPath>/query-editor/index.md` as the overview / switchboard - covers shared UI, mode picker, how to pick a query type. Keep this page short.
     - Create one file per top-level concept (for `query-editor`, that's usually one file per query type: `issues.md`, `pull-requests.md`, `commits.md`, etc.). Each child page covers one query type end-to-end: its purpose, fields, options, example.
     - Each child page is itself subject to the same length thresholds - recursively split if needed (rare).
     - Set `sidebar_position` in each child page's frontmatter so the order in the sidebar is intentional, not alphabetical.

     Pages that commonly need this split: `query-editor.md` (one file per query type), `configuration.md` (rare - only if there are many auth modes or deployment targets), `examples.md` (when there are many distinct example scenarios). Pages that should almost never split: `index.md`, `troubleshooting.md`.

   **Group closely-coupled pages into folders.** When the page set includes multiple pages that share a single topic, restructure them as a folder with an `index.md` parent and per-aspect children rather than as flat siblings. For example, if you have planned `configuration.md` plus `service-account.md` plus `oauth.md` (all about configuring the data source), produce:
   - `<docsPath>/configuration/index.md` (overview, shared steps, links to children)
   - `<docsPath>/configuration/service-account.md`
   - `<docsPath>/configuration/oauth.md`

   Set `sidebar_position` on each child to control nav order within the folder. This convention is documented in `<docsPath>/AGENTS.md` under "Filesystem conventions" → "Group closely-coupled pages into folders". The length-based and topic-coupling splits are orthogonal: a page can need one, the other, both or neither.

   **Special case: `<docsPath>/dashboard.md` (if scaffolded).** This page describes every dashboard bundled with the plugin. Fill it in by:
   - Parsing `src/plugin.json` and filtering `includes` to entries where `type === "dashboard"`.
   - For each entry, reading the dashboard JSON file at `src/<entry.path>` (the `path` field is relative to `src/`).
   - Extracting from each dashboard JSON: top-level `title`, `description`, `tags`, and the `title` of each panel under `panels[]`.
   - Writing one H2 per dashboard to `<docsPath>/dashboard.md`. Use the dashboard JSON's `title` as the heading (fall back to the `name` field from `plugin.json` if the dashboard `title` is missing). Body: 1-2 paragraphs covering the dashboard's purpose, the most useful panels it contains and the data or queries it expects. If the repo has screenshot assets that reference the dashboard, link them.
   - Best-effort: if a dashboard's purpose is unclear from the JSON alone, leave a TODO marker in that section and surface the gap in the final summary so the author can fill it in.

   **Verbatim-and-flag rule.** When a source `description:` string contradicts observable behaviour elsewhere in source (for example, names a default the constructor doesn't actually set, lists a query type that isn't implemented, or describes a constraint the validator doesn't enforce), keep the description verbatim AND add a row to the gaps summary in step 8 with file + line references. Do not silently paraphrase the discrepancy away. Do not invent corrected wording. The author resolves the contradiction; the agent surfaces it.

   **SQL plugin adjustments (if `github.com/grafana/sqlds` or `@grafana/sql` is in source).** When filling the generic pages for a SQL datasource, ensure these specific topics are covered:
   - `<docsPath>/configuration.md` → connection pool fields (`maxOpenConns`, `maxIdleConns`, `connMaxLifetime`), TLS settings and any driver-specific settings (warehouse, role, default schema/database/catalog).
   - `<docsPath>/query-editor.md` → builder vs code mode (the `@grafana/sql` `SqlQueryEditorLazy` gives both), how to use macros (cross-link to `macros.md`), how the format selector affects the result shape.
   - `<docsPath>/macros.md` → fill in by scanning the Go source for macro definitions (look for the `Macros()` method on the plugin's Driver struct and any calls to `sqlds.DefaultMacros`). Document each macro's expansion with a concrete example.
   - `<docsPath>/template-variables.md` (if scaffolded) → include an example variable query that introspects schema (e.g. `SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`).
   - `<docsPath>/alerting.md` and `<docsPath>/annotations.md` (if scaffolded) → describe the required result shape: a single time-typed column plus the numeric or text columns the feature needs.

7. After all pages are written, run `validate-plugin-docs` to clean up structural errors.

8. Report a summary to the user:
   - Pages drafted from source-only understanding (note when source was thin).
   - Pages drafted with README content layered in.
   - Pages drafted from `provisioning/dashboards/*.json` content.
   - Pages added for detected optional features.
   - Pages added from author-named topics.
   - Screenshots copied from `src/img/screenshots/` (or similar) into `<docsPath>/img/`. List which pages they landed on. Flag pages that would benefit from screenshots but where none exist in the repo.
   - Gaps flagged for the author:
     - Description-vs-source contradictions kept verbatim per the verbatim-and-flag rule (cite file and line).
     - Purpose unclear from source.
     - External setup unanswered.
     - Dashboards with unclear intent.
     - README content that did not get routed to any page.
     - Pages that would benefit from a screenshot but the repo has none.
   - Final validation status.

## Notes

- The README typically stays in place after bootstrap. It still appears on npm, GitHub and the plugin catalog homepage. Bootstrap copies relevant content; it does not delete the source.
- The skill works on greenfield plugins (no existing docs) and brownfield plugins (existing README to migrate). Greenfield runs lean more heavily on source code and author prompts; brownfield runs route README content to pages. Both paths are first-class.
- The bootstrap workflow is one-shot. Subsequent doc updates use `write-plugin-docs` (per-page) or `review-plugin-docs` (for review).
