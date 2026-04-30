---
id: build-a-plugin-with-ai
title: Build a plugin with AI
sidebar_position: 40
description: Learn how to build a Grafana data source plugin and app plugin by prompting an AI coding assistant.
keywords:
  - grafana
  - plugins
  - plugin
  - ai
  - llm
  - datasource
  - app
---
 
# Build a plugin with AI
 
This tutorial shows you how to build a Grafana plugin by prompting an AI coding assistant step by step. You create a data source plugin for the Barcelona Bicing API, and then create an app plugin that uses that data source to show station data in a list and on a map.
 
The goal is not to let AI guess. The goal is to give it clear prompts, keep it inside Grafana plugin patterns, and verify each milestone in Grafana before moving on.
 
In this tutorial, you'll:
 
1. Scaffold a data source plugin with a backend component.
1. Prompt an AI tool to implement the data source.
1. Scaffold an app plugin.
1. Prompt the AI tool to build the app views.
1. Optionally prompt the AI tool to add an AI feature inside the app.
 
## Prerequisites
 
Before you begin, ensure you have:
 
- Install Grafana v10.0 or later.
- Install a current LTS version of Node.js.
- Install [Docker](https://docs.docker.com/get-docker/).
- Install [Go](https://go.dev/) and [Mage](https://magefile.org/) for the data source backend.
- Have an AI coding assistant available in your editor or terminal.
 
This tutorial uses the following API details:
 
- Base URL: `https://cc-workshop-proxy.grafana.fun/bcapi/`
- Authorization header: `Authorization: Bearer barcelona2026`
- Endpoints:
  - `GET /bcapi/station_information`
  - `GET /bcapi/station_status`
 
## 1. Create the data source plugin scaffold
 
Scaffold a data source plugin with a backend:
 
```sh
npx @grafana/create-plugin@latest --plugin-type=datasource --backend --plugin-name=bcapi --org-name=myorg
```
 
Move into the plugin directory and install dependencies:
 
```sh
cd myorg-bcapi-datasource
npm install
```
 
Start the frontend watcher:
 
```sh
npm run dev
```
 
To build the backend binary, run one of the following commands depending on your platform.
 
On Linux:
 
```sh
mage -v build:linux
```
 
On Arm64 Linux:
 
```sh
mage -v build:linuxARM64
```
 
On macOS:
 
```sh
mage -v build:darwin
```
 
Start Grafana:
 
```sh
npm run server
```
 
Open Grafana at [http://localhost:3000](http://localhost:3000).
 
Verify that the scaffold loads:
 
1. Open **Connections** > **Data sources**.
1. Add your new data source.
1. Open **Explore** and select the data source.
 
You don't see real data at this point. This is expected.
 
## 2. Give the AI the source of truth
 
Before you ask the AI to change code, paste this prompt into your AI tool:
 
```text
I am building a Grafana plugin around the Barcelona Bicing API.
 
You must follow the official Grafana plugin documentation and existing plugin scaffold patterns.
Do not invent API fields, routes, or Grafana plugin APIs.
If something is unclear, ask me a short question instead of guessing.
 
Facts you must use:
- Base URL: https://cc-workshop-proxy.grafana.fun/bcapi/
- Auth header: Authorization: Bearer barcelona2026
- Endpoints:
  - GET /bcapi/station_information
  - GET /bcapi/station_status
- Both endpoints return a response wrapper with data.stations
 
Data source plugin requirements:
- Keep API requests in the Go backend component
- Add a config editor with a base API URL defaulting to https://cc-workshop-proxy.grafana.fun/bcapi/
- Store the API key in secureJsonData
- Add a query editor with two query types: station_status and station_information
- If station_information is selected, let the user choose a station from a dropdown
- Return Grafana data frames
- Add a working Save & Test health check
 
App plugin requirements:
- The app must use the data source plugin instead of calling the API directly
- The app should show a station list view
- The app should show station details on hover
- The app should later add a second page with a map view
```
 
This prompt gives the AI the constraints it needs before you ask it to write code.
 
## 3. Prompt the AI to build the data source
 
Use this prompt in the data source plugin directory:
 
```text
Help me build this Grafana data source plugin.
 
Tasks:
1. Review the scaffold and propose a short plan.
2. Then implement the plugin.
 
Requirements:
- Use the backend component in Go for all API requests
- Keep the plugin as a data source plugin with backend support
- Add a config editor with a base API URL defaulting to https://cc-workshop-proxy.grafana.fun/bcapi/
- Store the API key in secureJsonData
- Add a query editor with two query types: station_status and station_information
- If station_information is selected, let the user choose a station from a dropdown
- Use Authorization: Bearer <api key> when calling the API
- Unwrap data.stations from the API response
- Return Grafana data frames that Grafana can render
- Add a health check for Save & Test
 
Important constraints:
- Do not call the Bicing API directly from the browser
- Do not invent extra endpoints or fields
- Keep the query model simple and typed
- Tell me which files you plan to change before editing them
```
 
Some AI tools, such as those with an agentic mode, separate the planning phase from editing. If your tool asks you to approve a plan before it makes changes, use this follow-up prompt:
 
```text
Implement the plan now.
 
Keep these rules in place:
- Backend requests only
- secureJsonData for the API key
- no invented API fields
- use station_id when joining station data
```
 
### What to review after the AI edits the data source
 
Check that:
 
- `src/plugin.json` still describes a data source plugin with a backend
- the config editor stores the base URL in `jsonData`
- the API key is stored in `secureJsonData`
- the query editor exposes `station_status` and `station_information`
- the backend calls the API and unwraps `data.stations`
- the plugin returns Grafana data frames
- **Save & Test** runs a real health check
 
### Verify the data source in Grafana
 
If the AI changed Go files, stop the running Grafana process and start it again:
 
```sh
npm run server
```
 
Then verify the result:
 
1. Open your data source settings in Grafana.
1. Enter the base URL and API key.
1. Click **Save & Test**.
1. Open **Explore** and run both query types.
 
If everything works, you see live station data.
 
:::note
Frontend changes usually appear through the watcher. Backend changes don't. If the AI edits Go files, restart Grafana before you debug anything else.
:::
 
## 4. Create the app plugin scaffold
 
Create an app plugin:
 
```sh
npx @grafana/create-plugin@latest --plugin-type=app --plugin-name=bcapi --org-name=myorg --no-backend
```
 
Move into the new app plugin directory and install dependencies:
 
```sh
cd myorg-bcapi-app
npm install
```
 
Start the frontend watcher:
 
```sh
npm run dev
```
 
Start Grafana:
 
```sh
npm run server
```
 
Before you prompt the AI, make sure your data source plugin is available in the same Grafana environment.
 
## 5. Prompt the AI to build the app list view
 
Use this prompt in the app plugin directory:
 
```text
Help me build this Grafana app plugin.
 
Tasks:
1. Review the scaffold and propose a short plan.
2. Then implement the first app page.
 
Requirements:
- Keep only one page in the navigation to start with
- Let me select the Bicing data source at the top of the page
- Default to the first matching data source instance if one exists
- Use the data source plugin to query station data
- Do not make direct HTTP requests to the Bicing API from the app
- Show the list of stations
- Show station details when I hover over a station
- Keep the UI simple and easy to verify in Grafana
 
Important constraints:
- Follow the official Grafana plugin documentation
- Do not bypass the data source plugin
- Tell me which files you plan to change before editing them
```
 
If your AI tool needs a second prompt to proceed, use:
 
```text
Implement the plan now.
 
Keep these rules in place:
- query through the data source plugin
- no direct API calls from the app
- keep the first page simple
```
 
### Verify the list view
 
1. Open **Apps** and navigate to your app.
1. Confirm that the page loads.
1. Confirm that the app reads from the data source.
1. Hover over a station and verify that details appear.
 
## 6. Prompt the AI to add the map page
 
Once the list page works, use this prompt:
 
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
 
Then verify the result:
 
1. Reload Grafana.
1. Open the new map page from the app navigation.
1. Verify that stations appear on the map.
1. Verify that hover details match the station data.
 
## 7. Prompt the AI to add an AI feature (optional)
 
After the base app works, you can add an AI-powered feature inside the plugin.
 
Use this prompt:
 
```text
Add a station insight feature to the map page.
 
Requirements:
- When a user clicks a station marker, use @grafana/llm to ask for a short explanation about that station and how to use it
- Use a non-streaming API
- Show a useful loading state and error state
- Do not block the rest of the map UI while waiting for the response
- Keep the map usable even if the LLM feature fails
```
 
Before you do this, ensure your Grafana instance has the Grafana LLM app installed and configured. For more information, refer to [Use LLMs and Grafana MCP in Grafana app plugins](../how-to-guides/app-plugins/use-llms-and-mcp.md).
 
## 8. Prompt patterns that work well
 
These patterns help keep the AI useful:
 
- **Start with facts**: Give the API contract, plugin type, and hard constraints first.
- **Ask for a short plan**: This helps catch drift before the AI edits files.
- **Tell it what not to do**: For example, no invented API fields and no direct app-to-API calls.
- **Ask it to name files before editing**: This makes review easier.
- **Keep prompts milestone-sized**: One milestone for the data source, one for the list page, one for the map page.
 
## Troubleshooting
 
### The data source shows no data right after scaffolding
 
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
 
## Notes for AI coding assistants
 
If you're using an AI coding assistant to follow this tutorial, keep your context short and factual:
 
- Cache only verified facts: base URL, auth header, endpoint names, plugin IDs, and restart rules.
- Re-read the current query model before editing the query editor or backend.
- Treat `secureJsonData` as mandatory for secrets, not a suggestion.
- If the app starts making direct API calls, classify that as drift and repair it.
- After each milestone, compress the state into five facts or fewer before the next prompt.
 
## Summary
 
In this tutorial, you used prompts to build a Grafana plugin with AI.
 
You:
 
- Scaffolded a data source plugin with a backend component.
- Prompted the AI to implement the data source.
- Scaffolded an app plugin.
- Prompted the AI to add a list page and a map page.
- Optionally, prompted the AI to add an AI feature inside the app.
 
The important part is not which AI tool you use. The important part is giving it precise prompts, keeping it grounded in Grafana plugin APIs, and verifying each milestone in Grafana.
 
## Next steps
 
- [Build a data source plugin](./build-a-data-source-plugin.md)
- [Build a data source plugin backend component](./build-a-data-source-backend-plugin.md)
- [Build an app plugin](./build-an-app-plugin.md)
- [Use LLMs and Grafana MCP in Grafana app plugins](../how-to-guides/app-plugins/use-llms-and-mcp.md)