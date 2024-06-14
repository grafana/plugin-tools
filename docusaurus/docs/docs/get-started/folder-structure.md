---
id: folder-structure
title: Folder structure
description: How your folder structure should look after running create-plugin.
keywords:
  - grafana
  - plugins
  - plugin
  - create-plugin
  - folders
sidebar_position: 2
---

After you [install](./get-started.mdx#step-1-install-the-create-plugin-tool) the `create-plugin` tool and have answered the prompts, your project should look similar to this:

```
myorg-myplugin-datasource/
├── .config/
├── .eslintrc
├── .github
│   └── workflows
├── .gitignore
├── .nvmrc
├── .prettierrc.js
├── CHANGELOG.md
├── LICENSE
├── Magefile.go
├── README.md
│   └── integration
├── docker-compose.yaml
├── go.mod
├── go.sum
├── jest-setup.js
├── jest.config.js
├── node_modules
├── package.json
├── pkg
│   ├── main.go
│   └── plugin
├── playwright.config.ts
├── src
│   ├── README.md
│   ├── components
│   ├── datasource.ts
│   ├── img
│   ├── module.ts
│   ├── plugin.json
│   └── types.ts
├── tsconfig.json
└── tests
```

## Required files

You must have files with these exact filenames:

| Filename            | Description                                                                                              |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| `./go.mod`          | Go modules dependencies. Refer to [Golang documentation](https://golang.org/cmd/go/#hdr-The_go_mod_file) |
| `./src/plugin.json` | A JSON file describing the plugin.                                                                       |
| `./src/module.ts`   | The entry point of the frontend plugin.                                                                  |
| `./pkg/main.go`     | The entry point of the backend plugin.                                                                   |

## Optional files

These files in your project are optional:

| Filename        | Description                                                                                                            |
| --------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `./Magefile.go` | We strongly recommend using mage build files so that you can use the build targets provided by the backend plugin SDK. |
