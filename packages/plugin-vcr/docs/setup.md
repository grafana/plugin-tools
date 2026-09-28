# Set up plugin-vcr

This guide adds record and replay to a plugin that uses the `docker-compose.yaml` created by `@grafana/create-plugin`. The same setup serves e2e tests, [demos](./demos.md) and local development.

## The fast way: `create-plugin add vcr`

A `create-plugin` addition does everything in [Manual setup](#manual-setup) for you: it detects the hosts your plugin calls from `go.mod`, finds the secret environment variables your provisioning file references, and scaffolds the config, the compose file, the `server:record`/`server:replay` scripts and the CI wiring.

It isn't released yet either, so run it from a preview build:

```shell
npx https://pkg.pr.new/grafana/plugin-tools/@grafana/create-plugin@<commit-sha> add vcr
```

For example, `https://pkg.pr.new/grafana/plugin-tools/@grafana/create-plugin@be1efea` is the preview for the PR that adds this addition. Check the PR for a newer commit SHA once one lands.

Read what it prints when it finishes: it tells you which hosts to add if none were detected, whether it found and wired your CI workflow, and anything else specific to your plugin. Then skip to [Record](#4-record).

If you'd rather wire it up by hand, or want to see exactly what the addition does, read on.

## Manual setup

### Install

plugin-vcr isn't released yet. You can get it in one of two ways, and neither needs anything merged to `main`.

### From a branch checkout

This is the simplest option on your own machine. Clone plugin-tools next to your plugin repository and switch to the branch:

```shell
git clone https://github.com/grafana/plugin-tools.git
cd plugin-tools
git switch sunker/plugin-e2e-proxy
npm install
```

In your compose file, build the image from that checkout. The path is relative to your plugin's `docker-compose.yaml`:

```yaml
services:
  vcr:
    image: plugin-vcr:local
    build:
      context: ../plugin-tools/packages/plugin-vcr
```

To run the other commands, such as `fields` or `scan`:

```shell
npx tsx ../plugin-tools/packages/plugin-vcr/src/bin/run.ts fields --har e2e/recordings/api.har
```

### From a preview build

Use this in CI or on a machine without plugin-tools cloned. The pull request for this package has the `preview` label, so every commit is published to [pkg.pr.new](https://pkg.pr.new). The pkg.pr.new bot comments the install URL on the pull request.

Each URL is pinned to one commit. It keeps working after new commits land, and you pick up changes by switching to a newer commit SHA.

In your compose file, run the preview with Node.js:

```yaml
services:
  vcr:
    image: node:24-alpine
    entrypoint: [npx, -y, 'https://pkg.pr.new/grafana/plugin-tools/@grafana/plugin-vcr@<commit-sha>']
```

To run the other commands:

```shell
npx https://pkg.pr.new/grafana/plugin-tools/@grafana/plugin-vcr@<commit-sha> fields --har e2e/recordings/api.har
```

The rest of these docs use `npx @grafana/plugin-vcr` and `image: plugin-vcr` as they will look after release. Swap in one of the options above until then.

### 1. Add the config

Create `e2e/recordings/vcr.json` and list the hosts your plugin calls:

```json
{
  "hosts": ["api.example.com"]
}
```

A leading `*.` matches subdomains, for example `*.amazonaws.com`. For AWS plugins, add the AWS preset. It keeps the `x-amz-target` header that names each operation and ignores the SDK's idempotency tokens:

```json
{
  "preset": "aws",
  "hosts": ["*.amazonaws.com"]
}
```

If you're not sure which hosts your plugin calls, start with an empty list and record. The proxy logs every host it passes through. For every other option, refer to [Configuration](./configuration.md).

Create `e2e/recordings/.gitignore`:

```gitignore
# the CA's private key never leaves this machine
.ca/
# recordings the pre-write scan refused, kept only for inspection
*.quarantine.json
# a write interrupted by a kill
*.tmp
```

### 2. Add the compose overlay

Create `e2e/docker-compose.vcr.yaml`. It adds the proxy and points Grafana at it:

```yaml
services:
  vcr:
    image: plugin-vcr
    command:
      - serve
      - --mode
      - ${VCR_MODE:-replay}
      - --har
      - /recordings/api.har
      - --ca-dir
      - /recordings/.ca
      - --config
      - /recordings/vcr.json
      - --provisioning
      - /provisioning
      - --port
      - '8091'
    environment:
      # the proxy reads these through provisioning's secureJsonData to know what to scrub
      API_TOKEN: ${API_TOKEN:-dummy-token}
    volumes:
      # compose resolves these relative to the first -f file, not this one
      - ./e2e/recordings:/recordings
      - ./provisioning:/provisioning:ro
    healthcheck:
      test: ['CMD', 'wget', '-qO', '/dev/null', 'http://localhost:8091/ca.pem']
      interval: 1s
      timeout: 3s
      retries: 30

  grafana:
    depends_on:
      vcr:
        condition: service_healthy
    entrypoint:
      - /bin/sh
      - -c
      - |
        mkdir -p /etc/ssl/certs/proxy
        curl -sf http://vcr:8091/ca.pem -o /etc/ssl/certs/proxy/ca.pem
        exec /run.sh
    environment:
      API_TOKEN: ${API_TOKEN:-dummy-token}
      HTTPS_PROXY: http://vcr:8091
      HTTP_PROXY: http://vcr:8091
      NO_PROXY: localhost,127.0.0.1
      SSL_CERT_DIR: /etc/ssl/certs/proxy
```

Grafana trusts the proxy's CA through `SSL_CERT_DIR`, which adds to the system CA bundle. Don't use `SSL_CERT_FILE`: it replaces the bundle, and Grafana's own calls to grafana.com start failing.

Replace `API_TOKEN` with the environment variables your provisioning file uses. The dummy default lets replay start without the real value. Vendor SDKs often refuse to sign a request with an empty key.

In your provisioning file, reference secrets as `$API_TOKEN`. Don't use `${API_TOKEN:-default}`: Grafana provisioning doesn't support that syntax and silently expands it to an empty string. Put defaults in the compose file instead.

If your plugin signs its own token requests with a private key, as Google service accounts do, also add a replay key. Refer to [Plugins that sign requests locally](./configuration.md#plugins-that-sign-requests-locally).

### 3. Add scripts

Add these to `package.json`:

```json
{
  "scripts": {
    "server:record": "VCR_MODE=record docker compose -f docker-compose.yaml -f e2e/docker-compose.vcr.yaml up --build --force-recreate",
    "server:replay": "VCR_MODE=replay docker compose -f docker-compose.yaml -f e2e/docker-compose.vcr.yaml up --build --force-recreate"
  }
}
```

### 4. Record

With real credentials in your environment, start the stack and then use the plugin. For e2e tests that means running the suite. For a demo it means clicking through the dashboard.

```shell
API_TOKEN=<real token> npm run server:record
npm run e2e
```

Stop the stack with Ctrl+C. The proxy prints how many entries it wrote, what it scrubbed and any scan findings.

A recording session replaces the whole HAR file, so do everything you want replayed in one session. Use a dedicated test account with synthetic data if you can, and rotate the credentials after recording.

### 5. Review the recording

Read every recording before you commit it. The proxy removes credentials it knows about, but it can't tell that a name or an email address in a response is sensitive. [Secrets and personal data](./secrets.md) explains what's removed automatically and how to redact the rest.

### 6. Replay

Without credentials:

```shell
npm run server:replay
npm run e2e
```

If a request has no recording, the proxy log names it and the field that differs:

```
miss POST api.example.com/query - closest recording: body field "from": got "1759050000000", recording has "1759046400000" - looks like a time, pin the test's time range or add it to ignoreFields
```

Most misses come from relative time ranges. Set an absolute range in the test with `panelEditPage.timeRange.set()`.

## Next steps

- [Run it in CI](./ci.md)
- [Demo a dashboard](./demos.md)
- [Configuration](./configuration.md)
