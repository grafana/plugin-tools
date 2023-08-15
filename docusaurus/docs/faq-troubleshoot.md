---
id: faq-troubleshoot
title: FAQ & Troubleshooting
sidebar_position: 6
---

## Windows Troubleshooting

Here are some things to try and check if you experience problems while working with create-plugin or sign-plugin in Windows.

### I am getting: `Unsupported operating system 'Windows' detected. Please use WSL with create-plugin`

create-plugin does not support native Windows. If you are using Windows, you can install WSL2 to work with create-plugin.

#### I am using Windows with WSL and I still get `Unsupported operating system 'Windows' detected.`

Make sure you are using a WSL terminal. Simply installing WSL on Windows is not sufficient; you need to set up your WSL environment.

To check if you are using a WSL terminal, run the following command: `uname -a`. This command should return something like:

`Linux ....-microsoft-standard-WSL2 #... GNU/Linux`

If you receive an error or a different output, you are not using a WSL terminal.

#### I can confirm I am inside a WSL terminal, but I still get `Unsupported operating system 'Windows' detected.`

You must install Node.js within your WSL environment. You can find a guide on how to install it [here](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl). We recommend installing the latest LTS version of Node.js.

#### I have Node.js installed inside WSL, but I still get `Unsupported operating system 'Windows' detected.`

It is possible that you installed Node.js within WSL, but you are not using the latest LTS version. Additionally, WSL has a problem where it may pick up Windows binaries and attempt to run them. This means that even if you are inside a WSL terminal, you may still be running a Windows binary that is not supported by create-plugin.

##### What you can do:

- Check that you are using a version of Node.js >= 18 by running `node --version`.
- Check if you are using a Linux binary for Node.js and npx by running the following commands: `which node` and `which npx` (note that the command is `which`, not `node --version`). You should receive output similar to `/usr/bin/node` and `/usr/bin/npx`. If the output of these commands is something like `..../Program Files/nodejs/npx`, it means you are using the wrong binary and should install or reinstall Node.js.
- You can follow the [Microsoft guide](https://learn.microsoft.com/en-us/windows/dev-environment/javascript/nodejs-on-wsl) on how to correctly install Node.js.

NOTE: If you installed Node.js using `sudo apt install nodejs` without following any guide or changing the APT repositories, it is probable that you are not using the latest Node.js LTS.

### When I open Grafana with my newly created plugin, Grafana can't load the plugin.

- First, try restarting Grafana to ensure it detects the new plugin.
- If you are using Native Windows (without WSL), you need to use WSL. Create-plugin does not support Native Windows.

### When I run `npm run build` or `npm run dev` in my plugin, I don't see my changes reflected.

If you are using mounts to access your files, it is likely that webpack is not detecting your file changes. Working with file storage and performance across WSL and Windows file systems can be problematic. This issue is not related to create-plugin but rather how WSL and Windows operate.

#### What you can do:

- If you are editing your code from a native Windows app (such as VS Code), you need to manually rerun `yarn build` every time you want to see a change in your plugin.
- Use webpack `watchOption` with `poll` [(more info here)](https://webpack.js.org/configuration/watch/#watchoptionspoll) in your project. You can find instructions on how to extend webpack configuration [here](https://grafana.com/developers/plugin-tools/create-a-plugin/extend-configurations).

### I get `SyntaxError: Cannot use import statement outside a module` when running Jest or `npm run test`

A common issue with the current Jest config involves importing an npm package which only offers an ESM build. These packages cause Jest to generate the error: `SyntaxError: Cannot use import statement outside a module`.

To work around this issue, use one of the packages known to pass to the `[transformIgnorePatterns](https://jestjs.io/docs/configuration#transformignorepatterns-arraystring)` Jest configuration property.

To use these packages, extend them in the following way:

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
