---
id: debug-logs
title: Use logs to debug your extension
description: Use logs to debug your extension during development.
keywords:
  - grafana
  - plugins
  - plugin
  - extensions
  - ui-extensions
  - debug
  - logs
sidebar_position: 90
---

:::info
This feature is only available when running Grafana in development mode.
:::

If you're developing an extension (either for Grafana or for a plugin), the Extensions log view is an admin page that displays all the logs collected by Grafana while developing UI extensions. 

To access it, go to **Grafana > Administration > Plugins and data > Extensions** while working in development mode to see the logs of all the tabs active in your browser. This way you can easily open the extensions log view in one browser or tab and debug your extensions in another tab.

![Use log debugging while developing your extension.](/img/extension-debug.gif)