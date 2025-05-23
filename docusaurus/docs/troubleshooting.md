---
id: troubleshooting
title: Troubleshooting
description: Troubleshoot issues in your Grafana plugin development.
keywords:
  - grafana
  - plugins
  - documentation
  - troubleshooting
  - Windows
  - WSL
sidebar_position: 55
---

# Troubleshooting

Here are some things to try and check if you experience problems while working with the `create-plugin` or `sign-plugin` tools.

### I am getting: `Unsupported operating system 'Windows' detected. Please use WSL with create-plugin`

The `create-plugin` tool doesn't support native Windows. If you're using Windows, you must install WSL 2 to work with `create-plugin`. WSL 2 is a new version of the Windows Subsystem for Linux architecture that allows you to run ELF64 Linux binaries on Windows.

#### I am using Windows with WSL and I still get `Unsupported operating system 'Windows' detected.`

Make sure you're using a WSL terminal. Simply installing WSL on Windows isn't sufficient; you need to set up your WSL environment.

To check if you're using a WSL terminal, run the following command: `uname -a`. This command should return something like:

`Linux ....-microsoft-standard-WSL2 #... GNU/Linux`

If you receive an error or a different output, you aren't using a WSL terminal.

#### I can confirm I am inside a WSL terminal, but I still get `Unsupported operating system 'Windows' detected.`

You must install Node.js within your WSL environment. You can find a guide on how to install it in Microsoft's [documentation](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl). We recommend installing the latest LTS version of Node.js.

#### I have Node.js installed inside WSL, but I still get `Unsupported operating system 'Windows' detected.`

It's possible that you installed Node.js within WSL, but you aren't using the latest LTS version. Additionally, WSL has a problem where it may pick up Windows binaries and attempt to run them. This means that even if you're inside a WSL terminal, you may still be running a Windows binary that isn't supported by `create-plugin`.

##### What you can do:

- Check that you're using Node.js version 18 or later by running `node --version`.
- Check if you're using a Linux binary for Node.js and npx by running the following commands: `which node` and `which npx` (note that the command is `which`, not `node --version`). You should receive output similar to `/usr/bin/node` and `/usr/bin/npx`. If the output of these commands is something like `..../Program Files/nodejs/npx`, it means you're using the wrong binary and should install or reinstall Node.js.
- You can follow the [Microsoft guide](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl) on how to correctly install Node.js.

:::note

If you installed Node.js using `sudo apt install nodejs` without following any guide or changing the APT repositories, it's probable that you aren't using the latest Node.js LTS.

:::

### When I open Grafana with my newly created plugin, Grafana can't load the plugin.

- First, try restarting Grafana to ensure it detects the new plugin.
- If you're using Native Windows (without WSL), you need to use WSL. The `create-plugin` tool doesn't support Native Windows.

### When I run `npm run build` or `npm run dev` in my plugin, I don't see my changes reflected.

If you're using mounts to access your files, it's likely that webpack isn't detecting your file changes. Working with file storage and performance across WSL and Windows file systems can be problematic. This issue isn't related to `create-plugin`, but rather it's how WSL and Windows operate.

#### What you can do:

- If you're editing your code from a native Windows app (such as VS Code), you need to manually rerun `yarn build` every time you want to see a change in your plugin.
- Use [webpack `watchOption` with `poll`](https://webpack.js.org/configuration/watch/#watchoptionspoll) in your project. Trying running the [create-plugin update command](/reference/cli-commands#update) which includes polling.

### I get `SyntaxError: Cannot use import statement outside a module` when running Jest or `npm run test`.

A common issue with the current Jest config involves importing an npm package that only offers an ESM build. These packages cause Jest to error with `SyntaxError: Cannot use import statement outside a module`.

To work around this, we provide a list of known packages to pass to the `[transformIgnorePatterns](https://jestjs.io/docs/configuration#transformignorepatterns-arraystring)` Jest configuration property.

If need be, this can be extended in the following way:

```javascript
process.env.TZ = 'UTC';
const { grafanaESModules, nodeModulesToTransform } = require('./.config/jest/utils');

module.exports = {
  // Jest configuration provided by @grafana/create-plugin
  ...require('./.config/jest.config'),
  // Inform Jest to only transform specific node_module packages.
  transformIgnorePatterns: [nodeModulesToTransform([...grafanaESModules, 'packageName'])],
};
```

### I get `"image with reference <plugin-name> was found but does not match the specified platform: wanted linux/amd64, actual: linux/arm64/v8"` after running `docker compose up` or `npm run server`.

This error is most likely to impact users of Mac computers with Apple silicon. If you have previously built an image for a plugin scaffolded with `create-plugin` prior to v1.12.2, then running `docker compose up` may fail with the above message if the old image hasn't been removed.

#### What you can do:

- Run `docker compose down` to stop and remove the container.
- Remove the image using `docker rmi <plugin-name>`.
- Run `docker compose up` or `npm run server`.
