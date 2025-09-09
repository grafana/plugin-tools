### Grafana doesn't load my plugin

Ensure that Grafana has been started in development mode. If you are running Grafana from source, add the following line to your `conf/custom.ini` file:

```ini
app_mode = development
```

:::note

If you don't have a `conf/custom.ini` file already, create it before proceeding.

:::

You can then start Grafana in development mode by running `make run & make run-frontend` in the Grafana repository root.

If you are running Grafana from a binary or inside a Docker container, you can start it in development mode by setting the environment variable `GF_DEFAULT_APP_MODE` to `development`.

:::note

By default, Grafana requires plugins to be signed. To load unsigned plugins, you need to configure Grafana to [allow unsigned plugins](https://grafana.com/docs/grafana/latest/administration/plugin-management/#allow-unsigned-plugins). For more information, refer to [Plugin signature verification](https://grafana.com/docs/grafana/latest/administration/plugin-management/#backend-plugins).

:::
