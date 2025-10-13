---
id: build-an-app-plugin
title: Build an app plugin
sidebar_position: 10
description: Learn how to create an app plugin.
keywords:
  - grafana
  - plugins
  - plugin
  - app
---

import CreatePlugin from '@shared/create-plugin-frontend.md';
import PluginAnatomy from '@shared/plugin-anatomy.md';

## Introduction

In this tutorial you will learn how to create an _app plugin_. App plugins are Grafana plugins that allow you to bundle data sources and panel plugins within a single package. They also enable you to create custom pages within Grafana, providing a dedicated space for documentation, sign-up forms, integration with other services via HTTP. You can also use app plugins to create [Scenes apps](https://grafana.com/developers/scenes/).

App plugins can be displayed in the [navigation menu](#add-a-page-in-the-navigation-menu) and offer the flexibility to define [UI extensions](../how-to-guides/ui-extensions/ui-extensions-concepts.md).

### Prerequisites

- Grafana v10.0 or later
- [LTS](https://nodejs.dev/en/about/releases/) version of Node.js

## Create a new app plugin

<CreatePlugin pluginType="app" />

:::note

If you choose to have a backend for your app plugin, run `mage -v` to build the binary before starting Grafana with Docker.

:::

## Anatomy of a plugin

<PluginAnatomy />

## Development workflow

Next, you'll learn the basic workflow of making a change to your app, building it, and reloading Grafana to reflect the changes you made.

The first step is to see your scaffolded plugin in action.

1. Start your Grafana instance with `docker compose up`.
1. Open Grafana in your browser. Go to [http://localhost:3000](http://localhost:3000).
1. Go to **Apps** -> **Your App Name**.

Now that you can view your app root page (page one in the example), try making a change to the app plugin:

1. In `PageOne.tsx`, change some of the page text content:

   ```tsx title="src/pages/PageOne.tsx"
   <PluginPage>New page content</PluginPage>
   ```

1. Save the file.
1. Reload Grafana in your browser. Your changes should appear.

## Add a page in the navigation menu

To add pages to the navigation menu under your app menu item, modify the `plugin.json` file's [`includes` section](../reference/metadata.md#includes).

When you scaffold your plugin, the `create-plugin` tool adds some example pages to the navigation menu. Each example page follows a path such as `/a/%PLUGIN_ID%/PAGE_NAME`. Any requests sent to /a/%PLUGIN_ID%, for example, `/a/myorgid-simple-app/`, are routed to the root page of the app plugin. The root page is a React component that returns the content for a given route.

Let's add a new page to the navigation menu:

1. Modify `plugin.json` to add a new page.

   ```json title="src/plugin.json"
   // ...
   "includes": [
       // ...
       {
           "type": "page",
           "name": "New Page",
           "path": "/a/%PLUGIN_ID%/new-page",
           "addToNav": true,
           "defaultNav": false
       }
   ]
   ```

1. Save the `src/plugin.json` file.
1. Restart your Grafana instance.

:::note

After saving the `plugin.json` file, you need to restart your Grafana instance to see the new page in the navigation menu.

:::

The new page appears in the navigation menu. You can now edit the React router in `src/components/App/App.tsx` and point a custom component to it.

1. Create a new file called `src/pages/NewPage.tsx` and add the following code:

   ```tsx title="src/pages/NewPage.tsx"
   import React from 'react';
   import { PluginPage } from '@grafana/runtime';

   export function NewPage() {
     return <PluginPage>New Page</PluginPage>;
   }
   ```

1. Modify the routes in `src/components/App/App.tsx` to recognize the new page:

   ```tsx title="src/components/App/App.tsx"
   {
     /* .... */
   }
   <Route path="new-page" element={<NewPage />} />;
   ```

1. Save the file.
1. Reload Grafana to see the new page in place.

You don't need to register all your pages inside `includes` in your `plugin.json`. Register only pages that you want to add to the navigation menu.

:::tip

You can limit which users have access to pages in the navigation menu by using the [`role`](/reference/plugin-json#includes) property.

:::

:::note

You can only have one level of pages in the navigation menu. Sub-menu items are not supported.

:::

## Configuration page

You can add a configuration page to your app plugin where users can configure any settings your plugin needs. Your plugin should already have an example configuration page with its source code located in `src/components/AppConfig/AppConfig.tsx`.

### Save user settings

To store user settings, send a POST request to `/api/plugins/%PLUGIN_ID%/settings` with the `jsonData` and `secureJsonData` as data.

```ts
export const updatePluginSettings = async (pluginId: string, data: Partial<PluginMeta>) => {
  const response = await getBackendSrv().fetch({
    url: `/api/plugins/${pluginId}/settings`,
    method: 'POST',
    data, // data: { jsonData: { ... }, secureJsonData: { ... } }
  });

  return lastValueFrom(response);
};
```

### Retrieve user settings

The user settings are part of the plugin `meta`. You can retrieve them inside a React component by using the `usePluginContext` hook. For example:

```tsx
import React from 'react';
import usePluginContext from '@grafana/data';

function MyComponent() {
  const context = usePluginContext();
  // user settings
  const jsonData = context.meta.jsonData;
}
```

## Fetch data from frontend code using the data proxy

If you want to fetch data from your app frontend code (for example, from a third party API) without [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) issues or using authenticated requests, then you can use the [data proxy](../how-to-guides/data-source-plugins/fetch-data-from-frontend).

## Add nested plugins inside your app

You can nest data sources and panel plugins inside your app plugins. See [Work with nested plugins](../how-to-guides/app-plugins/work-with-nested-plugins).

## Include external plugins

If you want to let users know that your app requires an existing plugin, you can add it as a dependency in `plugin.json`. Note that they'll still need to install it themselves.

```json title="src/plugin.json"
"dependencies": {
  "plugins": [
    {
      "type": "panel",
      "name": "Clock Panel",
      "id": "grafana-clock-panel",
      "version": "^2.1.0"
    }
  ]
}
```

## Next steps

- [Sign your plugin](../publish-a-plugin/sign-a-plugin.md)
- [Publish your plugin](../publish-a-plugin/publish-or-update-a-plugin.md)
- Write [e2e tests](../e2e-test-a-plugin/get-started.md) for your plugin
