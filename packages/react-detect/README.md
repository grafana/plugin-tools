# @grafana/react-detect

Detect React 19 breaking changes in Grafana plugins.

## Installation

```bash
npm install -D @grafana/react-detect
```

## Usage

Run from your plugin root directory (where `src/plugin.json` exists):

```bash
# Analyze the built plugin
npx @grafana/react-detect detect

# Analyze a specific directory
npx @grafana/react-detect detect ./dist

# Check a specific pattern
npx @grafana/react-detect detect --pattern defaultProps

# Output as JSON
npx @grafana/react-detect detect --format json

# Output as CSV
npx @grafana/react-detect detect --format csv

# Save results to file
npx @grafana/react-detect detect --output report.json --format json

# Only show high-confidence issues
npx @grafana/react-detect detect --confidence high

# Only show source code issues (exclude dependencies)
npx @grafana/react-detect detect --source-only

# Only show dependency issues
npx @grafana/react-detect detect --deps-only

# Include externalized dependencies (for debugging)
npx @grafana/react-detect detect --include-externals
```

## Options

| Option                 | Description                                 | Default      |
| ---------------------- | ------------------------------------------- | ------------ |
| `[path]`               | Path to dist directory                      | `./dist`     |
| `--pattern <name>`     | Check specific pattern only                 | All patterns |
| `--format <type>`      | Output format: `console`, `json`, `csv`     | `console`    |
| `--confidence <level>` | Minimum confidence: `high`, `medium`, `low` | `medium`     |
| `--source-only`        | Only show plugin source issues              | `false`      |
| `--deps-only`          | Only show dependency issues                 | `false`      |
| `--include-externals`  | Include externalized dependencies           | `false`      |
| `--output <file>`      | Write output to file                        | stdout       |
| `--quiet`              | Minimal output                              | `false`      |

## Breaking Change Patterns

The tool detects these React 19 breaking changes:

### Removed

- `defaultProps` (function components only - class components can still use it)
- `propTypes`
- `createFactory`
- `contextTypes` / `getChildContext` (Legacy Context)
- `ReactDOM.render` / `ReactDOM.hydrate` / `ReactDOM.unmountComponentAtNode`
- `ReactDOM.findDOMNode` / `findDOMNode`
- String refs (`refs[...]`)

### Renamed

- `__SECRET_INTERNALS_DO_NOT_USE_OR_YOU_WILL_BE_FIRED`

### Deprecated

- `forwardRef`
- `Context.Provider`

## How It Works

1. **Scans built bundles** in your `dist/` directory for breaking change patterns
2. **Uses source maps** to trace code back to original source files
3. **Distinguishes between**:
   - Plugin source code (your code)
   - Bundled dependencies (npm packages)
   - External dependencies (provided by Grafana - excluded by default)
4. **Applies confidence scoring** to reduce false positives
5. **Detects component types** (class vs function) for accurate defaultProps reporting

## External Dependencies

The following packages are provided by Grafana and **excluded from analysis** by default:

- `react`, `react-dom`, `react-redux`, `redux`
- `@grafana/runtime`, `@grafana/data`, `@grafana/ui`
- `lodash`, `moment`, `rxjs`, `emotion`, `@emotion/*`
- `jquery`, `d3`, `angular`, `i18next`, `react-router-dom`

Use `--include-externals` to include them in analysis (useful for debugging).

## Exit Codes

- `0` - No issues found in plugin source code (dependencies may have issues)
- `1` - Issues found in plugin source code OR fatal error

## Example Output

```
@grafana/react-detect - React 19 Compatibility Check

Analyzing plugin: my-app-plugin (app) v2.1.0
Scanning dist/ directory...

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✓ No issues found in plugin source code

⚠️  Bundled Dependency Issues (15)

  📦 react-select
     Via: package.json → "react-select": "^5.7.0"

     ✗ defaultProps: 8 occurrences
        node_modules/react-select/dist/Select.js:124
     ⚠ Context.Provider: 2 occurrences
        node_modules/react-select/dist/Select.js:89

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Summary:
  Total issues: 15
  Source issues: 0
  Dependency issues: 15
  Affected dependencies: 1
    react-select
```

## CI/CD Integration

Use JSON output for automated checks:

```bash
#!/bin/bash
npx @grafana/react-detect detect --format json --output react19-report.json

# Check if there are any source issues
if jq -e '.summary.sourceIssuesCount > 0' react19-report.json; then
  echo "❌ React 19 compatibility issues found in source code"
  exit 1
fi

echo "✅ No React 19 compatibility issues in source code"
```

## Requirements

- Node.js >= 20
- Built plugin (run `npm run build` first)
- Source maps must be present in dist/ directory

## License

Apache-2.0
