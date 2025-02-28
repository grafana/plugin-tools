# Grafana / Sign Plugin

Sign Grafana plugins with ease.

**ToC**

- [Grafana / Sign Plugin](#grafana--sign-plugin)
  - [Signing a plugin](#signing-a-plugin)
    - [Sign a public plugin](#sign-a-public-plugin)
    - [Sign a private plugin](#sign-a-private-plugin)
      - [`npx`](#npx)
      - [`yarn` (\> 2.x)](#yarn--2x)
  - [Contributing](#contributing)

**`@grafana/sign-plugin`** works on macOS, Windows and Linux.<br />
If something doesn’t work, please [file an issue](https://github.com/grafana/plugin-tools/issues/new).<br />
If you have questions or need help, please ask in [GitHub Discussions](https://github.com/grafana/plugin-tools/discussions).

## Signing a plugin

Signing a plugin allows Grafana to verify the authenticity of the plugin with signature verification. This gives users a way to make sure plugins haven’t been tampered with. All Grafana Labs-authored plugins, including Enterprise plugins, are signed.

All plugins require a signature since Grafana 7.0.

Please refer to [Signing plugins documentation](https://grafana.com/developers/plugin-tools/publish-a-plugin/sign-a-plugin) to understand how to sign a Grafana plugin. The following commands are mentioned here for development purposes.

### Sign a public plugin

In your plugin directory, sign the plugin with your Grafana access policy token. Grafana sign-plugin creates a MANIFEST.txt file in the dist directory of your plugin.

```bash
export GRAFANA_ACCESS_POLICY_TOKEN=<YOUR_GRAFANA_ACCESS_POLICY_TOKEN>
npx @grafana/sign-plugin@latest
```

If the plugin distribution directory differs from the default `dist`, specify the path to use with the `--distDir` flag.

```bash
export GRAFANA_ACCESS_POLICY_TOKEN=<YOUR_GRAFANA_ACCESS_POLICY_TOKEN>
npx @grafana/sign-plugin@latest --distDir path/to/directory
```

### Sign a private plugin

In your plugin directory, run the following to create a MANIFEST.txt file in the dist directory of your plugin.

```bash
npx @grafana/sign-plugin@latest --rootUrls https://example.com/grafana
```

Alternatives:

#### [`npx`](https://github.com/npm/npx)

```bash
npx @grafana/sign-plugin@latest
```

#### [`yarn`](https://yarnpkg.com/cli/dlx) (> 2.x)

```bash
yarn dlx @grafana/sign-plugin@latest
```

## Contributing

We are always grateful for contribution! See the [CONTRIBUTING.md](../../CONTRIBUTING.md) for more information.
