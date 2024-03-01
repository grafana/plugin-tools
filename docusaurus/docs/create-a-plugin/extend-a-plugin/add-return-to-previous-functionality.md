---
id: add-return-to-previous-functionality
title: Add 'Return to previous' functionality
description: Offer an easy way of return to your context.
keywords:
  - grafana
  - plugins
  - plugin
  - return to previous
  - return to
  - context
---

# Introduction to the 'Return to previous' functionality

The users' context can switch dramatically during their experience browsing Grafana and, in cases where the breadcrumbs do not match the history, the users cannot go back easily.

The 'Return to previous' functionality, which gives the user an easy way of going back to the previous context, is an opt-in feature that is particularly useful for app plugin developers.

## Definition of “Context”
Before we go into details, we need to cover the major concept here:

__Context__: 

This term mainly refers to the different plugins that live within Grafana, but this is also extendable to other sections such as Explore or Dashboards. One trick to notice a change in the context is looking at our breadcrumbs: 

Did you go from *Home > Dashboards* to *Home > Explore*? You changed the context you were in.

Did you go from *Home > Dashboards > Playlist > Edit playlist* to  *Home > Dashboards > Reporting > Settings*? You are in the same context as previously.

As you can see, the key is the change on the URL from the root level.


## Why should I add the 'Return to previous' functionality to my plugin?
It offers an easy way to return to your app plugin.
The code changes required to introduce this are minimal.


## Add the 'Return to previous' functionality
1. Select an interactive item, such as a link or button, to trigger the `ReturnToPrevious` functionality. This element is the one that will lead the user to another context within Grafana. For example, the `Go to dashboard` button of an Alert rule.

2. To set the values needed, you can use the `useReturnToPrevious` hook from `@grafana/runtime`: 
- Specify the `title` to show in the button.
- Optionally, pass a second argument to set the `href` if it is different from the current URL.

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

3. Check it works as expected: when you go from your app plugin to another area of Grafana through that interactive element the 'Return to previous' button will be shown.



## Usage guidelines

### Do's
- Do trigger the 'Return to previous' functionality through a link or an interactive element with an onClick event.
- Do only use the 'Return to previous' functionality when the user is sent to another context, such as from Alerting to a dashboard.
- Do specify a button title that identifies the page to return to in the most understandable way.

### Don't's
- Do not trigger the 'Return to previous' functionality via an element other than a link or button.
- Do not use this functionality when going from one page to another in the same context.
- Do not use text such as 'Back to the previous page'. Be specific.
