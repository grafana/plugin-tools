# @grafana/plugin-vcr

**Record your plugin's API traffic once. Replay it anywhere, with no credentials.**

plugin-vcr sits between Grafana and the third-party API a plugin calls, whether the call comes from the plugin's own backend or from a frontend plugin through Grafana's datasource proxy. Record a session against the real API, commit the recording, and from then on Grafana runs against it with no account, no network and no secrets.

plugin-vcr is inspired by the [VCR](https://github.com/vcr/vcr) library for Ruby.

> **Warning**
> This package is experimental and not released yet. To try it, refer to [Get started](./docs/setup.md).

## What you can do with it

- **Run e2e tests without secrets.** Test the whole plugin, backend included, on every pull request. Forks too.
- **Demo a dashboard.** Show real-looking data to people who have no account for the service. The dashboard needs an [absolute time range](./docs/demos.md#demo-a-dashboard).
- **Develop without access.** Work on a plugin whose API you can't reach, using a teammate's recordings.

## How it works

```
  record   Grafana + plugin ──> vcr ──> third-party API
                                 │
                                 └── writes recordings/api.har (sanitized)

  replay   Grafana + plugin ──> vcr     no network, no credentials
                                 │
                                 └── reads recordings/api.har
```

plugin-vcr is a forward proxy that runs next to Grafana in Docker Compose. Grafana passes `HTTPS_PROXY` to plugin backend processes, and honours it itself for the calls it makes on a frontend plugin's behalf through its datasource proxy, so the real API keeps getting called with no code changes. Recording forwards each request and saves a sanitized copy. Replay answers from the recording and never calls the real API.

- **Works with vendor auth.** AWS SigV4, OAuth, Google service accounts, API keys and bearer tokens.
- **Fails closed.** A request with no recording gets an error that names the field that differs.
- **Keeps secrets out.** Known credentials are scrubbed, and a scan refuses to write a recording that still has one.
- **Diffs well.** Recordings are standard, pretty-printed HAR files.

It works with anything whose call to the third-party API passes through Grafana over HTTP or HTTPS: a backend plugin's own call, or a frontend plugin's call through Grafana's datasource proxy. That covers most datasources, including AWS, Google, Azure, GitHub, Snowflake and Databricks. Databases with their own TCP protocol, such as PostgreSQL, don't work, and a frontend plugin that calls the API directly from the browser doesn't either. Refer to [Limitations](./docs/limitations.md).

## Quick start

A `create-plugin` addition wires plugin-vcr into a backend plugin's compose file, provisioning and CI. It isn't released yet, so run it from a preview build:

```shell
npx https://pkg.pr.new/grafana/plugin-tools/@grafana/create-plugin@be1efea add vcr
```

Then:

```shell
API_TOKEN=<real token> npm run server:record   # record while you use the plugin
npx @grafana/plugin-vcr fields --har e2e/recordings/api.har   # review before you commit
npm run server:replay                           # replay, no credentials needed
```

See [Get started](./docs/setup.md) for what the addition scaffolds, and for the manual steps if you'd rather wire it up yourself.

> **Warning**
> Review every recording before you commit it. Credentials are removed automatically, but personal data in responses is only removed from fields you configure. Refer to [Secrets and personal data](./docs/secrets.md).

## Documentation

- [Set up plugin-vcr](./docs/setup.md)
- [Run it in CI](./docs/ci.md)
- [Demos and local development](./docs/demos.md)
- [Secrets and personal data](./docs/secrets.md)
- [Configuration](./docs/configuration.md)
- [Limitations](./docs/limitations.md)
