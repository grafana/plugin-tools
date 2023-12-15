# Grafana Scenes App Plugin Template

This template is a starting point for building an app plugin with [scenes](https://grafana.com/developers/scenes) for Grafana.

## What are Grafana app plugins?

App plugins can let you create a custom out-of-the-box monitoring experience by custom pages, nested datasources and panel plugins.

## What is @grafana/scenes?

[@grafana/scenes](https://github.com/grafana/scenes) is a framework to enable versatile app plugins implementation. It provides an easy way to build apps that resemble Grafana's dashboarding experience, including template variables support, versatile layouts, panels rendering and more.

To learn more about @grafana/scenes usage please refer to the [documentation](https://grafana.com/developers/scenes)

## What does this template contain?

1. An example of a simple scene. See [Home scene](./src/pages/Home/Home.tsx)
1. An example of a scene with tabs. See [Scene with tabs](./src/pages/WithTabs/WithTabs.tsx)
1. An example of a scene with drill down. See [Scene with drill down](./src/pages/WithDrilldown/WithDrilldown.tsx)

{{> frontend-getting-started packageManagerName=packageManagerName }}

{{> distributing-your-plugin }}
