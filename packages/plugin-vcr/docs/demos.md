# Demos and local development

Replay needs no account and no network, so the same recordings that run your e2e tests can show a dashboard to anyone or let a teammate work without access to the service.

These use the compose overlay and scripts from [Set up plugin-vcr](./setup.md).

## Demo a dashboard

> **Important**
> A demo dashboard must use an absolute time range. With a relative range like "Last 1 hour", every load builds a request for a different time window. None of those requests are recorded, so every panel fails.

Save the range in the dashboard JSON, and hide the time picker so viewers can't change it:

```json
{
  "time": { "from": "2026-09-01T00:00:00Z", "to": "2026-09-02T00:00:00Z" },
  "timepicker": { "hidden": true }
}
```

1. Save the dashboard with that fixed range.
2. Run `npm run server:record` with real credentials. Open the dashboard and do everything the demo will show: open each panel, pick each variable value and switch each tab.
3. Stop the stack and [review the recording](./secrets.md#review-a-recording). A demo is usually public, so review it with extra care.
4. Run `npm run server:replay` to show the demo.

Replay fails closed, so anything you didn't record shows a panel error, such as a new time range or a query edit. Make the dashboard read-only for viewers, and limit variables to the values you recorded. The data shows the day you recorded, not the current time.

## Develop without access

If a teammate has committed recordings, you can run the plugin against them with no account:

```shell
npm run server:replay
```

Then open Grafana at `http://localhost:3000`. Dashboards and queries that were recorded return data. Anything else returns a miss that names the request, which tells you what to record next.
