---
id: interpolate-variables
title: Interpolate variables in panel plugins
description: Add support for variables in Grafana panel plugins.
keywords:
  - grafana
  - plugins
  - plugin
  - panel
  - queries
  - variables
---

Variables are placeholders for values, and you can use them to create templated queries, and dashboard or panel links. For more information on variables, refer to [Templates and variables](https://grafana.com/docs/grafana/latest/dashboards/variables).

Grafana provides helper functions to interpolate variables in a string template. The `replaceVariables` function is available in the `PanelProps`.

Add `replaceVariables` to the argument list, and pass a user-defined template string to it:

```tsx
export function SimplePanel({ options, data, width, height, replaceVariables }: Props) {
  const query = replaceVariables('Now displaying $service');

  return <div>{query}</div>;
}
```
