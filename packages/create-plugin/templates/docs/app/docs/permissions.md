---
title: Permissions
description: "The roles {{{yamlEscape pluginName}}} adds and the access it needs."
keywords:
  - "{{{yamlEscape pluginName}}}"
  - app
  - permissions
  - RBAC
sidebar_position: 7
---

This document explains who can use each part of {{{pluginName}}} and what the app can access. For general information, refer to [Role-based access control for app plugins](https://grafana.com/docs/grafana/latest/administration/roles-and-permissions/access-control/rbac-for-app-plugins/).

## Roles

<!-- section-brief
Fill this in: A table with one row per entry in `roles` in `src/plugin.json`:

| Role | Description | Granted by default to |
| ---- | ----------- | --------------------- |

Use the role's display name, or its name if it has none, and take the defaults from `grants`. After the table, say what each role lets a user do in the app, based on the role's permissions and the `role` and `action` gates on `includes` entries in `src/plugin.json`, together with any checks in the app's code, not on the role's name. Describe access in terms of pages and actions rather than raw permission names.

If `src/plugin.json` has no `roles`, remove this section and Assign a role below.
-->

## Page access

<!-- section-brief
Fill this in: A table of the app pages that need more than the `Viewer` role, with the role or permission each one needs, from the `role` and `action` of each `includes` entry in `src/plugin.json`. Link each page to its docs page.

If no `includes` entry sets `role` or `action`, remove this section.
-->

## What the app can access

<!-- section-brief
Fill this in: A table of the permissions in `iam.permissions` in `src/plugin.json`, with the action, the scope and why the app needs it, based on what the backend does with that access. Administrators read this before they install the app, so be precise.

If `src/plugin.json` has no `iam`, remove this section.
-->

## Assign a role

To assign a role to a user, team or service account, refer to [Assign RBAC roles](https://grafana.com/docs/grafana/latest/administration/roles-and-permissions/access-control/assign-rbac-roles/).
