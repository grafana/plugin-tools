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

App plugins are Grafana plugins that can bundle data source and panel plugins within one package. They also let you create custom pages within Grafana. Custom pages enable the plugin author to include things like documentation, sign-up forms, or to control other services over HTTP.

Apps will show up in the navigation menu and they also allow you to define [UI Extensions](../ui-extensions/)

### Prerequisites

- Grafana v9.0 or later
- [LTS](https://nodejs.dev/en/about/releases/) version of Node.js

## Create a new app plugin

<CreatePlugin pluginType="app" />


:::note

If you choose to have a backend for your app plugin you must run `mage -v` before starting Grafana with docker.

::: 


## Anatomy of a plugin

<PluginAnatomy />

## Development workflow

Next, you'll learn the basic workflow of making a change to your app, building it, and reloading Grafana to reflect the changes you made.

First, you need to add your panel to a dashboard:

1. Open Grafana in your browser.
1. Navigate to Apps -> Your App Name


Now that you can view your app root page (page one in the example), try making a change to the app plugin:

1. In `PageOne.tsx`, change some of the page text content:

   ```tsx title="src/pages/PageOne.tsx"
    <PluginPage>
        New page content
    </PluginPage>
    
   ```

1. Save the file.
1. In the browser, reload Grafana to see the new changes.


## Adding a new page in the navigation menu

To add pages to the navigation menu unders your app menu item you need to modify the `plugin.json` file [`includes` section](http://localhost:4000/developers/plugin-tools/reference/plugin-json#includes).

When you scaffold your plugin there will be some example pages added to the navigation menu. Each of them follow a path such as `/a/%PLUGIN_ID%/PAGE_NAME`. Any requests sent to /a/%PLUGIN_ID%, e.g. /a/myorgid-simple-app/, are routed to the root page of the app plugin. The root page is a React component that returns the content for a given route.

Let's add a new page to the navigation menu:

1. Modify the `plugin.json` to add a new page

    ```json title="src/plugin.json"
    // ...
    "includes": [
        // ...
        {
            type: "page",
            name: "New Page",
            path: "/a/%PLUGIN_ID%/new-page",
            roles: "Admin"
            addToNav: true
            defaultNav: false
        }
    ]
    ```

1. Save the `src/plugin.json` file 
1. Restart your Grafana instance.

:::note

Because you changed the `plugin.json` file you will also need to restart Grafana. To do this you need to stop docker from the terminal you ran `docker compose up` (use ctrl-c to stop it) and run `docker-compose up` again.

:::

You will now find the new page in the navigation menu. You can now edit the React Router in `src/components/App/App.tsx` and point a custom component to it.

1. Create a new file called `src/pages/NewPage.tsx` and add the following code:

   ```tsx title="src/pages/NewPage.tsx"
    import React from 'react';
    import { PluginPage } from '@grafana/runtime';

    export function NewPage() {
        return (
            <PluginPage>
            New Page
            </PluginPage>
        );
    }
    ```

2. Modify the Routes in `src/components/App/App.tsx` to recognize the new page:


    ```tsx title="src/components/App/App.tsx"
    {/* .... */}
    <Route path="new-page" element={<NewPage />} />
    ```

3. Save the file.
4. Reload Grafana to see the new page in place

You don't need to register all your pages inside `includes` in your `plugin.json`. Only pages that you wish to add to the navigation menu.

:::note

You can only have one level of pages in the navigation menu. Sub-menu items are not supported.

:::


## Configuration page

Apps plugins can have a configuration page where your users can store any settings your plugin might need.

Your plugin should already have an example configuration page with its source code located in `src/components/AppConfig/AppConfig.tsx`

### Saving user settings

You are free to design and implement your own configuration page as you wish, to store the user settings you must send a POST request to `/api/plugins/%PLUGIN_ID%/settings` with `jsonData` and `secureJsonData` as data.

```ts
export const updatePluginSettings = async (pluginId: string, data: Partial<PluginMeta>) => {
  const response = await getBackendSrv().fetch({
    url: `/api/plugins/${pluginId}/settings`,
    method: 'POST',
    data,
  });

  return lastValueFrom(response);
};
```

### Retrieving user settings

The user settings are part of the plugin meta. You can retrieve them inside a react component by using the `usePluginContext` hook


```tsx
import React from 'react';
import usePluginContext from '@grafana/data';

function MyComponent() {
    const context = usePluginContext()
    // user settings
    const jsonData = context.meta.jsonData;

}
```

## Fetch data from frontend code using the data proxy

If you want to fetch data from your app frontend code without [CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS) issues or using authenticated requests you want to use the [data proxy](../create-a-plugin/extend-a-plugin/fetch-data-from-frontend.md)

## Bundle plugins inside your app

You can bundle datasources and panel plugins inside your app plugins. See [Bundle datasources and panels inside app plugins](../create-a-plugin/extend-a-plugin/bundle-plugins-inside-apps)


## Include external plugins

If you want to let users know that your app requires an existing plugin, you can add it as a dependency in `plugin.json`. Note that they'll still need to install it themselves.

```json title="src/plugin.json"
"dependencies": {
  "plugins": [
    {
      "type": "panel",
      "name": "Worldmap Panel",
      "id": "grafana-worldmap-panel",
      "version": "^0.3.2"
    }
  ]
}
```
