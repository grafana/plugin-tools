---
id: migrate-angularjs-configuration-settings-to-react
title: Migrate AngularJS Configuration Settings to React
sidebar_position: 4
description: How to migrate AngularJS plugin configuration to React.
keywords:
  - grafana
  - plugins
  - plugin
  - React
  - ReactJS
  - Angular
  - migration
---

# Angular to React: Configuration Migration

## Background

When a panel plugin is converted from Angular to React, the editor customization options are usually found in a new location inside the JSON. A plugin was free to store custom objects anywhere in the configuration, but now must use a designated section.  This destination is used by all of the default components provided by Grafana, and any custom components must use this same location.

When a panel is loading Grafana will call a migration handler before anything is displayed to the user. This allows an old panel configuration to be converted automatically to the new version being loaded. If no migration handler is provided, the user will get all default values for the panel, and will have to manually fix every panel.

## Panel Plugins: Migration Handler

There are two “types” of plugin configuration migrations:

- Angular to React
- Plugin Version Update

When a panel is loaded, and the plugin version specified inside the panel JSON  is different from the current runtime version, the migration handler is called. This handler needs to return a valid object, and must not throw any errors. We highly encourage using the migration handler where upgrading a plugin may cause issues for existing panels, and to provide a better user experience.

## Angular to React

When a panel in a dashboard is using an older AngularJS version of the plugin, but the latest React version is actually running, the old configuration needs to be modified to work with the new plugin as effortlessly as possible.  Ideally the user would not need to reconfigure their panels.

## Deep Dive Into Angular To React Migration

Typically angular plugins will have a panel.config object filled with settings particular to the plugin.

The example  below is taken from the `grafana-polystat-panel` which started as an AngularJS panel and was ported to React.  The React version of the plugin makes use of the `.setMigrationHandler` in `module.ts`` like this:

```TYPESCRIPT
.setMigrationHandler(PolystatPanelMigrationHandler)
```

The Angular-based polystat panel (v1.x) stored most of the configuration in the “panel.polystat” object.

Detecting if this object is present in the migration handler allows you to trigger conversion to the new React-based plugin configuration.

React panels store everything inside panel.options, and if this object doesn’t exist, the migration handler should at least return a valid empty object. If it does exist, just return the current panel.options.  There is an opportunity to modify the React configuration at this stage, in case the newer version has removed or added new features.

Note: panel.options is an interface called PanelModel with a type that is custom to your panel plugin.

## Plugin Upgrade (React)

When a new version of a plugin is installed, the Grafana server will call the migration handler to add or remove configuration items. The changes are not persisted inside the dashboard, and must be "saved" to prevent the migration from having to modify the panels on every load.

For example: The polystat panel had a hardcoded font “Roboto”, which was removed in newer versions of Grafana, which caused the rendered output to be incorrect when running a newer version of Grafana. To address this, a new selector was added to allow the user to choose a font, but the global configuration had no setting for this in previous versions.

This is where the migration handler can detect if the option is not present, and insert a default value, returning a working configuration depending on the version of Grafana being used.

## Detecting the runtime version of Grafana

The variable `config.buildInfo.version` can be accessed by a plugin to determine the running version of Grafana.  The migration handler can use this value to set valid defaults.

It is possible that multiple versions of Grafana have had a backported patch, and as a result removed a feature we were expecting to have, in this case the font `Roboto.`  The migration handler gets the runtime version and uses semver to determine which font should be used.  Older versions do not have `Inter` as a font, and `Roboto` is safest to load.  For newer releases `Roboto` has been removed, and `Inter` should be loaded.

There are two cases here:

- Case 1: A user is running a current Grafana (9.4.3) and has a panel with `Roboto` selected. The plugin can offer different Select options based on the runtime.

The polystat panel has in its `module.ts` a conditional check depending on the runtime:

```TYPESCRIPT
// font selection
     .addSelect({
       path: 'globalTextFontFamily',
       name: 'Font Family',
       description: 'Font used for rendered text',
       category: ['Text'],
       defaultValue: GLOBAL_TEXT_FONT_FAMILY,
       settings: {
         options: FontFamilyOptions,
       },
       showIf: () => hasRobotoFont() === false,
     })
     .addSelect({
       path: 'globalTextFontFamily',
       name: 'Font Family',
       description: 'Font used for rendered text',
       category: ['Text'],
       defaultValue: GLOBAL_TEXT_FONT_FAMILY_LEGACY,
       settings: {
         options: FontFamilyOptionsLegacy,
       },
       showIf: () => hasRobotoFont() === true,
     })
```

- Case 2: The user upgrades Grafana (from v9.3.10 to v9.4.3), and the migration automatically switches to using “Inter”, and does not display “Roboto” in the font selector. If the upgrade is 9.4.0 or greater, `Inter` is used, otherwise `Roboto` is used.

The MigrationHandler in polystat contains this as part of the code:

```TYPESCRIPT
import { config } from "@grafana/runtime";
import { satisfies, coerce } from "semver";
export const hasRobotoFont = () => {
 const version = coerce(config.buildInfo.version);
 if (version !== null) {
   if (satisfies(version, "<9.4.0")) {
     return true;
   }
 }
 return false;
```

## Detecting missing configuration

A new version of a plugin could add new configuration options that the panel does not have defined.  The migration handler can be used to add the new options with "safe" default values.

## Detecting invalid configuration

Since the plugin is loading and receives the entire configuration, it is possible to iterate through the configuration and ensure the values are legitimate.

## Setting a safe default

Sometimes a plugin will remove a feature, or modify the valid selections for an option.  The migration handler can be used to adjust the configuration as needed.
