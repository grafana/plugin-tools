# I18n Addition

Adds internationalization (i18n) support to a Grafana plugin.

## Usage

```bash
npx @grafana/create-plugin add i18n --locales <locales>
```

## Requirements

- **Grafana >= 11.0.0**: i18n is not supported for Grafana versions prior to 11.0.0. If your plugin's `grafanaDependency` is set to a version < 11.0.0, the script will automatically update it to `>=11.0.0`.
- **React >= 18**: The `@grafana/i18n` package requires React 18 or higher. If your plugin uses React < 18, the script will exit with an error and prompt you to upgrade.

## Required Flags

### `--locales`

A comma-separated list of locale codes to support in your plugin.

**Format:** Locale codes must follow the `xx-XX` pattern (e.g., `en-US`, `es-ES`, `sv-SE`)

**Example:**

```bash
npx @grafana/create-plugin add i18n --locales en-US,es-ES,sv-SE
```

## What This Addition Does

**Important:** This script sets up the infrastructure and configuration needed for translations. After running this script, you'll need to:

1. Mark up your code with translation functions (`t()` and `<Trans>`)
2. Run `npm run i18n-extract` to extract translatable strings
3. Fill in the locale JSON files with translated strings

This addition configures your plugin for internationalization by:

1. **Updating `docker-compose.yaml`** - Adds the `localizationForPlugins` feature toggle to your local Grafana instance
2. **Updating `src/plugin.json`** - Adds the `languages` array and updates `grafanaDependency`
3. **Creating locale files** - Creates empty JSON files for each locale at `src/locales/{locale}/{pluginId}.json`
4. **Adding dependencies** - Installs `@grafana/i18n` and optionally `semver` (for backward compatibility)
5. **Updating ESLint config** - Adds i18n linting rules to catch untranslated strings
6. **Initializing i18n in module.ts** - Adds `initPluginTranslations()` call to your plugin's entry point
7. **Creating support files**:
   - `i18next.config.ts` - Configuration for extracting translations
   - `src/loadResources.ts` - (Only for Grafana < 12.1.0) Custom resource loader
8. **Adding npm scripts** - Adds `i18n-extract` script to extract translations from your code

## Backward Compatibility

**Note:** i18n is not supported for Grafana versions prior to 11.0.0.

The addition automatically detects your plugin's `grafanaDependency` version:

### Grafana >= 12.1.0

- Sets `grafanaDependency` to `>=12.1.0`
- Grafana handles loading translations automatically
- Simple initialization: `await initPluginTranslations(pluginJson.id)`
- No `loadResources.ts` file needed
- No `semver` dependency needed

### Grafana 11.0.0 - 12.0.x

- Keeps or sets `grafanaDependency` to `>=11.0.0`
- Plugin handles loading translations
- Creates `src/loadResources.ts` for custom resource loading
- Adds runtime version check using `semver`
- Initialization with loaders: `await initPluginTranslations(pluginJson.id, loaders)`

## Running Multiple Times

This addition is **defensive** and can be run multiple times safely. Each operation checks if it's already been done:

### Adding New Locales

You can run the command again with additional locales to add them:

```bash
# First run
npx @grafana/create-plugin add i18n --locales en-US

# Later, add more locales
npx @grafana/create-plugin add i18n --locales en-US,es-ES,sv-SE
```

The addition will:

- ✅ Merge new locales into `plugin.json` without duplicates
- ✅ Create only the new locale files (won't overwrite existing ones)
- ✅ Skip updating files that already have i18n configured

## Files Created

```
your-plugin/
├── docker-compose.yaml              # Modified: adds localizationForPlugins toggle
├── src/
│   ├── plugin.json                  # Modified: adds languages array
│   ├── module.ts                    # Modified: adds i18n initialization
│   ├── loadResources.ts            # Created: (Grafana 11.x only) resource loader
│   └── locales/
│       ├── en-US/
│       │   └── your-plugin-id.json # Created: empty translation file
│       ├── es-ES/
│       │   └── your-plugin-id.json # Created: empty translation file
│       └── sv-SE/
│           └── your-plugin-id.json # Created: empty translation file
├── i18next.config.ts                # Created: extraction config
├── eslint.config.mjs                # Modified: adds i18n linting rules
└── package.json                     # Modified: adds dependencies and scripts
```

## Dependencies Added

**Always:**

- `@grafana/i18n` (v12.2.2) - i18n utilities and types
- `i18next-cli` (dev) - Translation extraction tool

**For Grafana 11.x only:**

- `semver` - Runtime version checking
- `@types/semver` (dev) - TypeScript types for semver

## Next Steps

After running this addition:

1. **Use in code**: Import and use the translation functions to mark up your code:

   ```typescript
   import { t, Trans } from '@grafana/i18n';

   // Use t() for simple strings
   const title = t('components.myComponent.title', 'Default Title');

   // Use Trans for JSX
   <Trans i18nKey="components.myComponent.description">
     This is a description
   </Trans>
   ```

2. **Extract translations**: Run `npm run i18n-extract` to scan your code for translatable strings
3. **Add translations**: Fill in your locale JSON files with translated strings

## Debug Output

Enable debug logging to see what the addition is doing:

```bash
DEBUG=create-plugin:additions npx @grafana/create-plugin add i18n --locales en-US,es-ES
```

## References

- [Grafana i18n Documentation](https://grafana.com/developers/plugin-tools/how-to-guides/plugin-internationalization)
- [Grafana 11.x i18n Documentation](https://grafana.com/developers/plugin-tools/how-to-guides/plugin-internationalization-grafana-11)
- [Available Languages](https://github.com/grafana/grafana/blob/main/packages/grafana-i18n/src/constants.ts)
