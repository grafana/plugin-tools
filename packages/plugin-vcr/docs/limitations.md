# Limitations

## Plugins it can't intercept

- **Only HTTP and HTTPS.** Databases that use their own TCP protocol don't work: PostgreSQL, MySQL, Microsoft SQL Server, Oracle, SAP HANA, MongoDB, Aurora, CockroachDB and ClickHouse in native mode. For self-hosted engines, run a real container with seed data instead.
- **No gRPC, WebSocket or long-lived streams.** Examples are the BigQuery Storage Read API, Loki live tailing, Tempo streaming search and InfluxDB Flight SQL. The HTTP paths of those plugins still work.
- **The plugin must honour `HTTPS_PROXY`.** A plugin that builds its own HTTP transport without a proxy skips the proxy. Examples are Infinity when its proxy setting isn't `env`, and IoT SiteWise in Edge mode. Go never proxies `localhost`, so an API running on localhost is also skipped.
- **Custom CAs and mutual TLS break interception.** If a datasource is configured with its own CA certificate or a client certificate, it no longer trusts the proxy's CA. Leave these settings off in the provisioning you record with.
- **Frontend-only datasources don't need it.** If the browser makes the call, mock it in Playwright instead.

## Replay

- **Time must be pinned.** A request that contains the current time won't match on the next run. Use absolute time ranges in tests and dashboards. Values the plugin backend derives from its own clock need `ignoreFields`.
- **Only recorded requests replay.** Changing a query, a time range or a variable value means recording again. There's no fallback for misses yet, which matters most for demos.
- **Recording replaces the whole file.** There's no mode that adds new requests to an existing recording yet.
- **Replay heuristics are young.** Polling APIs, abandoned query executions and ID correlation have been tested on Redshift and BigQuery only.

## Redaction

- **Personal data needs configuration.** Only fields you list in `redactFields` or `fakeFields` are changed.
- **Binary bodies aren't scrubbed.** They're scanned for secrets, but not rewritten.
