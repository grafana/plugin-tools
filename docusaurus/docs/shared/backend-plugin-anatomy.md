The folders and files used to build the backend for the {props.pluginType} are:

| file/folder        | description                                                                                                                                            |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `Magefile.go`      | It’s not a requirement to use mage build files, but we strongly recommend using them so that you can use the build targets provided by the plugin SDK. |
| `/go.mod `         | Go [modules dependencies](https://golang.org/cmd/go/#hdr-The_go_mod_file).                                                                             |
| `/src/plugin.json` | A JSON file describing the plugin.                                                                                                                     |
| `/pkg/main.go`     | Starting point of the plugin binary.                                                                                                                   |

#### The plugin.json file

The [`plugin.json`](../reference/metadata.md) file is required for all plugins. When building a plugin backend component, pay attention especially to these properties:

| property     | description                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| `backend`    | Set to `true` for plugins with a backend component. This tells Grafana that it should start a binary when loading the plugin.                              |
| `executable` | This is the name of the executable that Grafana expects to start. Refer to [plugin.json reference](../reference/metadata.md) for details. |
| `alerting`   | If your backend data source supports alerting, set to `true`. Requires `backend` to be set to `true`.                                     |
