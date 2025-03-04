### How does the search work?

**Goal:** Finding internal app plugins that are using extensions.


**Information we would like to see:**
- List what APIs they are using
  - `.addComponent()` - Registering a component
  - `.addLink()` - Registering a link
  - `.exposeComponent()` - Exposing a component
  - `usePluginComponents()` - Extension point (components)
  - `usePluginLinks()` - Extension point (links)
  - `usePluginComponent()` - Exposed component
- Check what they have in their plugin.json
- Check what plugins they are depending on
- Check if they are using any APIs that are not registered in their plugin.json


#### Rate limiting
[The rate limit for users authenticated with a PAT is 5000 requests / hour](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api?apiVersion=2022-11-28#primary-rate-limit-for-authenticated-users). This means that the **ideal TTL for the cache is minimum 1 hour** (this should be fine in most cases, as we are generally not interested in changes that would happen in an hour, we are more interested in trends).

How many requests do we generate?
```bash
# List ALL extension points
grafana-plugins extensions
#   ---> 4 types (added links, added components, extension points, exposed components)
#       ---> at least 4 requests / type (100 results / pages)
#           ---> 200 requests for plugin.json files (counting with 200 plugins)
#           ========================================================
#           ~216 requests to fetch almost all necessary information
#       
#           Most of this will come from the cache in the next hour, and any
#           utility function that calls these APIs under the hood will automatically
#           take them from the cache.
```

#### Commands
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
grafana-plugins extensions --pluginId="*slo*"

# List all available plugins
grafana-plugins plugins

# List only certain kind of plugins
grafana-plugins plugins --panel
grafana-plugins plugins --datasource
grafana-plugins plugins --app

grafana-plugins plugins --pluginId="*slo*"

# Filter by plugin.json
grafana-plugins plugins --pluginJsonFieldExists "extensions.dependencies" 
grafana-plugins plugins --pluginJsonFieldNotEmpty "extensions.dependencies"

# Returns plugins which are using certain extension APIs but don't have meta-info 
# recorded for them in their plugin.json
grafana-plugins inconsistencies --extensions 
```