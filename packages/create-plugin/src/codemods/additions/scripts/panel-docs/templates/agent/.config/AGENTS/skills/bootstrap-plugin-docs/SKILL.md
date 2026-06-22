---
name: bootstrap-plugin-docs
description: One-shot helper that fills the scaffolded plugin docs stubs by reading the panel's source code and any existing docs. Works on greenfield panels (drives content from source) and brownfield panels (mines README content and routes it). Use right after `create-plugin add panel-docs`.
---

# Bootstrap Plugin Docs

> **Path conventions:** Throughout this skill, `<docsPath>/` refers to the docs folder configured in `src/plugin.json` via the `docsPath` field (default: `docs`). Read that value before following any step that touches a path inside the docs folder.

## Usage

```
/bootstrap-plugin-docs
```

Run once after `create-plugin add panel-docs`. The skill works on greenfield panels (no existing docs - drives content from source) and on brownfield panels (existing README content - mines and routes it onto pages). Both paths are first-class.

For ongoing per-page work after the bootstrap, use `write-plugin-docs`.

## Steps

1. Inventory everything available. Read in parallel:
   - `src/plugin.json` (plugin type, name, declared `includes`, `info.description`)
   - `src/module.ts` (the `PanelPlugin` builder chain - the load-bearing file for option extraction)
   - The panel React component referenced from `module.ts` (commonly `src/components/<PanelName>.tsx` or `src/<PanelName>.tsx`)
   - `src/types.ts` and any other source entry points
   - `provisioning/dashboards/*.json` if present - bundled example dashboards. These are the canonical source for `<docsPath>/examples.md`: real working panel configs that already exercise the plugin's features. Prefer lifting examples from here over inventing them.
   - `README.md` and `CHANGELOG.md` if present (these may be near-empty boilerplate for fresh panels - that's fine)
   - Image assets under `src/img/`, `src/img/screenshots/`, `screenshots/`, `<docsPath>/img/`. If usable screenshots already exist in any of these locations, you may copy the relevant files into `<docsPath>/img/` during the fill pass and reference them from the doc pages. If no usable screenshots exist, flag the gap in the final summary - never generate new images.

2. **Build a working understanding from the `PanelPlugin` builder. This step is mandatory; do not skip even when README is rich.** Locate `new PanelPlugin(...)` in `src/module.ts` (or wherever the default export lives). Walk the chained methods and extract:
   - **Panel purpose** (one sentence). Combine `plugin.json.info.description`, the React component's leading docstring and any descriptive `description:` strings inside `setPanelOptions` calls.

   - **Panel options** (`setPanelOptions((builder) => ...)`). For each `.add*({...})` call on the builder, capture the literal values of these object properties: `name`, `description`, `defaultValue`, `category`. Record the builder method name so you can derive a Type label using the table below.

     | Builder method     | Type label   |
     | ------------------ | ------------ |
     | `addBooleanSwitch` | Toggle       |
     | `addTextInput`     | Text         |
     | `addTextArea`      | Text area    |
     | `addNumberInput`   | Number       |
     | `addRadio`         | Radio        |
     | `addSelect`        | Select       |
     | `addMultiSelect`   | Multi-select |
     | `addColorPicker`   | Color        |
     | `addSliderInput`   | Slider       |
     | `addUnitPicker`    | Unit         |
     | `addCustomEditor`  | Custom       |
     | anything else      | Custom       |

   - **Standard field options** (`useFieldConfig({...})`). Three cases:
     - No `.useFieldConfig(...)` call at all → no Standard field options section. Remove the empty section from `options.md` during the fill pass.
     - `.useFieldConfig()` or `.useFieldConfig({})` or any call without a `standardOptions` key → the panel enables all standard options. Document this as "all standard options".
     - `.useFieldConfig({ standardOptions: [FieldConfigProperty.Min, FieldConfigProperty.Decimals, ...] })` → list only the named ones.

     Friendly labels for the common `FieldConfigProperty` values:

     | Property      | Label          |
     | ------------- | -------------- |
     | `Min`         | Min            |
     | `Max`         | Max            |
     | `Unit`        | Unit           |
     | `Decimals`    | Decimals       |
     | `Thresholds`  | Thresholds     |
     | `Mappings`    | Value mappings |
     | `Color`       | Color scheme   |
     | `DisplayName` | Display name   |
     | `NoValue`     | No-value text  |
     | `Links`       | Data links     |
     | `Filterable`  | Filterable     |

   - **Custom field options** (`useFieldConfig({ useCustomConfig: (builder) => ... })`). Same walker as `setPanelOptions`. These appear under the **Overrides** picker in the panel editor.

   - **Data support** (`setDataSupport({ annotations: true, alertStates: true })`). Each truthy flag becomes a Features bullet on `<docsPath>/index.md`:
     - `annotations: true` → "Reads from annotations queries"
     - `alertStates: true` → "Visualises alert state on the panel"

   - **Suggestions / presets suppliers** (`setSuggestionsSupplier(...)` / `setPresetsSupplier(...)`). Presence → Features bullets: "Appears in the Suggestions list when data shape matches" and "Ships preset configurations".

   If source is genuinely thin (a barely-modified scaffold), say so in the final summary; do not invent.

3. **Harvest existing docs, if any.** Skip this step entirely when `README.md` is at or near scaffold default (under ~30 lines, only plugin name + install snippet + license). Otherwise:
   - For each README section, decide which scaffolded stub page it maps to (`<docsPath>/options.md`, `<docsPath>/data-formats.md`, `<docsPath>/examples.md`, `<docsPath>/index.md`, etc.).
   - Note content that does not map to any existing stub - those become candidates for new pages.
   - Quote verbatim when style already matches `<docsPath>/AGENTS.md`; rewrite when it does not.

4. Detect optional features the codemod could not auto-scaffold and propose pages for them. The codemod has already scaffolded the baseline set (`index.md`, `options.md`, `data-formats.md`, `examples.md`, `troubleshooting.md`). The catalog below covers softer features that need contextual judgment - propose these pages to the user when you detect the trigger. Ask before scaffolding.

   **Panel soft-signal catalog** (trigger → filename → scope):

   | Trigger                                                                            | Filename                                  | Scope                                                        |
   | ---------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------ |
   | `setSuggestionsSupplier(...)` in source                                            | mention in `<docsPath>/index.md` Features | When this panel surfaces in the Suggestions list.            |
   | `setPresetsSupplier(...)` in source                                                | `<docsPath>/presets.md`                   | The presets the panel ships, when each applies, screenshots. |
   | RBAC role declarations in `plugin.json`                                            | `<docsPath>/permissions.md`               | What each role grants, default assignments.                  |
   | Substantial accessibility considerations (keyboard shortcuts, screen reader notes) | `<docsPath>/accessibility.md`             | Keyboard interaction, ARIA, contrast, motion preferences.    |

5. **Prompt the author for non-source-backed context.** These questions matter more in greenfield runs, but ask in every run - source can't answer them. Ask explicitly:

   > "In one sentence, what problem does this panel solve for the user?"
   > "Who is the target user (SRE, application developer, business analyst, etc.)?"
   > "What data shape does the panel expect, and what kinds of queries produce it (time series, table, traces, logs)?"
   > "Are there topics that don't map to source - prerequisites, conceptual overviews, troubleshooting scenarios, FAQs? List them and I'll scaffold them as new pages."

   If the author skips or has no answer, scaffold what source supports and flag the gaps in the final summary. Each named topic becomes a new page via `write-plugin-docs` Branch B.

6. For every page in the resulting list (scaffolded stubs + new pages):
   - Hand off to `write-plugin-docs`.
   - Pass the source understanding (always present), README excerpts (only when harvested in step 3) and author answers (only when given in step 5) as the page brief.

   **Special case: `<docsPath>/options.md`.** Use the source understanding from step 2 to populate the page directly:
   - For the `## Panel options` section, emit a markdown table with columns `Option | Type | Default | Description` and one row per `setPanelOptions` `.add*` call. Match the Grafana built-in panel docs style (see https://grafana.com/docs/grafana/latest/visualizations/panels-visualizations/visualizations/logs/#logs-options for the reference shape).
     - `Option`: the `name` value, verbatim.
     - `Type`: the friendly Type label from the builder method table above.
     - `Default`: the `defaultValue` rendered as inline code (`` `false` ``, `` `100` ``, `` `"foo"` ``). Empty cell when no default. For computed expressions (function calls, identifiers), use the source text verbatim inside backticks.
     - `Description`: the `description` value, verbatim. Leave blank if source has none.
     - Escape pipes (`|`) inside any cell value as `\|`.

   - For the `## Standard field options` section, emit a bulleted list of the friendly labels. When the panel enables all standard options, prefix the list with a sentence noting that.

   - For the `## Custom field options` section, emit a table with the same shape as Panel options.

   - If `setPanelOptions` is absent, drop the `## Panel options` section. If `useFieldConfig` is absent, drop both Standard and Custom field options sections. Same for Tooltip and Legend - if the panel has no options under those categories (check the `category:` field in `setPanelOptions` add calls), remove the empty sections rather than leaving placeholder briefs.

   **Verbatim-and-flag rule.** When a source `description:` string contradicts observable behaviour elsewhere in source (for example, the description lists option values that don't appear in the matching `options:` array, names a default the constructor doesn't actually set, or describes a constraint the validator doesn't enforce), keep the description verbatim AND add a row to the gaps summary in step 8 with file + line references. Do not silently paraphrase the discrepancy away. Do not invent corrected wording. The author resolves the contradiction; the agent surfaces it.

   **Special case: `<docsPath>/data-formats.md`.** For every query-backed data shape described on the page, immediately after the prose description add a `#### Example` subsection containing a Markdown table. The table headers must be the actual field names the panel reads - draw them from query field pickers in source (look for `queryField`, `fieldName`, or `FieldNamePicker` in `setPanelOptions` / component props) and from `queryField` values in any provisioning JSON. Populate 3-5 rows with realistic sample values that match the declared types. This is the minimal artifact that lets a dashboard author write a working query or a test datasource payload - without it the page is descriptive but not actionable. If source contains no field-name evidence, flag the gap in the summary rather than omitting the subsection silently.

   **Special case: `<docsPath>/examples.md`.** If `provisioning/dashboards/*.json` exists, lift example configurations from there before falling back to invented ones. For each dashboard, extract panels of this plugin type (match by `type` field against `plugin.json.id`) and use the panel JSON as the example. Pair each example with a one-paragraph explanation of which features it exercises and what data shape it expects. If the provisioning directory is missing or has no relevant panels, only then construct examples from the source understanding plus author input.

   **Special case: `<docsPath>/index.md` Features section.** Emit one bullet per detected capability from step 2 (annotations, alert states, suggestions, presets). Order: data support flags first, then UX surfaces (suggestions, presets).

   **Estimate per-page length.** Project the final size based on the content the page will absorb. If any threshold will be exceeded, plan to split the page into a folder:
   - More than 6 H2 sections, or
   - More than ~400 lines, or
   - More than ~3,000 words

   Pages that commonly need this split: `examples.md` (when there are many distinct example scenarios). Pages that should almost never split: `index.md`, `options.md`, `troubleshooting.md`.

   **Group closely-coupled pages into folders.** When the page set includes multiple pages that share a single topic, restructure them as a folder with an `index.md` parent and per-aspect children rather than as flat siblings. Set `sidebar_position` on each child to control nav order within the folder. This convention is documented in `<docsPath>/AGENTS.md` under "Filesystem conventions" → "Group closely-coupled pages into folders".

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
     - Computed defaults not expressible inline.
     - Purpose unclear from source.
     - README content that did not get routed to any page.
     - Pages that would benefit from a screenshot but the repo has none.
   - Final validation status.

## Notes

- The README typically stays in place after bootstrap. It still appears on npm, GitHub and the plugin catalog homepage. Bootstrap copies relevant content; it does not delete the source.
- The skill works on greenfield panels (no existing docs) and brownfield panels (existing README to migrate). Greenfield runs lean more heavily on source code and author prompts; brownfield runs route README content to pages. Both paths are first-class.
- **Edge cases when walking the builder chain:**
  - **Multi-file builder chains.** If `setPanelOptions(builder => buildOptions(builder))` delegates to a helper function in another file, follow the import and walk the helper too. If you can't reasonably resolve the chain, document the source location and flag the gap in the summary.
  - **Computed defaults.** When `defaultValue: getDefaultThreshold()` references a function, render the source text verbatim in backticks (`` `getDefaultThreshold()` ``) and flag the row so the author can replace it with the resolved value.
  - **`useFieldConfig()` with no arguments.** Treat as `kind: 'all'`; list the standard options in the Standard field options section.
- The bootstrap workflow is one-shot. Subsequent doc updates use `write-plugin-docs` (per-page) or `review-plugin-docs` (for review).
