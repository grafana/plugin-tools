/**
 * Values from the plugin's `plugin.json` that snippets can show. Each one fills the placeholder of
 * the same name, such as `{{pluginName}}`.
 */
export interface SnippetValues {
  /** `name` from `plugin.json`. */
  pluginName: string;
  /** `id` from `plugin.json`. */
  pluginId: string;
}

/**
 * Shared text that the parser swaps in for the fallback between `<!-- snippet:<name> -->` and
 * `<!-- /snippet:<name> -->`. Names are never renamed or removed, because published docs use them.
 */
const SNIPPETS = {
  'add-data-source': `To add the {{pluginName}} data source:

1. Click **Connections** in the left-side menu.
1. Click **Add new connection**.
1. Enter \`{{pluginName}}\` in the search bar.
1. Select **{{pluginName}}**.
1. Click **Add new data source**.`,

  'import-dashboard': `To import a dashboard that ships with {{pluginName}}:

1. Click **Connections** > **Data sources** in the left-side menu.
1. Select your {{pluginName}} data source.
1. Click the **Dashboards** tab.
1. Click **Import** next to the dashboard.

Imported dashboards don't update when you upgrade the plugin. When a plugin upgrade ships a newer version of a dashboard, click **Update** next to it. This overwrites any changes you made to it.`,

  'server-debug-logs': `In self-managed Grafana, the Grafana server logs show more detail:

1. Set the log level to \`debug\` in the Grafana configuration file:

   \`\`\`ini
   [log]
   level = debug
   \`\`\`

1. Restart Grafana and reproduce the error.
1. Look for log lines with \`logger=plugin.{{pluginId}}\`.
1. Set the log level back to \`info\` when you're done, to keep the logs small.`,

  'reshape-with-transformations': `If a query returns data in a different shape, you can reshape it without changing the query. Select the **Transform data** tab in the panel editor and add a transformation. For more information, refer to [Transform data](https://grafana.com/docs/grafana/latest/panels-visualizations/query-transform-data/transform-data/).`,

  'use-example-json': `To use an example, open your dashboard and go to **Dashboard settings** > **JSON Model**. Paste the excerpt into the \`panels\` array and click **Save changes**.`,

  'enable-app': `To enable {{pluginName}}:

1. Click **Administration** > **Plugins and data** > **Plugins** in the left-side menu.
1. Enter \`{{pluginName}}\` in the search bar.
1. Select **{{pluginName}}**.
1. Click **Enable**.`,

  'open-app-config': `To open the {{pluginName}} configuration page:

1. Click **Administration** > **Plugins and data** > **Plugins** in the left-side menu.
1. Enter \`{{pluginName}}\` in the search bar.
1. Select **{{pluginName}}**.`,

  'import-app-dashboard': `To import a dashboard that ships with {{pluginName}}:

1. Click **Administration** > **Plugins and data** > **Plugins** in the left-side menu.
1. Enter \`{{pluginName}}\` in the search bar.
1. Select **{{pluginName}}**.
1. Click the **Dashboards** tab.
1. Click **Import** next to the dashboard.

Imported dashboards don't update when you upgrade the plugin. When a plugin upgrade ships a newer version of a dashboard, click **Update** next to it. This overwrites any changes you made to it.`,
} as const satisfies Record<string, string>;

export type SnippetName = keyof typeof SNIPPETS;

export const SNIPPET_NAMES = Object.keys(SNIPPETS) as readonly SnippetName[];

const PLACEHOLDER_RE = /\{\{(\w+)\}\}/g;

const MARKER_RE = /^<!--\s*(\/?)snippet:(\S+?)\s*-->$/;

function isSnippetName(name: string): name is SnippetName {
  return Object.hasOwn(SNIPPETS, name);
}

/**
 * Reads a snippet marker, such as `<!-- snippet:import-dashboard -->` or its closing
 * `<!-- /snippet:import-dashboard -->`. Returns undefined when the text is anything else.
 */
export function parseSnippetMarker(text: string): { name: string; isClosing: boolean } | undefined {
  const match = MARKER_RE.exec(text.trim());
  return match ? { name: match[2], isClosing: match[1] === '/' } : undefined;
}

/**
 * Replaces each `{{placeholder}}` in the text with its value. Returns undefined when a value is
 * missing or empty.
 */
export function fillSnippetPlaceholders(text: string, values?: SnippetValues): string | undefined {
  const known: Partial<Record<string, string>> = { ...values };
  let isMissingValue = false;
  const filled = text.replace(PLACEHOLDER_RE, (_match, placeholder: string) => {
    const value = Object.hasOwn(known, placeholder) ? known[placeholder] : undefined;
    if (!value) {
      isMissingValue = true;
      return '';
    }
    return value;
  });
  return isMissingValue ? undefined : filled;
}

/**
 * The markdown of a snippet with its `{{placeholder}}` markers left in. Returns undefined for an
 * unknown name.
 */
export function getSnippetSource(name: string): string | undefined {
  return isSnippetName(name) ? SNIPPETS[name] : undefined;
}

/**
 * The current markdown of a snippet with the values filled in, as `create-plugin` scaffolds it.
 * Returns undefined for an unknown name, or when the snippet needs a value that is missing.
 */
export function renderSnippet(name: string, values?: SnippetValues): string | undefined {
  const source = getSnippetSource(name);
  return source === undefined ? undefined : fillSnippetPlaceholders(source, values);
}
