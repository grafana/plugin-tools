---
id: nested-plugins
title: Nested Plugins
---

Grafana App plugins can nest datasource and panel plugins making it easy to ship a complete user experience. To take advantage of this feature first scaffold an app plugin using `@grafana/create-plugin`:

```bash
npx @grafana/create-plugin
```

When prompted `What type of plugin would you like?` select `app`.

## Frontend

Nested frontend plugins require seperate entry (`module.ts`) and plugin meta (`plugin.json`) files. These should be added to a directory inside the `./src` directory:

```diff bash
./src
 ├── README.md
 ├── components
+├── datasource
+│   ├── components
+│   │   ├── ConfigEditor.tsx
+│   │   └── QueryEditor.tsx
+│   ├── datasource.ts
+│   ├── img
+│   ├── module.ts
+│   ├── plugin.json
+│   └── types.ts
 ├── img
 │   └── logo.svg
 ├── module.ts
 └── plugin.json
```

## Backend

As the backend of a plugin has a single entry point (see [folder structure](./folder-structure.md#required-files) for reference) introduce the nested plugin backend source to the `./pkg` directory:

```diff bash
./pkg
├── main.go
└── plugin
    ├── app.go
+   ├── datasource.go
    ├── resources.go
    └── resources_test.go
```

:::tip

Download datasource and panel plugin source directories directly from the [plugin-examples repo](https://github.dev/grafana/grafana-plugin-examples/tree/main/examples) to help speed up development.

- Press . or replace .com with .dev in URL to open the repo in GitHub's editor
- In the Explorer pane (left side or press Ctrl+Shift+E/Cmd+Shift+E), right click on the required file/folder and select Download...
- In the Select Folder dialog box, choose the directory where you want the selected file/folder to exist

:::
