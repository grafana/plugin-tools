# Configuration

`vcr.json` sets which hosts are recorded, how requests are matched and what's redacted. All fields are optional, but with no `hosts` nothing is recorded. A list you set replaces the default, and a preset adds to it.

| Field                 | Default                                          | Description                                                                    |
| --------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------ |
| `hosts`               | `[]`                                             | Hosts to record and replay. Exact names or a leading `*.` wildcard.            |
| `preset`              | none                                             | Vendor conventions to add. Only `aws` exists.                                  |
| `keepHeaders`         | `["content-type", "accept"]`                     | Request headers that are stored and matched.                                   |
| `keepResponseHeaders` | `["content-type"]`                               | Response headers that are stored and replayed.                                 |
| `ignoreFields`        | `[]`                                             | JSON or form body fields left out of matching, such as a generated request ID. |
| `ignoreQueryParams`   | `[]`                                             | Query parameters left out of matching.                                         |
| `ignoreBodyFor`       | `[]`                                             | `host/path` prefixes whose request body is left out of matching.               |
| `credentialParams`    | `key`, `token`, `assertion`, `password` and more | Query parameters and form fields that are always redacted.                     |
| `redactFields`        | `["password"]`                                   | Response JSON fields replaced with `REDACTED`.                                 |
| `fakeFields`          | `{}`                                             | Response JSON fields replaced with a stable fake value, mapped to a fake kind. |
| `secretEnvVars`       | `[]`                                             | Extra environment variables to scrub, on top of those in provisioning.         |
| `learnSecretFields`   | `access_token`, `refresh_token` and more         | Response fields whose values are scrubbed everywhere once seen.                |

## How requests are matched

A live request matches a recording when the method, host, path, query, allowlisted headers and body are the same. Query parameter order doesn't matter, and anything in `ignoreFields` or `ignoreQueryParams` is left out.

When the same request was recorded several times, as when a plugin polls for query status, the responses replay in the order they were recorded. The last one repeats once they run out.

When a field in `ignoreFields` is an ID the client makes up and sends back later, as BigQuery does with job IDs, replay learns the pairing and rewrites the later requests to match.

## Plugins that sign requests locally

Some auth methods sign a token request with a private key, for example a Google service account. Replay needs a key that can sign but has no access to anything. The `keygen` command generates one, so no key is ever committed. Run it as a one-shot compose service before Grafana starts:

```yaml
services:
  replay-key:
    image: plugin-vcr
    command: [keygen, --out, /recordings/.ca/replay-key.pem]
    volumes:
      - ./e2e/recordings:/recordings

  grafana:
    depends_on:
      replay-key:
        condition: service_completed_successfully
```

The proxy serves the key at `http://vcr:8091/replay-key.pem`, so Grafana can fetch it in its entrypoint next to the CA. Use `--format google-service-account` to get a service account JSON file instead of a PEM key.

## Commands

| Command  | Description                                                           |
| -------- | --------------------------------------------------------------------- |
| `serve`  | Runs the proxy in `record` or `replay` mode.                          |
| `scan`   | Checks a recording for secrets. Exits non-zero on a finding.          |
| `fields` | Lists every JSON field in a recording with sample values, for review. |
| `redact` | Applies the current config rules to an existing recording.            |
| `keygen` | Writes a throwaway RSA key, as PEM or a Google service account file.  |
