---
name: bump-plugin-e2e
description: Use when bumping the @grafana/plugin-e2e version in the create-plugin template. Fetches the latest npm version, updates _package.json, commits, and opens a draft PR.
---

# Bump @grafana/plugin-e2e in create-plugin template

## Overview

Updates the `@grafana/plugin-e2e` devDependency in the create-plugin common template to the latest published npm version, then commits and opens a draft PR.

## Steps

### 1. Get the latest version

```bash
npm view @grafana/plugin-e2e version
```

Save the output - this is `<NEW_VERSION>`.

### 2. Check the current version

Read [packages/create-plugin/templates/common/\_package.json](packages/create-plugin/templates/common/_package.json) and note the current `@grafana/plugin-e2e` semver range (line ~20).

Note the semver range prefix (e.g. `^`, `~`, or exact). If the version number already matches `<NEW_VERSION>`, stop - nothing to do.

### 3. Update \_package.json

Replace only the version number, preserving the existing range prefix exactly.

Example (prefix was `^`, keep it `^`):

```json
- "@grafana/plugin-e2e": "^3.5.0",
+ "@grafana/plugin-e2e": "^3.6.0",
```

### 4. Create a worktree, commit and push

Use a git worktree so the current workspace is never disturbed.

```bash
WORKTREE=/tmp/plugin-tools-e2e-bump
BRANCH=bump/plugin-e2e-<NEW_VERSION>
REPO_ROOT=$(git rev-parse --show-toplevel)

git worktree add "$WORKTREE" -b "$BRANCH" main
```

Edit the `_package.json` inside the worktree (same relative path: `packages/create-plugin/templates/common/_package.json`), then commit and push:

```bash
git -C "$WORKTREE" add packages/create-plugin/templates/common/_package.json
git -C "$WORKTREE" commit -m "Create Plugin: bump @grafana/plugin-e2e to ^<NEW_VERSION>"
git -C "$WORKTREE" push -u origin "$BRANCH"

git worktree remove "$WORKTREE"
```

### 5. Open a draft PR

Use the repo PR template structure. Title format: `Create Plugin: Bump @grafana/plugin-e2e to <NEW_VERSION>`

```bash
gh pr create --draft \
  --title "Create Plugin: Bump @grafana/plugin-e2e to <NEW_VERSION>" \
  --label "patch" \
  --label "release" \
  --body "$(cat <<'EOF'
**What this PR does / why we need it**:

Bumps `@grafana/plugin-e2e` to `^<NEW_VERSION>` in the create-plugin common template.

**Which issue(s) this PR fixes**:

Fixes #

**Special notes for your reviewer**:

Automated version bump. Check the [@grafana/plugin-e2e changelog](https://github.com/grafana/plugin-tools/blob/main/packages/plugin-e2e/CHANGELOG.md) for notable changes.
EOF
)"
```

Return the PR URL to the user.
