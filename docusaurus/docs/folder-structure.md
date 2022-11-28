---
id: folder-structure
title: Folder Structure
---

After creation, your project should look like this:

```
myorg-myplugin-datasource/
├── .config
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

For the plugin to function, **these files must exist with exact filenames**:

- `src/plugin.json` is the metadata used by Grafana to load the plugin.
- `src/module.ts` is the JavaScript entry point.

<!-- TODO: add backend info here. -->

You may create subdirectories inside `src`. For faster rebuilds, only files inside `src` are processed by webpack. You need to **put any JS and CSS files inside `src`**, otherwise webpack won’t see them.

You can, however, create more top-level directories. They will not be included in the production build so you can use them for things like documentation.
