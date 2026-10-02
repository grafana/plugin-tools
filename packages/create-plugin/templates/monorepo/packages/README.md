# Shared packages

Put code that several plugins use in a workspace package in this directory, for example `packages/shared-utils`.

Plugins can't import code from each other directly. Each plugin is bundled, signed and shipped on its own, so the `@grafana/plugins/no-cross-plugin-imports` ESLint rule reports an error if a plugin reaches into another plugin, or outside its own directory by relative path. Shared code goes through a workspace package instead:

1. Create the package, for example `packages/shared-utils/package.json`:

   ```json
   {
     "name": "@myorg/shared-utils",
     "version": "1.0.0",
     "private": true,
     "main": "./dist/index.js",
     "types": "./dist/index.d.ts",
     "scripts": {
       "build": "tsc -p tsconfig.json"
     }
   }
   ```

2. Build it to JavaScript with type declarations. Plugins type check only their own `src` directory, so they need the built `.d.ts` files rather than the package's TypeScript source.
3. Add it as a dependency of each plugin that uses it, then install from the repository root:
   - npm: `"@myorg/shared-utils": "1.0.0"`
   - pnpm and yarn: `"@myorg/shared-utils": "workspace:*"`
4. Import it by name, for example `import { formatValue } from '@myorg/shared-utils';`.

Packages in this directory are not plugins, so create-plugin doesn't update them.
