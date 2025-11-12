# Contributing to Grafana / Create Plugin

We are always grateful to receive contribution!<br />
The following guidelines help you on how to start with the codebase and how to submit your work.

## Installation

### Prerequisites

You need to have `npm` installed.

### Installing

```bash
git clone git@github.com:grafana/plugin-tools.git
cd plugin-tools
npm install
```

## Overview

### Technologies

- [**`minimist`**](https://www.npmjs.com/package/minimist) - for parsing cmd line args
- [**`enquirer`**](https://www.npmjs.com/package/enquirer) - for prompting users for information
- [**`handlebars`**](https://www.npmjs.com/package/handlebars) - for file templates

### Folder structure

`@grafana/create-plugin` consists of the following folder structure:

```js
├── src // Executable code
│   ├── bin // the entrypoint file
│   ├── commands // Code that runs commands
│   ├── utils // Utilities used by commands
│   └── migrations // Migrations for updating create-plugins
└── templates // Handlebars templates
    ├── _partials // Composable parts of a template
    ├── app // Templates specific to scaffolding an app plugin
    ├── backend // Templates specific to scaffolding plugin backend code
    ├── common // Common templates used by all plugin types (e.g. tooling config files)
    ├── datasource // Templates specific to scaffolding a datasource plugin
    ├── github // Templates for github workflows
    └── panel // Templates specific to scaffolding a panel plugin
```

## Development

There are a collection of [commands](#commands) to assist with developing `create-plugin`. Please read the main [contributing guide](../../CONTRIBUTING.md) before contributing any code changes to the project.

Development requires linking this application so you can run it in your terminal to see what effect your changes have.

```shell
npm run build -w @grafana/create-plugin
npm link -w @grafana/create-plugin
```

Run the following commands to confirm the above worked successfully:

```shell
which create-plugin
# /Users/jackwestbrook/.nvm/versions/node/v22.13.0/bin/create-plugin
npx create-plugin version
# 5.18.0
```

You should now be able to run `npx create-plugin` or `npx create-plugin update` to test out changes locally.

If you see `create-plugin not found` try running `npm unlink -g @grafana/create-plugin` then run the build and link commands again.

### Commands

Below are the main commands used for developing `create-plugin`. They can be run using either `npx nx run`, `npm run` or navigating to `packages/create-plugin` and running the command directly.

#### Build

Creates a production build of @grafana/create-plugin.

```shell
npm run build -w @grafana/create-plugin
# or with nx caching
npx nx run @grafana/create-plugin:build
# or from with packages/create-plugin directory
npm run build
```

#### Develop

Creates a development build of @grafana/create-plugin and watches for changes to files and rebuilds automatically.

```shell
npm run dev -w @grafana/create-plugin
# or with nx
npx nx run @grafana/create-plugin:dev
# or from with packages/create-plugin directory
npm run dev
```

### Conventions

_Work in progress._

### Developing the templates

The templates are used by Handlebars to scaffold Grafana plugins. Whilst they appear to be the intended filetype they are infact treated as markdown by Handlebars when it runs. As such we need to be mindful of syntax and to [escape particular characters](https://handlebarsjs.com/guide/expressions.html#whitespace-control) where necessary. The [github/ci.yml](./templates/github/ci/.github/workflows/ci.yml) file is a good example of this.

Note that certain files are intentionally named differently (e.g. npmrc, package.json). This is done due to other tooling preventing the files from being packaged for NPM or breaking other tools during local development.

### Migrations

> **Note:** Migrations are currently behind the `--experimental-updates` flag and are not enabled by default.

Migrations are scripts that update a particular aspect of a project created with create-plugin. When users run `@grafana/create-plugin@latest update`, the command compares their project's version against the running package version and executes any necessary migrations to bring their project up to date.

```js
└── src/
    ├── migrations/
    │   └── scripts/ // The directory where migration scripts live
    │       ├── add-webpack-profile.test.ts // migration script tests
    │       └── add-webpack-profile.ts // migration script
    ├── context.ts // The context object that is passed to the migration scripts
    ├── manager.ts // The manager object that is used to run the migration scripts
    ├── migrations.ts // The configuration that registers the migration scripts
    └── utils.ts // The utilities used by the migration scripts
```

#### How do migrations run?

The update command follows these steps:

1. Checks the current project version (`projectCpVersion`) and package version (`packageCpVersion`).
2. If the project version is greater than or equal to the package version, exits early.
3. Identifies all migrations needed between the project version and package version.
4. Executes migrations sequentially.
5. If the `--commit` flag is passed, it will commit changes after each migration.

#### How to add a migration?

1. Create a new migration script file with a descriptive name (e.g. `add-webpack-profile.ts`)
2. Register your migration in `migrations.ts`:

   ```typescript
   migrations: {
      'add-webpack-profile': {
         version: '5.13.0',
         description: 'Update build command to use webpack profile flag.',
         migrationScript: './scripts/add-webpack-profile.js',
      },
   },
   ```

3. Write your migration script:

   The migration script makes changes to files in a Grafana plugin to bring updates or improvements to the project. It should be isolated to a single task (e.g. add profile flag to webpack builds) rather than update the entire .config directory and all the projects dependencies.

   > **Note:** The migration script must use the context to access the file system and return the updated context.

   ```typescript
   import { Context } from '../context.js';

   export default async function (context: Context): Promise<Context> {
     // Your migration logic here. for example:
     // update files, delete files, add files, rename files, etc.
     // Once done, return the updated context.
     return context;
   }
   ```

#### How to write tests for a migration?

Migrations should be thoroughly tested using the provided testing utilities. Create a test file alongside your migration script (e.g., `add-webpack-profile.test.ts`).

```typescript
import migrate from './add-webpack-profile.js';
import { createDefaultContext } from '../test-utils.js';

describe('Migration - append profile to webpack', () => {
  test('should update the package.json', async () => {
    // 1. Set up a test context with some default files.
    const context = await createDefaultContext();

    // 2. Create some file state to test against.
    await context.updateFile(
      './package.json',
      JSON.stringify({
        scripts: {
          build: 'webpack -c ./.config/webpack/webpack.config.ts --env production',
        },
      })
    );

    // 3. Run the migration function and get the updated context.
    const updatedContext = await migrate(context);

    // 4. Assert expected changes
    expect(await updatedContext.getFile('./package.json')).toMatch(
      'webpack -c ./.config/webpack/webpack.config.ts --profile --env production'
    );
  });
});
```

It is important that migration scripts can run multiple times without making additional changes to files. To make it easy to test this you can make use of the `.toBeIdempotent()` test matcher.

```typescript
describe('Migration - append profile to webpack', () => {
  it('should not make additional changes when run multiple times', async () => {
    const context = await createDefaultContext();

    await context.updateFile(
      './package.json',
      JSON.stringify({
        scripts: {
          build: 'webpack -c ./.config/webpack/webpack.config.ts --env production',
        },
      })
    );

    await expect(migrate).toBeIdempotent(context);
  });
});
```

> [!TIP]
> A lot of the code used by migrations has debug messaging. You can output this in tests to help debugging by using `DEBUG="create-plugin:migrations" npm run test -w @grafana/create-plugin`

#### How to test a migration locally

To test a migration locally you'll need a plugin to test on.

- Bump the version of create-plugin _(This can be necessary if your plugin was already updated using the latest create-plugin version.)_
- Verify that the `.config/.cprc.json` in your plugin has a version that is lower than the bumped `create-plugin` version. `.cprc.json` holds the version of `create-plugin` that was used to scaffold or make the last update of the plugin.
- Run `npx create-plugin update` in your plugin (see instructions on how to link your create-plugin dev version)
