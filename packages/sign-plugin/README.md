# Grafana / Sign Plugin

Sign Grafana plugins with ease.

**ToC**

- [Grafana / Sign Plugin](#grafana--sign-plugin)
  - [Signing a plugin](#signing-a-plugin)
    - [Sign a public plugin](#sign-a-public-plugin)
    - [Sign a private plugin](#sign-a-private-plugin)
      - [`npx`](#npx)
      - [`yarn` (\> 2.x)](#yarn--2x)
  - [Requirements and proxy configuration](#requirements-and-proxy-configuration)
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

## Requirements and proxy configuration

Starting with v4, `@grafana/sign-plugin` requires Node.js 24.15.0 or later.

To sign through an HTTP or HTTPS proxy, set `HTTPS_PROXY` before running the signing command:

```bash
export HTTPS_PROXY=http://proxy.example.com:8080
export NO_PROXY=localhost,127.0.0.1
```

Proxy URLs must include `http://` or `https://`. Basic proxy authentication is supported with a URL such as `http://username:password@proxy.example.com:8080`. Lowercase `https_proxy` and `no_proxy` take precedence over their uppercase equivalents. `NO_PROXY` accepts comma-separated hosts or patterns to bypass the proxy. You don't need to set `NODE_USE_ENV_PROXY`.

### Breaking changes in v4

Starting with v4, `@grafana/sign-plugin` uses Node.js built-in proxy support instead of `proxy-agent`:

- Node.js versions earlier than 24.15.0 are no longer supported.
- PAC files and SOCKS proxies are no longer supported. Configure an HTTP or HTTPS proxy directly instead.
- `ALL_PROXY` is no longer read. Move HTTP or HTTPS proxy URLs to `HTTPS_PROXY`. `HTTP_PROXY` alone doesn't configure HTTPS signing requests.
- Proxy URLs without a scheme are no longer supported. Add `http://` or `https://`.
- Space-separated `NO_PROXY` entries are no longer supported. Use commas instead. Refer to the [Node.js proxy documentation](https://nodejs.org/docs/latest-v24.x/api/http.html#built-in-proxy-support) for matching rules.

## Contributing

We are always grateful for contribution! See the [CONTRIBUTING.md](../../CONTRIBUTING.md) for more information.
