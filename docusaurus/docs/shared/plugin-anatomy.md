Every plugin you create requires at least two files: `plugin.json` and `src/module.ts`.

### `plugin.json`

When Grafana starts, it scans the [plugin directory](https://grafana.com/docs/grafana/latest/setup-grafana/configure-grafana/#plugins) for any subdirectory that contains a `plugin.json` file. The `plugin.json` file contains information about your plugin and tells Grafana about what capabilities and dependencies your plugin needs.

While certain plugin types can have specific configuration options, let's look at the mandatory ones:

- `type` tells Grafana what type of plugin to expect. Grafana supports three types of plugins: `panel`, `datasource`, and `app`.
- `name` is what users will see in the list of plugins. If you're creating a data source, this is typically the name of the database it connects to, such as Prometheus, PostgreSQL, or Stackdriver.
- `id` uniquely identifies your plugin and should follow this naming convention: `<$organization-name>-<$plugin-name>-<$plugin-type>`. The create-plugin tool correctly configures this based on your responses to its prompts.

To see all the available configuration settings for the `plugin.json`, refer to the [plugin.json Schema](../metadata.md).

### `module.ts`

After discovering your plugin, Grafana loads the `module.js` file, the entrypoint for your plugin. `module.js` exposes the implementation of your plugin, which depends on the type of plugin you're building.

Specifically, `src/module.ts` needs to export a class that extends [GrafanaPlugin](https://github.com/grafana/grafana/blob/f900098cc9f5771c02b6189ba5138547b4f5e6c2/packages/grafana-data/src/types/plugin.ts#L175), and can be any of the following:

- [PanelPlugin](https://github.com/grafana/grafana/blob/f900098cc9f5771c02b6189ba5138547b4f5e6c2/packages/grafana-data/src/panel/PanelPlugin.ts#L95)
- [DataSourcePlugin](https://github.com/grafana/grafana/blob/f900098cc9f5771c02b6189ba5138547b4f5e6c2/packages/grafana-data/src/types/datasource.ts#L33)
- [AppPlugin](https://github.com/grafana/grafana/blob/f900098cc9f5771c02b6189ba5138547b4f5e6c2/packages/grafana-data/src/types/app.ts#L58)
