---
id: build-ai-plugin
title: Build a plugin with AI
sidebar_position: 40
description: Learn how to build a Grafana data source plugin and app plugin by prompting an AI coding assistant.
keywords:
  - grafana
  - claude
  - plugins
  - plugin
  - ai
  - llm
  - datasource
  - app
---
 
# Build a plugin with AI 
 
This tutorial shows you how to build a Grafana plugin by prompting an AI coding assistant step by step. First, you create a data source plugin using the Barcelona Bicing API, and then you create an app plugin that uses that data source to show station data in a list and on a map.
 
In this tutorial, you'll:
 
1. [Scaffold a data source plugin with a backend component](#1-create-the-data-source-plugin-scaffold).
1. [Prompt your AI tool to implement the data source](#2-prompt-your-ai-tool-to-implement-the-data-source).
1. [Scaffold an app plugin](#3-create-the-app-plugin-scaffold).
1. [Prompt your AI tool to build the app views](#4-prompt-your-ai-tool-to-build-the-app-list-view).

## Before you begin
 
Before you begin, make sure to:
 
- Install the latest version of Grafana.
- Install a current LTS version of Node.js.
- Install [Docker](https://docs.docker.com/get-docker/).
- Install [Go](https://go.dev/) and [Mage](https://magefile.org/) for the data source plugin backend.
- Have an AI coding assistant available in your editor or terminal.
 
This tutorial uses the following API details:

- Station information URL: `https://barcelona.publicbikesystem.net/customer/ube/gbfs/v1/en/station_information`
- Station status URL: `https://barcelona.publicbikesystem.net/customer/ube/gbfs/v1/en/station_status`

No access token is required for the endpoints used in this tutorial.

### Useful tips to work with AI tools

:::important
**Do not let AI bootstrap the plugin. Make sure you're using `create-plugin`.**
:::

When working with AI, you're steering the wheel! Do not let your AI tool guess. Instead, give it clear prompts with guidelines and constraints, keep it inside Grafana plugin patterns, and verify each milestone in Grafana before moving on.

These patterns help keep the AI useful:
 
- **Start with facts**: Give the API contract, plugin type, and hard constraints first.
- **Ask it to confirm before executing any task**: This helps catch drift before the AI edits files.
- **Tell it what not to do**: For example, no invented API fields and no direct app-to-API calls.
- **Ask it to name files before editing**: This makes review easier.
- **Keep prompts milestone-sized**: One milestone for the data source, one for the list page, one for the map page.

## 1. Create the data source plugin scaffold

:::important
**Do not let AI bootstrap the plugin. Make sure you're using `create-plugin` to perform the initial scaffolding.**
:::

### Scaffold the plugin and build the frontend 

Scaffold a data source plugin (in this case, let's call it `bcapi`) with a backend component:
 
```sh
npx @grafana/create-plugin@latest --plugin-type=datasource --backend --plugin-name=bcapi --org-name=myorg
```
 
Move into the plugin directory, install the dependencies, and follow any other prompt to update or fix your setup.
 
```sh
cd ./myorg-bcapi-datasource
npm install
```
 
Start the frontend watcher:
 
```sh
npm run dev
```

**Keep this terminal tab open and open a new one to continue**.

### Build the plugin backend and start the development server

The Grafana development server runs in a Docker Linux container, so the backend binary must target Linux regardless of your local operating system. 

**Open a new terminal tab** and run the following to build the plugin backend code: 

On x86_64:

```sh
mage -v build:linux
```

On Arm64:

```sh
mage -v build:linuxARM64
```

:::note
Re-run this command every time you edit your backend files.
:::

Start the Grafana development server:
 
```sh
npm run server
```

Or, start it directly with Docker:

```sh
docker compose up
```

### Open Grafana

Open Grafana at [http://localhost:3000](http://localhost:3000).
 
Verify that the scaffold loads:
 
1. Go to **Connections** > **Data sources**.
1. Add or select your new data source.
1. Go to **Explore** and select the data source you just created. To learn how to query and visualize your data, refer to [Explore your data](https://grafana.com/docs/grafana/latest/visualizations/explore/).
 
:::note
You don't see real data at this point. This is expected. 
:::

## 2. Prompt your AI tool to implement the data source

Before you ask your AI agent to change any code, paste this prompt into your AI tool:
 
```text
I am building a Grafana plugin around the Barcelona Bicing API.
 
You must follow the official Grafana plugin documentation and existing plugin scaffold patterns.
Do not invent API fields, routes, or Grafana plugin APIs.
If something is unclear, ask me a short question instead of guessing.
 
Facts you must use:
- Station information URL: https://barcelona.publicbikesystem.net/customer/ube/gbfs/v1/en/station_information
- Station status URL: https://barcelona.publicbikesystem.net/customer/ube/gbfs/v1/en/station_status
- Both endpoints return a response wrapper with data.stations
 
Data source plugin requirements:
- Keep API requests in the Go backend component
- Add a config editor with station information URL and station status URL fields (no default values)
- Add a query editor with two query types: station_status and station_information
- If `station_information` is selected, let the user choose a station from a dropdown
- Return Grafana data frames
- Add a working Save & Test health check
```
 
Next, set the AI in plan mode and prompt it to build the data source in the data source plugin directory:
 
```text
Help me build this Grafana data source plugin.
 
Tasks:
1. Review the scaffold and propose a short plan.
2. Then implement the plugin.
 
Requirements:
- Use the backend component in Go for all API requests
- Keep the plugin as a data source plugin with backend support
- Add a config editor with station information URL and station status URL fields (no default values)
- Add a query editor with two query types: station_status and station_information
- If station_information is selected, let the user choose a station from a dropdown
- Unwrap data.stations from the API response
- Return Grafana data frames that Grafana can render
- Add a health check for Save & Test
 
Important constraints:
- Do not call the Bicing API directly from the browser
- Do not invent extra endpoints or fields
- Keep the query model simple and typed
- Tell me which files you plan to change before editing them
```

Review the changes made, if any Go files have been modified, stop the running Grafana process and start it again:
 
```sh
npm run server
```

### Review the data source 

Verify the result:
 
1. Go to **Connections** > **Data sources** and select the data source.
1. If missing, enter the station information URL and station status URL.
1. Click **Save & Test**. If everything works, you see live station data. If there are any errors, run them by your tool until they're fixed.
1. Go back to **Explore** and run both query types.

## 3. Create the app plugin scaffold

:::important
Make sure you build the app plugin **in the same Grafana environment** as the data source plugin.
:::

In a new terminal, create an app plugin:
 
```sh
npx @grafana/create-plugin@latest --plugin-type=app --plugin-name=bcapi --org-name=myorg --no-backend
```
 
Move into the new app plugin directory and install the dependencies:
 
```sh
cd myorg-bcapi-app
npm install
```
 
Start the frontend watcher:
 
```sh
npm run dev
```
 
**In a different tab**, start the Grafana development server:
 
```sh
npm run server
```

### Verify the app plugin

In your Grafana instance, go to **Connections** and check the app plugin has been scaffolded.

## 4. Prompt your AI tool to build the app list view

### Prompt the AI to add the list view 

Use this prompt in the app plugin directory:
 
```text
Help me build a Grafana app plugin that has the `myorg-bcapi-datasource` data source plugin installed when it starts. Use docker-compose to provision the plugin.
 
Tasks:
1. Review the scaffold and propose a short plan.
2. Then implement the first app page.
 
Requirements:
- Keep only one page in the navigation to start with
- Let me select the Bicing data source at the top of the page
- Default to the first matching data source instance if one exists
- Query station data through the data source plugin
- Do not make direct HTTP requests to the Bicing API from the app
- Show the list of stations
- Show station details when I hover over a station
- Keep the UI simple and easy to verify in Grafana
- The plugin must run unsigned
 
Important constraints:
- Follow the official Grafana plugin documentation
- Do not bypass the data source plugin
- Tell me which files you plan to change before editing them
```

#### Verify the list view
 
1. Go to **Apps** and navigate to your app.
1. Confirm that the page loads.
1. Confirm that the app reads from the data source.
1. Hover over a station and verify that details appear.
 
### Prompt the AI to add the map page
 
After the list page works, use this prompt to add the map view:
 
```text
Add a second page to this Grafana app plugin.
 
Requirements:
- Add a page in the app navigation
- Show all stations on a map
- Show tooltip details on hover
- Use react-map-gl and OpenFreeMap
- Keep using the existing data source plugin for station data
- Keep the current list page working
 
Important constraints:
- Do not replace the data source with direct HTTP requests
- Keep the changes focused on adding the map page
```
 
#### Verify the map view
 
1. Reload Grafana.
1. Go to **Apps** and navigate to your app.
1. Go to the newly created map page from the app navigation.
1. Verify that stations appear on the map.
1. Verify that hover details match the station data.
 
## Troubleshooting
 
### The data source shows no real data right after scaffolding
 
This is expected. The scaffold loads, but it does not query a real API yet.
 
### Backend changes do not show up
 
If the AI changed Go files, stop the running server and restart Grafana:
 
```sh
npm run server
```
 
### The app looks stale
 
Try the following:
 
- Make sure `npm run dev` is still running.
- Hard refresh the browser.
- Restart Grafana if the plugin metadata changed.
 
### The AI starts bypassing the data source
 
Stop the AI and correct the prompt. For this tutorial, the app plugin must read station data through the data source plugin. Don't let the app call the Bicing API directly.
 
## Next steps

You're done! 

Next, you can learn about:

- [Plugins in Grafana](https://grafana.com/docs/grafana/latest/administration/plugin-management/)
- [Data visualization](https://grafana.com/docs/grafana/latest/visualizations/) 
- [Developer resources](https://grafana.com/docs/grafana/latest/developer-resources/)