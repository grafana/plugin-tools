# Snippets

Some pages scaffolded by `create-plugin` contain snippets. A snippet is text that is the same for every
plugin, such as the steps to add a data source in Grafana. Grafana keeps that text up to date, so it stays
right when the Grafana UI changes.

A snippet sits between two markers, each alone on its own line:

```markdown
<!-- snippet:add-data-source -->

To add the My plugin data source:

1. Click **Connections** in the left-side menu.
   ...

<!-- /snippet:add-data-source -->
```

## How a snippet is shown

In the catalog on grafana.com and in the `serve` preview, the text between the markers is replaced with the
snippet's current text. The plugin name and ID in it come from your `plugin.json`.

The text in your page is a fallback. GitHub shows it, and so does the catalog until it knows the snippet.

## Work with snippets

- **Don't edit the text inside a snippet.** The catalog shows the current text instead, so your change
  wouldn't appear there.
- **Delete a snippet that doesn't apply** to your plugin. Delete both markers and the text between them.
- **Make the text your own** by deleting only the two markers. The text then shows as you wrote it, and
  Grafana no longer updates it.
- **Write plugin-specific text before or after a snippet.** Don't continue a snippet's list after its closing
  marker. Start a new paragraph or list instead.
- **You can move a snippet** to another place in the page. Keep each marker alone on its own line, with a
  blank line before it, and outside lists, quotes and collapsible sections. A heading can't go inside a snippet.

Validation checks the markers and tells you when the text in a snippet differs from its current text. For
details, refer to [Validation rules](./validation-rules.md#snippets).

## Available snippets

| Snippet                        | What it covers                                                      | Where it fits                                                                    |
| ------------------------------ | ------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| `add-data-source`              | The steps to add the data source in Grafana                         | "Add the data source" in a data source's `configure.md`                          |
| `import-dashboard`             | The steps to import a bundled dashboard, and how upgrades affect it | "Import a dashboard" in a data source's `dashboards.md`                          |
| `server-debug-logs`            | How to turn on debug logs for the plugin in self-managed Grafana    | "Get more detail about an error" in a backend data source's `troubleshooting.md` |
| `reshape-with-transformations` | How to reshape query data with transformations                      | "Reshape data that doesn't match" in a panel's `data-formats.md`                 |
| `use-example-json`             | How to paste a panel example into a dashboard's JSON model          | The top of a panel's `examples.md`                                               |

## Current text

This is the text each snippet shows. `{{pluginName}}` and `{{pluginId}}` stand for `name` and `id` in your
`plugin.json`. To bring a snippet's fallback up to date, replace the text between its markers with this text
and fill in your plugin's values.

### `add-data-source`

```markdown
To add the {{pluginName}} data source:

1. Click **Connections** in the left-side menu.
1. Click **Add new connection**.
1. Enter `{{pluginName}}` in the search bar.
1. Select **{{pluginName}}**.
1. Click **Add new data source**.
```

### `import-dashboard`

```markdown
To import a dashboard that ships with {{pluginName}}:

1. Click **Connections** > **Data sources** in the left-side menu.
1. Select your {{pluginName}} data source.
1. Click the **Dashboards** tab.
1. Click **Import** next to the dashboard.

Imported dashboards don't update when you upgrade the plugin. When a plugin upgrade ships a newer version of a dashboard, click **Update** next to it. This overwrites any changes you made to it.
```

### `server-debug-logs`

````markdown
In self-managed Grafana, the Grafana server logs show more detail:

1. Set the log level to `debug` in the Grafana configuration file:

   ```ini
   [log]
   level = debug
   ```

1. Restart Grafana and reproduce the error.
1. Look for log lines with `logger=plugin.{{pluginId}}`.
1. Set the log level back to `info` when you're done, to keep the logs small.
````

### `reshape-with-transformations`

```markdown
If a query returns data in a different shape, you can reshape it without changing the query. Select the **Transform data** tab in the panel editor and add a transformation. For more information, refer to [Transform data](https://grafana.com/docs/grafana/latest/panels-visualizations/query-transform-data/transform-data/).
```

### `use-example-json`

```markdown
To use an example, open your dashboard and go to **Dashboard settings** > **JSON Model**. Paste the excerpt into the `panels` array and click **Save changes**.
```
