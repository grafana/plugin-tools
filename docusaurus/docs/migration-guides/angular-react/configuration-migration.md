---
id: migrate-angularjs-configuration-settings-to-react
title: Migrate configuration settings
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
  - migrate
---

# Migrate configuration settings

This guide explores how to convert configuration settings when upgrading your Grafana plugin from from AngularJS or Angular, which are deprecated, to our current method for building plugins, React. As we discuss a variety of issues that may arise in this process, you will see how the Grafana migration handling tool makes the conversion easier.

## Migration handlers

### Background

There are two types of plugin configuration migrations for panel plugins:

- AngularJS to React
- Plugin version update

When you load a panel for which the plugin version specified in the panel's JSON is different from the current runtime version, the migration handler is called. This handler needs to return a valid object which must not throw any errors.

We strongly encourage you to use the migration handler whenever upgrading a plugin may cause issues for existing panels. By using the migration handler, you will provide a better user experience.

### Use the designated section

When you convert a panel plugin from AngularJS to React, there is a specific location for the editor customization options in JSON. Previously, with Angular plugins, the plugin could store custom objects anywhere in the configuration, but now these objects must use a designated section.

Grafana uses the same designated section by default for all its components. Any custom components you add must use this same location.

When it loads a panel, Grafana calls a migration handler before it displays anything to the user. This call allows an old panel configuration to be converted automatically to the new version that is loading. If you don't provide a migration handler, then the user gets all the panel's default values and they must manually fix every panel.

## Deep dive into Angular-to-React migration

Modifications are needed when a panel in a dashboard is using an older AngularJS version of the plugin, but the latest React version is actually running. In this case, modify the old configuration to work with the new plugin as effortlessly as possible. Ideally, the user should not need to reconfigure their panels.

### Introducing the Polystat example

Angular plugins usually have a `panel.config` object which contains settings particular to the plugin. For example, the Polystat panel plugin, known as `grafana-polystat-panel`, is a sample plugin which started as an AngularJS panel and was ported to React. The React version of the plugin makes use of the `.setMigrationHandler` in `module.ts`` like this:

```TYPESCRIPT
.setMigrationHandler(PolystatPanelMigrationHandler)
```

The Angular-based Polystat panel (v1.x) stored most of the configuration in the “panel.polystat” object. Your plugin should detect if this object is present in the migration handler so you can trigger conversion to the new React-based plugin configuration.

React panels store everything inside `panel.options`. If this object doesn’t exist, then the migration handler should at least return a valid empty object. If this object exists, then it should just return the current `panel.options`. There is an opportunity to modify the React configuration at this stage, in case the newer version has removed or added new features.

:::note

The `panel.options` is an interface called `PanelModel` with a type that is custom to your panel plugin.

:::

### Changing font in the Polystat example

When a new version of a plugin is installed, the Grafana server calls the migration handler to add or remove configuration items. The changes are not persisted inside the dashboard, and so you must "save" them must to prevent the migration from having to modify the panels on every load.

For example: When it was written in AngularJS, the Polystat plugin had a hardcoded font, Roboto, which was removed in newer versions of Grafana. This caused output to be rendered incorrectly when the plugin was run in a newer version of Grafana. To address this issue, Grafana added a new selector to allow the user to choose a font, but the global configuration had no setting for this in previous versions.

In this case, the migration handler should detect if the option is not present and then insert a default value. That default value returns a working configuration depending on the version of Grafana being used.

### Step 1: Detect the runtime version of Grafana

Your plugin can access the variable `config.buildInfo.version` to determine the running version of Grafana. The migration handler can use this value to set valid defaults.

It is possible that multiple versions of Grafana have had a backported patch, and as a result they may have removed a feature that your plugin expected. In the case of the previous example, it is the Roboto font.

The migration handler gets the runtime version and uses semver to determine which font to use. Older versions do not have the newer Inter as a font, and so Roboto is safest to load. Newer releases have removed Roboto, and so the plugin should load Inter instead.

There are two cases here:

#### Case 1: User runs panel with Roboto selected

In this case, a user is running a current Grafana (9.4.3) and has a panel with Roboto selected. The plugin can offer different Select options based on the runtime.

The Polystat panel has in its `module.ts` a conditional check depending on the runtime:

```TYPESCRIPT
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

#### Case 2: Grafana automatically switches the font to Inter

In this case, the user upgrades Grafana (from v9.3.10 to v9.4.3), and the migration automatically switches to using Inter, and does not display Roboto in the font selector. If the upgrade is 9.4.0 or greater, Inter is used; otherwise, Roboto is used.

The `MigrationHandler` in Polystat contains this code:

```TYPESCRIPT
import { config } from "@grafana/runtime";
import { satisfies, coerce } from "semver";

export const PolystatPanelMigrationHandler = (panel: PanelModel<PolystatOptions>): Partial<PolystatOptions> => {
  // set default font to inter, and check if it available, set to roboto if not
  options.globalTooltipsFontFamily = FontFamilies.INTER;
    if (hasRobotoFont()) {
      options.globalTooltipsFontFamily = FontFamilies.ROBOTO;
    }
}

export const hasRobotoFont = () => {
  const version = coerce(config.buildInfo.version);
  if (version !== null) {
    if (satisfies(version, "<9.4.0")) {
      return true;
    }
  }
  return false;
};
```

### Step 2: Detect missing configuration

A new version of a plugin could add new configuration options that the panel does not have defined. The migration handler can be used to add the new options with "safe" default values.

```TYPESCRIPT
options.globalTooltipsFontFamily = FontFamilies.INTER;
  if (hasRobotoFont()) {
    options.globalTooltipsFontFamily = FontFamilies.ROBOTO;
  }

export const PolystatPanelMigrationHandler = (panel: PanelModel<PolystatOptions>): Partial<PolystatOptions> => {
  if (panel.options.NewFeature === undefined) {
    // add default for new feature
    panel.options.NewFeature = 5.0;
  }
  ...
  return panel.options;
}
```

### Step 3: Detect invalid configuration

Since the plugin is loading and receives the entire configuration, it is possible to iterate through the configuration and ensure the values are legitimate.

```TYPESCRIPT
export const PolystatPanelMigrationHandler = (panel: PanelModel<PolystatOptions>): Partial<PolystatOptions> => {
  // iterate and validate

  let validConfigOptions = {
    fontSize: 2,
    fontFamily: 3,
    defaultInvalid: 'a'
  };

  for (const anOption in panel.options) {
    if (!validConfigOptions.includes(anOption)) {
      // remove this option
      console.log(`removing ${anOption}`);
      delete panel.options.anOption;
    }
  }

  return panel.options;
}
```

### Step 4: Set a safe default

Sometimes a plugin will remove a feature or modify the valid selections for an option. The migration handler can be used to adjust the configuration as needed.

```TYPESCRIPT
export const PolystatPanelMigrationHandler = (panel: PanelModel<PolystatOptions>): Partial<PolystatOptions> => {
  const featureOptions = [
    'SelectionA',
    'SelectionB',
    'SelectionC'
  ];

  // detect if a config setting is using a value that has been removed,
  //  and set a safe default
  const removedOption = 'a removed option in selector';
  if (!featureOptions.includes(panel.options.aSelectionSetting) {
    panel.options.aSelectionSetting = featureOptions[0];
  }
  // new feature added, set a safe default for it
  if (panel.options.aSelectionSetting === undefined) {
    // add default for new feature
    panel.options.aSelectionSetting = featureOptions[0];
  }

  return panel.options;
}
```
