---
id: targeting-older-releases
title: Targeting older releases
sidebar_position: 8
description: How to target older releases for a plugin.
keywords:
  - grafana
  - plugins
  - plugin
  - React
  - ReactJS
  - Angular
  - migration
  - targeting
---

# Angular to React: Targeting older releases

Angular plugins typically have a large installation base and users that are running older releases of Grafana.

This doc gives general guidance on how to target older (even non-supported) releases, allowing users to migrate to newer versions of Grafana as needed.

The most reliable minimum version is `8.4.11`, and `9.3.16`, depend on how much of the UI components are being used.

When using the `create-plugin` utility, either updating and existing plugin or migrating, the package list will typically have the most recent release of Grafana. To offer the plugin to older versions of Grafana, just set the `dependencies` and `devDependencies` to match the older version.

## Targeting v8.4

The polystat panel is able to target v8.4.11 since it uses very few UI components. It also uses the latest plugin-e2e package, and the most current plugin-tools configuration.

```json
"dependencies": {
    "@grafana/data": "8.4.11",
    "@grafana/runtime": "8.4.11",
    "@grafana/schema": "10.3.3",
    "@grafana/ui": "8.4.11",
    "react": "17.0.2",
    "react-dom": "17.0.2",
    "react-redux": "7.2.6",
    ...
}
```

Update the `src/plugin.json` file to correspond to the same version:

```json
    "dependencies": {
        "grafanaVersion": "8.4.x",
        "grafanaDependency": ">=8.4.11"
    }
```

## Targeting v9.3

The D3 Gauge panel has to target at minimum v9.3.16 due to data conversions that are not available in previous versions. It also uses the latest plugin-tools configuration with git workflows and webpack setup.

```json
"dependencies": {
    "@grafana/data": "9.3.16",
    "@grafana/runtime": "9.3.16",
    "@grafana/ui": "9.3.16",
    "react": "17.0.2",
    "react-dom": "17.0.2",
    ...
}
```

Update the `src/plugin.json` file to correspond to the same version:

```json
    "dependencies": {
        "grafanaVersion": "9.3.x",
        "grafanaDependency": ">=9.3.16"
    }
```

## Special Notes

Be certain to test the plugin with all releases in between the minimum version and the current release to ensure no crashes occur.

## Additional Resource

These panels target older Grafana releases and function correctly with the latest release.

[Polystat Panel](https://github.com/grafana/grafana-polystat-panel/blob/main/package.json)

[D3 Gauge Panel](https://github.com/briangann/grafana-gauge-panel/blob/main/package.json)
