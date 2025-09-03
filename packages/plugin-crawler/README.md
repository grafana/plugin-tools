# plugin-crawler

A CLI tool for fetching information about Grafana plugins that belong under the `grafana` org on Github. This is mostly used for debugging purposes and to generate stats.

## Setup

**Install and build**

```bash
npm run install
npm run build
```

**Set a Github PAT**

A PAT is necessary to read any private repositories and to increase rate limits.

```bash
export GITHUB_PAT=$(gh auth token 2>/dev/null)
```

## Available commands

```bash
# List the places where extensions are used
grafana-plugins extensions

# Filter for certain type of extensions
grafana-plugins extensions --addedLinks
grafana-plugins extensions --addedComponents
grafana-plugins extensions --addedComponents --addedLinks
grafana-plugins extensions --extensionPoints
grafana-plugins extensions --exposedComponents

# Disable (and refresh) the local cache
grafana-plugins extensions --no-cache

# Output as JSON
grafana-plugins extensions --json

# Filter by plugin id
grafana-plugins extensions --pluginId="grafana-slo-app"
grafana-plugins extensions --pluginId="slo"

# List all available plugins
grafana-plugins plugins

# List only certain kind of plugins
grafana-plugins plugins --panel
grafana-plugins plugins --datasource
grafana-plugins plugins --app

grafana-plugins plugins --pluginId="slo"

# Filter by plugin.json
grafana-plugins plugins --pluginJsonFieldDefined "extensions.dependencies"
```

#### Rate limiting

[The rate limit for users authenticated with a PAT is 5000 requests / hour](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28#primary-rate-limit-for-authenticated-users). This means that the **ideal TTL for the cache is minimum 1 hour** (this should be fine in most cases, as we are generally not interested in changes that would happen in an hour, we are more interested in trends).
