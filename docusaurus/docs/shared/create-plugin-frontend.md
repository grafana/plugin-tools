The Grafana [create-plugin tool](https://www.npmjs.com/package/@grafana/create-plugin) is a CLI application that simplifies Grafana plugin development, so that you can focus on code. The tool scaffolds a starter plugin, all the required configuration, and a development environment using [Docker Compose](https://docs.docker.com/compose/) for you.

1. <span>In a new directory, create a plugin from a template using create-plugin. When prompted for the kind of plugin, select {props.pluginType}</span>:

   ```
   npx @grafana/create-plugin@latest
   ```

1. Change directory to your newly created plugin:

   ```
   cd <your-plugin>
   ```

1. Install the dependencies:

   ```
   npm install
   ```

1. Build the plugin:

   ```
   npm run dev
   ```

1. Start Grafana:

   ```
   npm run server
   ```
  
1. <span>Open Grafana, by default <a href="http://localhost:3000/">http://localhost:3000/</a>, and go to <b>Administration</b> -> <b>Plugins</b>. Make sure that your {props.pluginType} plugin is there.</span>

You can also verify the Plugin has been discovered by Grafana by checking the logs:

```
INFO[01-01|12:00:00] Plugin registered       logger=plugin.loader pluginID=<your-plugin>
```
