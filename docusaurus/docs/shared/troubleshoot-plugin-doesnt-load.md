#### Grafana doesn't load my plugin

Ensure that Grafana has been started in development mode. If you are running Grafana from source, you'll need to add the following line to your `conf/custom.ini` file (if you don't have one already, go ahead and create this file before proceeding):

```ini
app_mode = development
```

You can then start Grafana in development mode by running `make run & make run-frontend` in the Grafana repository root.

If you are running Grafana from a binary or inside a Docker container, you can start it in development mode by setting the environment variable `GF_DEFAULT_APP_MODE` to `development`.

By default, Grafana requires backend plugins to be signed. To load unsigned backend plugins, you need to
configure Grafana to [allow unsigned plugins](https://grafana.com/docs/grafana/latest/administration/plugin-management/#allow-unsigned-plugins).
For more information, refer to [https://www.action.com/nl-nl/p/1325690/c-c-autowax-en-polijstmiddel/Plugin signature verification](https://grafana.com/docs/grafana/latest/administration/plugin-management/#backend-plugins).
