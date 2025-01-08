The Grafana [create-plugin tool](https://www.npmjs.com/package/@grafana/create-plugin) is a CLI application that simplifies Grafana plugin development, so that you can focus on code. The tool scaffolds a starter plugin, all the required configuration, and a development environment using [Docker Compose](https://docs.docker.com/compose/) for you.

1. In a new directory, create a plugin from a template using the create-plugin tool. When prompted for the kind of plugin, select {props.pluginType}:

   ```shell
   npx @grafana/create-plugin@latest
   ```

2. Go to the directory of your newly created plugin:

   ```shell
   cd <your-plugin>
   ```

3. Install the dependencies:

   ```shell
   npm install
   ```

4. Build the plugin:

   ```shell
   npm run dev
   ```

5. Start Grafana:

   ```shell
   docker compose up
   ```

6. Open Grafana, by default [http://localhost:3000](http://localhost:3000), and then go to **Administration** > **Plugins**. Make sure that your {props.pluginType} plugin is there.

You can also verify that Grafana has discovered your plugin by checking the logs:

```
INFO[01-01|12:00:00] Plugin registered       logger=plugin.loader pluginID=<your-plugin>
```
