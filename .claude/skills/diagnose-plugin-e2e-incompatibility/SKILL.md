---
name: diagnose-plugin-e2e-incompatibility
description: Diagnose a failing nightly E2E run by identifying which grafana/grafana commit likely introduced an incompatibility with @grafana/plugin-e2e. Use whenever the user wants to triage a playwright-nightly failure, asks "what broke the nightly", "which grafana commit broke plugin-e2e", "diagnose plugin-e2e incompatibility", "find the bad commit", "triage the nightly failure", or pastes a failing run URL from the playwright-nightly workflow.
---

# diagnose-plugin-e2e-incompatibility

When the `playwright-nightly.yml` workflow fails against `grafana-dev`, the cause is almost always a change in `grafana/grafana` main that introduced an incompatibility with `@grafana/plugin-e2e`. This skill narrows that down from "somewhere in the last 24-48h of commits" to "here are the 3-5 most likely suspects" - a useful head-start before the human reads the actual diffs.

**Announce at start:** "I'm using the diagnose-plugin-e2e-incompatibility skill to triage the nightly failure."

## Invocation forms

- `/diagnose-plugin-e2e-incompatibility` - use the most recent failed nightly run
- `/diagnose-plugin-e2e-incompatibility <run-url>` - analyze a specific run
- `/diagnose-plugin-e2e-incompatibility <run-id>` - same, by numeric ID

## Prerequisites

- `gh` CLI authenticated with read access to `grafana/plugin-tools` and `grafana/grafana`

## Cost discipline

This skill will eventually run in CI on every nightly failure, so it has hard bounds on token usage:

- Commit range: **max 250 commits** (GitHub compare API returns at most 250 anyway; narrow to the 250 ending at the bad SHA if truncated)
- Per-commit data in the initial pass: **SHA + subject line + author only** (no message body, no file lists)
- Failing log: **grep-filter before reading**, cap at ~300 lines
- File-list fetches: **only for the top 5 suspects** after the initial ranking (lazy)
- No commit-diff fetches - ever
- Final output: **≤5 suspects**

Budget target: ~15K input tokens per invocation. If a step's output would blow through this (e.g. filtered log is still 10K lines, suggesting an unusual failure mode), stop and report what you saw instead of pushing the full blob into reasoning.

## Workflow

### 1. Locate the runs

With no argument:

```bash
# most recent failure
gh run list --repo grafana/plugin-tools --workflow=playwright-nightly.yml \
  --status=failure --limit=1 --json databaseId,createdAt,headSha

# most recent success (to establish the "last good" baseline)
gh run list --repo grafana/plugin-tools --workflow=playwright-nightly.yml \
  --status=success --limit=1 --json databaseId,createdAt,headSha
```

With an argument, use it as the failing run and fetch the most recent success that completed _before_ it.

If no successful nightly exists yet (e.g. first week after the workflow landed), say so and fall back to using the first-ever nightly run as the baseline - the commit range will be wider but the analysis still works.

### 2. Extract the grafana-dev tag from each run

The job name in the matrix is `${{ matrix.GRAFANA_IMAGE.name }}@${{ matrix.GRAFANA_IMAGE.VERSION }}`, so the grafana-dev job is literally named `grafana-dev@<tag>`. Pull it straight from job metadata:

```bash
gh run view <run-id> --repo grafana/plugin-tools --json jobs \
  --jq '.jobs[] | select(.name | startswith("grafana-dev@")) | .name' \
  | head -1 | awk -F@ '{print $2}'
```

Result: something like `13.1.0-24547284055`. Do this for both the failed and the last-good runs.

### 3. Map each tag to a grafana/grafana commit

The build-number suffix (after the last `-`) is a GitHub Actions run ID in `grafana/grafana`. Look up the commit it built from:

```bash
build_id=${tag##*-}   # "13.1.0-24547284055" → "24547284055"
gh api repos/grafana/grafana/actions/runs/$build_id --jq .head_sha
```

This is the key trick that makes the whole skill feasible without Docker inspection - the tag encodes the build's CI run, and the run knows its commit.

If this fails (e.g. the run was deleted, or the tag uses a different encoding), fall back to `docker buildx imagetools inspect --raw grafana/grafana-dev:<tag>` and look at the image config for commit labels. Report the fallback to the user.

### 4. List the commit range in grafana/grafana

```bash
gh api repos/grafana/grafana/compare/$good_sha...$bad_sha \
  --jq '.commits[] | {sha: .sha[0:10], subject: (.commit.message | split("\n")[0]), author: .commit.author.name}'
```

Use only the first line of each commit message (the subject). Skip the message body, author email, and timestamps - they add tokens with no triage value.

**Do not fetch per-commit file lists at this stage.** That's N extra API calls and N blobs in the LLM context for commits we may not recommend. File lists are fetched lazily in step 6, only for the top suspects.

**Hard cap: 250 commits.** The GitHub compare API returns up to 250 commits per call anyway. If the response truncates (check `total_commits` in the compare response), take the 250 ending at `bad_sha` and note the truncation in the final output. Huge ranges mean the nightly has been red for a while - the actual break is probably in the most recent commits, and a human should review the full range if the skill misses it.

### 5. Extract failing test details from the failing run

First find the grafana-dev job's numeric ID so we can scope the log to just that job - otherwise `--log-failed` also includes any other matrix entries that failed (e.g. `grafana-enterprise@latest`), which pollutes the signal:

```bash
grafana_dev_job_id=$(gh run view <failing-run-id> --repo grafana/plugin-tools --json jobs \
  --jq '.jobs[] | select(.name | startswith("grafana-dev@")) | .databaseId')

gh run view <failing-run-id> --repo grafana/plugin-tools --job "$grafana_dev_job_id" --log \
  | grep -E '(✘|Error:|expect\(|\.spec\.ts:|element\(s\) not found|Failed to fetch|Timed out|›)' \
  | head -300 > /tmp/nightly-failed.log
```

Note: `gh run view --job` uses `--log` (not `--log-failed`) since we're targeting a single job.

The raw job log is huge (10MB+ for a real failure) and mostly infra noise - docker pulls, dependency installs, Playwright's per-test progress output. Grep-filter to lines that actually carry failure signal before reading.

Cap at 300 lines (roughly 3K tokens). If the filtered output is still empty, the failure likely isn't a test failure but an infra problem (Docker pull failed, Grafana never came up) - report that and stop. This skill can't triage infra flakes.

What to pull out of the filtered log:

- Test file refs like `*.spec.ts:<line>:<col>`
- Test titles (preceded by `›`)
- Error lines: `Error: ...`, `expect(...).to...`, `Failed to fetch`, `element(s) not found`
- Selector strings in the errors: `data-testid=...`, `aria-label=...`, URL patterns

Feed the filtered lines into the ranking step as-is. LLMs parse this kind of noise fine.

### 6. Rank suspect commits

**Initial pass (uses only subject lines + failing log).** Score every commit in the range on two cheap axes:

- **Keyword overlap.** Do terms from the failing test names, error messages, or selectors (from step 5) appear in the commit's subject line? This is the strongest cheap signal.
- **Focus heuristic.** Short, specific subject lines about UI features are more suspicious than "chore:", "deps:", "ci:", "docs:", "bump version", mass-rename refactors, or translations.

Pick the top 5 candidates from this pass. **Only now** fetch their file lists (lazy - don't do this for all 250 commits):

```bash
gh api repos/grafana/grafana/commits/<sha> --jq '[.files[].filename] | .[:20]'
```

**Second pass (uses file lists for the top 5).** Re-score using:

- **High-signal file patterns.** Some paths in `grafana/grafana` have a strong track record of breaking plugin-e2e compatibility. A commit touching any of these deserves top-tier ranking even if the keyword match is weak. Listed in priority order - **feature-flag changes outrank everything else**:
  1. **Feature-flag changes that affect plugin-e2e.** Two distinct patterns - both rank at the top:

     **1a. An existing flag's effective default changes.** Tests now see on-behavior they previously didn't. Three shapes to look for in `registry.go`:
     - `Expression: "false"` → `Expression: "true"` on the same flag entry (the classic flip).
     - A flag's `Stage` promoted from a preview stage (`FeatureStagePrivatePreview`, `FeatureStagePublicPreview`) to `FeatureStageGeneralAvailability` when that implicitly changes evaluation.
     - A flag _renamed_ (old entry deleted, new entry added with a different `Name:`) - even at the same `Expression` value, plugin-e2e code that references the old name will silently evaluate to the fallback instead.
     - Or in `conf/defaults.ini` `[feature_toggles]` section: an existing flag line flips from `= false` to `= true`.
     - The reverse `Expression` flip (`"true"` → `"false"`) is rarely the cause of _new_ failures - it would typically unblock a test, not break one.

     **1b. Changes to the plugin-facing OpenFeature API surface.** Plugin-e2e imports OpenFeature helpers from `@grafana/runtime`. Refactors that change what that package exports (or how plugins consume OpenFeature flags) can silently break plugin-e2e even with zero Expression flips. Signal files:
     - `packages/grafana-runtime/src/internal/openFeature/**` - the actual OpenFeature helpers plugins consume. Any touch here is high-signal.
     - `pkg/services/featuremgmt/openfeature_react.tmpl` - template that generates the plugin-facing OpenFeature code. Any touch here is high-signal.
     - New large files appearing under `packages/grafana-runtime/` alongside big churn in `pkg/services/featuremgmt/` - signals a codegen rework of the plugin-facing surface.

     **Don't confuse these with `packages/grafana-data/src/types/featureToggles.gen.ts`.** That file is regenerated mechanically every time _any_ flag is added or removed - it's just a union type of flag names. A commit that only touches `featureToggles.gen.ts` (alongside `registry.go`) is a routine flag add/remove and belongs in the noise bucket below. A commit touching `featureToggles.gen.ts` _and_ `openfeature.gen.ts` or `openfeature_react.tmpl` is a real API refactor.

     **Dismiss these noise patterns even though they touch `registry.go`:**
     - New flags added (with any default) - new flags don't change pre-existing test behavior.
     - Existing flag _removed_ when the flag name does not appear in `packages/plugin-e2e/` (check with `grep -r "<flag-name>" packages/plugin-e2e/`) - it's a cleanup of something nothing uses.
     - Mechanical field renames inside a flag entry (`FrontendOnly: false` → `Generate: Generate{...}`) with `Expression` unchanged.
     - Whitespace / formatting changes to `Expression` lines.
     - Churn in `toggles_gen.*` files that is clearly regenerated output from a mechanical change elsewhere.

  2. **`packages/grafana-e2e-selectors/src/selectors/`** (especially `pages.ts` or `components.ts`).
     - Selectors there are _versioned_: each selector is a map of `{min-grafana-version: value}`. The rules (see that folder's `README.md`): never delete a selector or version key, never change a function selector's signature, add a new version key instead of replacing a value. Version keys must be plain semver - no pre-release tags or build numbers.
     - Red flags in the diff: deleted keys, deleted selectors, a single value replaced in place instead of a new version key added, or a version key bumped from plain semver (`'13.0.0'`) to a pre-release form (`'13.0.0-24085625829'`) which breaks the semver resolver and silently falls back to the `MIN_GRAFANA_VERSION` entry.
  3. **`e2e-playwright/plugin-e2e/plugin-e2e-api-tests/`** - these tests exist specifically to verify grafana stays compatible with `@grafana/plugin-e2e`.
     - **Adding** tests here is fine. **Modifying** existing ones without a corresponding `@grafana/plugin-e2e` version bump is a strong indicator of a breaking change.
  4. **Accessibility / test-id churn on UI components.** Commits changing `role=`, `aria-label=`, or `data-testid=` on elements that had a `grafana/e2e-selector` attached - selectors in plugin-e2e rely on these attribute values. Flag when the file is a plausible UI component (`public/app/**/*.tsx`) and the subject mentions accessibility, roles, test ids, or renames.

- **Feature-area path overlap.** Does this commit touch files in grafana related to the failing tests? Rough map:
  - OpenFeature tests → `pkg/services/featuremgmt/`, `public/app/features/openfeature/`
  - Panel / AddPanel tests → `public/app/features/dashboard-scene/`, `public/app/plugins/panel/`
  - Data source picker → `public/app/features/datasources/`, `public/app/features/plugins/datasource-picker/`
  - Variables / templating → `public/app/features/variables/`, `public/app/features/dashboard-scene/variables/`
  - Alerting → `public/app/features/alerting/`, `pkg/services/ngalert/`
  - Not exhaustive - use judgment based on test names and selectors in the failure.

**Do not fetch commit diffs.** The diff per commit can be huge; file paths plus subject lines are enough signal to rank. If the user wants to see diffs, they click the commit link. The skill's job is triage, not deep code review.

Present the final top 3-5 suspects (cap 5). For each:

- SHA (first 10 chars) as a markdown link to the grafana commit
- Author
- Commit message subject
- One-line justification: which failing test(s) this plausibly breaks and why

### 7. Output format

Close the response with:

```markdown
### Most likely suspect

[`abc1234567`](https://github.com/grafana/grafana/commit/abc1234567) - Alice Example - "DashboardScene: rename AddPanel test id"

### Full ranked list

1. [`abc1234567`](...) - ...
   - Touches `public/app/features/dashboard-scene/scene/PanelMenuBehavior.ts`
   - Failing test `AddPanel > can add panel` queries `data-testid=new-panel-button` which this commit renamed to `add-panel-button`

2. [`def5678901`](...) - ...
   - ...

### Range

N commits between [`<good>`](https://github.com/grafana/grafana/commit/<good>) ... [`<bad>`](https://github.com/grafana/grafana/commit/<bad>). [Full diff](https://github.com/grafana/grafana/compare/<good>...<bad>).
```

Use markdown links throughout - they render clickably and the user can jump to the commit with one click.

## When things go wrong

- **No failed nightly exists** - tell the user, stop. Don't fabricate one.
- **No successful nightly exists** - use the earliest nightly as baseline, warn that the range is wider than ideal.
- **grafana-dev job name doesn't match `grafana-dev@*` pattern** - the matrix format may have changed. Report the actual job names and ask the user to point at the right one.
- **Build ID doesn't resolve to a grafana CI run** - fall back to `docker buildx imagetools inspect` and report that the tag→SHA mapping had to guess. Ranking still works, it's just less reliable.
- **Commit range is truncated at 250** - baseline is stale (nightly has been red for a while). Note the truncation in the output and flag that a human should review the full range if the top suspect doesn't look right.
- **Failing log shows infrastructure errors, not test failures** - stop and report. This skill can't triage Docker / runner issues.

## Notes for future work

- This skill is heuristic. It's a head-start, not a bisect - a wrong top suspect is expected sometimes.
- A "bisect mode" (automated binary search over intermediate grafana-dev tags, each running plugin-e2e) would give exact answers but is expensive (N test runs × ~15min each). Only consider adding it if the heuristic consistently misses.
- A CI-driven version of this skill (triggered from `playwright-nightly.yml` on failure via `anthropics/claude-code-action`, posting as a threaded Slack reply) is a natural next step once this manual version is proven.
