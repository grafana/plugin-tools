# Grafana / Zip Plugin

Zip Grafana plugins for distribution.

**`@grafana/zip-plugin`** works on macOS, Windows and Linux.<br />
If something doesn’t work, please [file an issue](https://github.com/grafana/plugin-tools/issues/new).<br />
If you have questions or need help, please ask in [GitHub Discussions](https://github.com/grafana/plugin-tools/discussions).

## Packaging a plugin

Packaging a plugin in a zip file is the recommended way of distributing Grafana plugins.

Before packaging the plugin, you should build and sign it with your normal build tool and @grafana/sign-plugin, respectively.

If your plugin puts build output in /dist, you can just do:

```bash
npx @grafana/zip-plugin@latest
```

If the plugin distribution directory differs from the default `dist`, specify the path to use with the `--distDir` flag.

```bash
npx @grafana/zip-plugin@latest --distDir path/to/directory
```

Alterntives:

#### [`npx`](https://github.com/npm/npx)

```bash
npx @grafana/zip-plugin@latest
```

#### [`yarn`](https://yarnpkg.com/cli/dlx) (> 2.x)

```bash
yarn dlx @grafana/zip-plugin@latest
```

## Contributing

We are always grateful for contribution! See the [CONTRIBUTING.md](../../CONTRIBUTING.md) for more information.
