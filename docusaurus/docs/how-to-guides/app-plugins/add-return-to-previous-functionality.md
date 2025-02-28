---
id: add-return-to-previous-functionality
title: Allow users to easily return to a specific context
description: Allow users to easily return to a specific context.
keywords:
  - grafana
  - plugins
  - plugin
  - return to previous
  - return to
  - context
---

# Introduction

A user's _context_ can switch dramatically while browsing Grafana, and sometimes their breadcrumbs don't match their history. In these cases, the users can't go back easily and may become frustrated with their experience. This guide defines _context_ and shows how you can add the `ReturnToPrevious` functionality to your plugin that solves this issue with minimal coding.

## Context in Grafana

For the purposes of Grafana plugin development, the term _context_ refers to a user's place along a path from one root URL to another. Note that in Grafana, this term may also be used in connection with other Grafana features such as Explore or Dashboards.

Use breadcrumbs to notice a change in a user's context. For example:

- Did you go from **Home > Dashboards** to **Home > Explore**? Then you changed the context you were in.

- Did you go from **Home > Dashboards > Playlist > Edit playlist** to **Home > Dashboards > Reporting > Settings**? Then you're in the same context as previously.

As you can see, the key is the change on the URL from the root level. Because Explore and Dashboards are both at the root level, the user's context changed. But this was not the case with the user's path to Reporting Settings.

## Add functionality to allow users to return to their previous context

1. Select an interactive item, such as a link or button, to trigger the `ReturnToPrevious` functionality. This element is the one that will lead the user to another context within Grafana. For example, the `Go to dashboard` button of an Alert rule.

2. To set the values needed, you can use the `useReturnToPrevious` hook from `@grafana/runtime`:

- Specify the `title` to show in the button.
- (Optional) Pass a second argument to set the `href` if it is different from the current URL.

For example:

```tsx
import { config, useReturnToPrevious } from '@grafana/runtime';

const setReturnToPrevious = useReturnToPrevious();

[...]

<LinkButton
size="sm"
       key="dashboard"
       variant="primary"
       icon="apps"
       href={`d/${encodeURIComponent(dashboardUID)}`}
       onClick={() => {
       	setReturnToPrevious(rule.name);
       }}
>
      	Go to dashboard
</LinkButton>
```

3. Verify that it works as expected. When you go from your app plugin to another area of Grafana through that interactive element, then the 'Return to previous' button should appear.

## Usage guidelines

### Do this

- Do trigger the 'ReturnToPrevious' functionality through a link or an interactive element with an `onClick` event.
- Do only use the 'ReturnToPrevious' functionality when the user is sent to another context, such as from Alerting to a Dashboard.
- Do specify a button title that identifies the page to return to in the most understandable way.

### Don't do this

- Don't trigger the 'ReturnToPrevious' functionality via an element other than a link or button.
- Don't use this functionality when going from one page to another in the same context.
- Don't use text such as 'Back to the previous page'. Be specific.
