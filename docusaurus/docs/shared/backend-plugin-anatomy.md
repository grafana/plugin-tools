The folders and files used to build the backend for the {props.pluginType} are:

| file/folder        | description                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Magefile.go`      | It’s not a requirement to use mage build files, but we strongly recommend using it so that you can use the build targets provided by the plugin SDK. |
| `/go.mod `         | Go [modules dependencies](https://golang.org/cmd/go/#hdr-The_go_mod_file)                                                                            |
| `/src/plugin.json` | A JSON file describing the plugin                                                                                                                    |
| `/pkg/main.go`     | Starting point of the plugin binary.                                                                                                                 |

#### plugin.json

The [plugin.json](../reference/metadata.md) file is required for all plugins. When building a backend plugin these properties are important:

| property   | description                                                                                                                          |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| backend    | Set to `true` for backend plugins. This tells Grafana that it should start a binary when loading the plugin.                         |
| executable | This is the name of the executable that Grafana expects to start, see [plugin.json reference](../reference/metadata.md) for details. |
| alerting   | If your backend data source supports alerting, set to `true`. Requires `backend` to be set to `true`.                                |
