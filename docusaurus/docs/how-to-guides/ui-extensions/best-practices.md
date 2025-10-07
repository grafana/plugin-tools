---
id: best-practices
title: Best practices for UI extensions
---

# Best practices

With great power comes great responsibility. UI extensions are a powerful tool, but there are a few things to keep in mind when using them.

## Grafana core should not extend plugins

Grafana core should never extend an extension point living in a plugin. We don't want the dependency to flow in that direction since it can have unwanted side effects.

## Exposing components from Grafana core

If you want to expose a component from Grafana core, you can expose it using UI extensions, but only if it is publicly available and it doesn't make sense to expose it via `@grafana/ui`.

If you want to expose it to a restricted number of plugins, you should consider using the "expose restricted APIs" functionality.
