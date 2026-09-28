# Secrets and personal data

Recordings are committed to your repository, so nothing secret may end up in them. plugin-vcr removes credentials on its own. Personal data needs a review from you.

## What's removed automatically

Before anything is written to disk, the proxy:

- Stores only allowlisted request and response headers. By default that leaves out `Authorization` and `Cookie`.
- Reads the environment variables your provisioning files reference under `secureJsonData`, and scrubs their values everywhere. It also catches their base64, URL-encoded and JSON-escaped forms. Credentials inside a Basic auth header are caught too.
- Learns tokens issued during the session, such as OAuth access tokens and STS credentials, and scrubs those too.
- Redacts credential-like query parameters and form fields, such as `key`, `token` and the OAuth `assertion`.
- Scans the result for anything that still looks like a secret: private keys, JWTs, AWS keys and known values. If it finds one, it writes the recording to `<name>.har.quarantine.json` instead, and replay won't use it.

Replay never needs a real credential. The live request is sanitized the same way as the recording before it's matched, so dummy values work.

## Review a recording

> **Warning**
> Read every recording before you commit it. The proxy can't tell that a customer name, an email address or an internal hostname in a response body is sensitive.

To help with the review, list every JSON field in the recording with sample values:

```shell
npx @grafana/plugin-vcr fields --har e2e/recordings/api.har
```

This is shorter than the HAR file: a recording with thousands of entries usually has a few dozen distinct fields.

## Redact personal data

Don't edit the HAR file by hand. Add the fields to `vcr.json`, either to replace them with `REDACTED` or with stable fake values:

```json
{
  "redactFields": ["description"],
  "fakeFields": { "email": "email", "login": "username" }
}
```

Then rewrite the recording offline, without recording again:

```shell
npx @grafana/plugin-vcr redact --har e2e/recordings/api.har --config e2e/recordings/vcr.json --provisioning provisioning
```

A fake value stays the same across entries, so `user-1@example.com` appears everywhere the same real address did and test assertions still hold. Fake kinds are `email`, `username`, `name`, `ip` and `string`. A field name matches at any depth, and a path printed by `fields` works as well.

Don't fake a value the plugin sends back in a later request, such as an ID, because replay won't match it anymore.

## Limit the damage

- Record with a dedicated test account that has synthetic data.
- Give that account the fewest permissions the tests need.
- Rotate its credentials after recording.
