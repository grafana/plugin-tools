---
id: folder-structure
title: Folder Structure
---

After creation, your project should look similar to this:

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
├── cypress
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
├── src
│   ├── README.md
│   ├── components
│   ├── datasource.ts
│   ├── img
│   ├── module.ts
│   ├── plugin.json
│   └── types.ts
└── tsconfig.json
```

## Required files

For the plugin to function, **these files must exist with exact filenames**:

| Filename            | Description                                                                          |
| ------------------- | ------------------------------------------------------------------------------------ |
| `./go.mod`          | Go modules dependencies, [reference](https://golang.org/cmd/go/#hdr-The_go_mod_file) |
| `./src/plugin.json` | A JSON file describing the plugin                                                    |
| `./src/module.ts`   | The entry point of the frontend plugin                                               |
| `./pkg/main.go`     | The entry point of the backend plugin                                                |

These files are optional:

| Filename        | Description                                                                                                                                |
| --------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `./Magefile.go` | Whilst not required we strongly recommend using mage build files so that you can use the build targets provided by the backend plugin SDK. |
