---
id: migration-handler-for-panels
title: Add a migration handler to your panel plugin
description: How to add a migration handler to your Grafana panel plugin for seamless updates.
keywords:
  - grafana
  - plugins
  - plugin
  - panel
  - migration
  - migration handler
  - version update
---

# Add a migration handler to your panel plugin

As you develop and maintain your Grafana panel plugin, you may need to make changes to the panel options structure. These changes can potentially break existing dashboard configurations.

When you introduce breaking changes to your plugin, you should increase the major number of your plugin version (e.g. from 1.2.1 to 2.0.0). We encourage you to try to minimize the breaking changes in your plugins in-between versions as much as possible, but in the cases they are necssary and to ensure a smooth transition for users when they update your plugin, you can implement a migration handler.

## Migration handler basics

A migration handler is a function that runs when the dashboard's stored panel version differs from the current installed panel version. It allows you to update the panel's options to match the new structure without requiring manual intervention from the user.

To add a migration handler to your panel plugin, use the `setMigrationHandler` method on the `PanelPlugin` object:

```ts title="module.ts"
import { PanelPlugin } from '@grafana/data';
import { SimplePanel } from './components/SimplePanel';
import { SimpleOptions } from './types';
import { migrationHandler } from './migrationHandler';

export const plugin = new PanelPlugin<SimpleOptions>(SimplePanel)
  .setPanelOptions((builder) => {
    // ... panel options configuration
  })
  // define the migration handler
  .setMigrationHandler(migrationHandler);
```

:::note

The migration handler is only called when the installed plugin version differs from the version used to generate a panel. Changes made to the panel are not automatically persisted, users need to manually save the dashboard after a panel is migrated.
:::

## Implement a migration handler

The migration handler function receives the entire panel model as an argument and should return the updated panel options. Here's a basic structure:

```ts title="migrationHandler.ts"
import { PanelModel } from '@grafana/data';
import { SimpleOptions } from './types';

function migrationHandler(panel: PanelModel<Partial<SimpleOptions>>) {
  // panel.options contains the current panel options stored in the dashboard
  const options = Object.assign({}, panel.options);

  // Perform option migrations here

  return options;
}
```

## Common migration scenarios

### Handling new options

When adding new panel configuration options, set default values for them:

```ts
if (options.newFeature === undefined) {
  panel.options.newFeature = 'defaultValue';
}
```

### Renaming options

If you've renamed an option, transfer the value from the old option to the new one:

```ts
if (panel.options.oldOptionName) {
  panel.options.newOptionName = panel.options.oldOptionName;
  // make sure to remove the old option
  delete panel.options.oldOptionName;
}
```

### Adjusting for changed options

When removing valid options or changing valid selections, set safe defaults:

```ts
const validOptions = ['option1', 'option2', 'option3'];
if (!validOptions.includes(panel.options.someOption)) {
  panel.options.someOption = validOptions[0];
}
```

Or migrate the existing value to the new option:

```ts
// e.g. the options of displayType were renamed
// from bar, line, pie to barChart, linePlot and pieChart
if (options.displayType) {
  switch (options.displayType) {
    case 'bar':
      options.displayType = 'barChart';
      break;
    case 'line':
      options.displayType = 'linePlot';
      break;
    case 'pie':
      options.displayType = 'pieChart';
      break;
  }
}
```

### Version-specific adjustments

You might want to base migration decissions based on the version that was used to write a panel. For this, you can use the `pluginVersion` property. This property is empty the first time the migration handler is ever used but after that it will be set to the plugin version used to save the panel.

For example, imagine the following history for a plugin:

 - In v1, the plugin didn't have any migration code.
 - In v2, the plugin introduced the first migration code.
 - In v3, the plugin changed again with new migration steps.
 
In that scenario, the migration handler would look like this:

```ts title="migrationHandler.ts"
function migrationHandler(panel: PanelModel<SimpleOptions>) {
  const options = Object.assign({}, panel.options);
  const pluginVersion = panel?.pluginVersion ?? '';

  if (pluginVersion === '') {
    // Plugin version was v1.x
    // Needs logic to migrate v1 -> v3
    options.displayMode = 'compact';
    options.displayType = 'linePlot';
  }
  
  if (pluginVersion.startsWith('2.') {
    // Panel was last saved with version v2.x
    // Needs logic to migrate v2 -> v3
    options.displayMode = 'compact';
  }

  return options;
}
```

#### Using string comparison

```ts title="migrationHandler.ts"
import { config } from '@grafana/runtime';

function migrationHandler(panel: PanelModel<SimpleOptions>) {
  const options = Object.assign({}, panel.options);

  // pluginVersion will be empty
  // if the plugin didn't implement a migration handler before
  // or contain the version of the plugin when the panel was last saved after a migration handler was called.
  const pluginVersion = panel?.pluginVersion ?? '';

  if (pluginVersion === '' || pluginVersion.startsWith('1.')) {
    options.displayMode = 'compact';
  }

  return options;
}
```

## Best practices

1. Always create a copy of the options object to avoid modifying the original.
2. Use type checking to ensure you're only migrating options that exist.
3. Handle all possible scenarios to avoid breaking dashboards with unexpected configurations.
4. Test your migration handler thoroughly with various panel configurations.
5. Document the changes in your plugin's changelog to help users understand what's been updated.

Remember, the migration handler runs on every panel load until the user manually edits and saves the panel. Make sure your migrations are idempotent and don't cause unintended side effects if run multiple times.
