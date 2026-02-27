# Bundle Grafana UI Addition

Configures a Grafana plugin to bundle `@grafana/ui` instead of using the version of `@grafana/ui` provided by the Grafana runtime environment.

## Usage

```bash
npx @grafana/create-plugin add bundle-grafana-ui
```

## Requirements

- **Grafana >= 10.2.0**: Bundling `@grafana/ui` is only supported from Grafana 10.2.0 onwards. If your plugin's `grafanaDependency` is set to a version lower than 10.2.0, the script will automatically update it to `>=10.2.0` and display a warning message.

## What This Addition Does

By default, Grafana plugins use `@grafana/ui` as an external dependency provided by Grafana at runtime. This addition modifies your plugin's bundler configuration to include `@grafana/ui` in your plugin bundle instead.

This addition:

1. **Updates `src/plugin.json`** - Ensures `grafanaDependency` is set to `>=10.2.0` or higher
2. **Removes `/^@grafana\/ui/i` from externals** - This tells the bundler to include `@grafana/ui` in your plugin bundle rather than expecting Grafana to provide it
3. **Adds `'react-inlinesvg'` to externals** - Since `@grafana/ui` uses `react-inlinesvg` internally and Grafana provides it at runtime, we add it to externals to avoid bundling it twice
4. **Updates bundler resolve configuration** - Adds `.mjs` to `resolve.extensions` and sets `resolve.fullySpecified: false` to handle ESM imports from `@grafana/ui` and its dependencies (e.g., `rc-picker`, `ol/format/WKT`)

## When to Use This

Consider bundling `@grafana/ui` when:

- You want to ensure consistent behavior across different Grafana versions
- You're experiencing compatibility issues with the Grafana-provided `@grafana/ui`

## Trade-offs

**Pros:**

- Full control over the `@grafana/ui` version your plugin uses
- Consistent behavior regardless of Grafana version

**Cons:**

- Larger plugin bundle size
- Potential visual inconsistencies if your bundled version differs significantly from Grafana's version
- You'll need to manually update `@grafana/ui` in your plugin dependencies

## Files Modified

```
your-plugin/
├── src/
│   └── plugin.json             # Modified: grafanaDependency updated if needed
├── .config/
│   ├── bundler/
│   │   └── externals.ts        # Modified: removes @grafana/ui, adds react-inlinesvg
│   └── rspack/
│       └── rspack.config.ts     # Modified: resolve.extensions and resolve.fullySpecified updated
```

Or for legacy structure:

```
your-plugin/
├── src/
│   └── plugin.json             # Modified: grafanaDependency updated if needed
├── .config/
│   └── webpack/
│       └── webpack.config.ts   # Modified: externals array and resolve configuration updated
```
