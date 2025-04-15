/**
 * The plugin.json file is required for all plugins. When Grafana starts, it scans the
 * plugin folders and mounts every folder that contains a plugin.json file unless the folder
 * contains a subfolder named dist. In that case, Grafana mounts the dist folder instead.
 */
export interface PluginSchema {
  /**
   * Schema definition for the plugin.json file. Used primarily for schema validation.
   */
  $schema?: string;
  /**
   * For data source plugins, if the plugin supports alerting. Requires `backend` to be set to
   * `true`.
   */
  alerting?: boolean;
  /**
   * For data source plugins, if the plugin supports annotation queries.
   */
  annotations?: boolean;
  /**
   * Set to true for app plugins that should be enabled and pinned to the navigation bar in
   * all orgs.
   */
  autoEnabled?: boolean;
  /**
   * If the plugin has a backend component.
   */
  backend?: boolean;
  /**
   * The build mode of the plugin. This field is set automatically at build time, so it should
   * not be provided manually.
   */
  buildMode?: string;
  /**
   * [internal only] Indicates whether the plugin is developed and shipped as part of Grafana.
   * Also known as a 'core plugin'.
   */
  builtIn?: boolean;
  /**
   * Plugin category used on the Add data source page.
   */
  category?: Category;
  /**
   * Dependency information related to Grafana and other plugins.
   */
  dependencies: Dependencies;
  /**
   * Grafana Enterprise specific features
   */
  enterpriseFeatures?: EnterpriseFeatures;
  /**
   * The first part of the file name of the backend component executable. There can be
   * multiple executables built for different operating system and architecture. Grafana will
   * check for executables named `<executable>_<$GOOS>_<lower case $GOARCH><.exe for
   * Windows>`, e.g. `plugin_linux_amd64`. Combination of $GOOS and $GOARCH can be found here:
   * https://golang.org/doc/install/source#environment.
   */
  executable?: string;
  /**
   * Plugin extensions are a way to extend either the UI of core Grafana or other plugins.
   */
  extensions?: PluginSchemaExtensions;
  /**
   * [internal only] Excludes the plugin from listings in Grafana's UI. Only allowed for
   * `builtIn` plugins.
   */
  hideFromList?: boolean;
  /**
   * Identity and Access Management.
   */
  iam?: Iam;
  /**
   * Unique name of the plugin. If the plugin is published on grafana.com, then the plugin
   * `id` has to follow the naming conventions.
   */
  id: string;
  /**
   * Resources to include in plugin.
   */
  includes?: Include[];
  /**
   * Metadata for the plugin. Some fields are used on the plugins page in Grafana and others
   * on grafana.com if the plugin is published.
   */
  info: Info;
  /**
   * For data source plugins, if the plugin supports logs. It may be used to filter logs only
   * features.
   */
  logs?: boolean;
  /**
   * For data source plugins, if the plugin supports metric queries. Used to enable the plugin
   * in the panel editor.
   */
  metrics?: boolean;
  /**
   * For data source plugins, if the plugin supports multi value operators in adhoc filters.
   */
  multiValueFilterOperators?: boolean;
  /**
   * Human-readable name of the plugin that is shown to the user in the UI.
   */
  name: string;
  /**
   * [internal only] The PascalCase name for the plugin. Used for creating machine-friendly
   * identifiers, typically in code generation. If not provided, defaults to name, but
   * title-cased and sanitized (only alphabetical characters allowed).
   */
  pascalName?: string;
  /**
   * Initialize plugin on startup. By default, the plugin initializes on first use. Useful for
   * app plugins that should load without user interaction.
   */
  preload?: boolean;
  /**
   * For data source plugins. There is a query options section in the plugin's query editor
   * and these options can be turned on if needed.
   */
  queryOptions?: QueryOptions;
  /**
   * List of RBAC roles and their default assignments.
   */
  roles?: RoleElement[];
  /**
   * For data source plugins. Proxy routes used for plugin authentication and adding headers
   * to HTTP requests made by the plugin. For more information, refer to [Authentication for
   * data source
   * plugins](https://grafana.com/developers/plugin-tools/how-to-guides/data-source-plugins/add-authentication-for-data-source-plugins).
   */
  routes?: Route[];
  /**
   * For panel plugins. Hides the query editor.
   */
  skipDataQuery?: boolean;
  /**
   * Marks a plugin as a pre-release.
   */
  state?: State;
  /**
   * For data source plugins, if the plugin supports streaming. Used in Explore to start live
   * streaming.
   */
  streaming?: boolean;
  /**
   * For data source plugins, if the plugin supports tracing. Used for example to link logs
   * (e.g. Loki logs) with tracing plugins.
   */
  tracing?: boolean;
  /**
   * Plugin type.
   */
  type: PluginSchemaType;
}

/**
* Plugin category used on the Add data source page.
*/
export type Category = "tsdb" | "logging" | "cloud" | "tracing" | "profiling" | "sql" | "enterprise" | "iot" | "other";

/**
* Dependency information related to Grafana and other plugins.
*/
export interface Dependencies {
  /**
   * Plugin extensions that this plugin depends on.
   */
  extensions?: DependenciesExtensions;
  /**
   * Required Grafana version for this plugin. Validated using
   * https://github.com/npm/node-semver.
   */
  grafanaDependency: string;
  /**
   * (Deprecated) Required Grafana version for this plugin, e.g. `6.x.x 7.x.x` to denote
   * plugin requires Grafana v6.x.x or v7.x.x.
   */
  grafanaVersion?: string;
  /**
   * An array of required plugins on which this plugin depends. Only non-core (that is,
   * external plugins) have to be specified in this list.
   */
  plugins?: Plugin[];
}

/**
* Plugin extensions that this plugin depends on.
*/
export interface DependenciesExtensions {
  /**
   * An array of exposed component ids that this plugin depends on.
   */
  exposedComponents?: string[];
}

/**
* Plugin dependency. Used to display information about plugin dependencies in the Grafana
* UI.
*/
export interface Plugin {
  id:   string;
  name: string;
  type: PluginType;
}

export type PluginType = "app" | "datasource" | "panel";

/**
* Grafana Enterprise specific features
*/
export interface EnterpriseFeatures {
  /**
   * Enable/Disable health diagnostics errors. Requires Grafana >=7.5.5.
   */
  healthDiagnosticsErrors?: boolean;
}

/**
* Plugin extensions are a way to extend either the UI of core Grafana or other plugins.
*/
export interface PluginSchemaExtensions {
  /**
   * Any component extensions that your plugin registers to extension points.
   */
  addedComponents?: AddedComponent[];
  /**
   * Any link extensions that your plugin registers to extension points.
   */
  addedLinks?: AddedLink[];
  /**
   * Any React component that your plugin exposes so it can be reused by other app plugins.
   */
  exposedComponents?: ExposedComponent[];
  /**
   * Any extension points that your plugin provides.
   */
  extensionPoints?: ExtensionPoint[];
}

export interface AddedComponent {
  /**
   * Additional information about your component extension.
   */
  description?: string;
  /**
   * The list of the targeted extension point ids that the component is added to.
   */
  targets: string[];
  /**
   * An informative title for your component extension.
   */
  title: string;
}

export interface AddedLink {
  /**
   * Additional information about your link extension.
   */
  description?: string;
  /**
   * The list of the targeted extension point ids that the link is added to.
   */
  targets: string[];
  /**
   * An informative title for your link extension.
   */
  title: string;
}

export interface ExposedComponent {
  /**
   * Additional information about your exposed component.
   */
  description?: string;
  /**
   * A unique identifier for your exposed component. This is used to reference the component
   * in other plugins. It must be in the following format: '{PLUGIN_ID}/name-of-component/v1'.
   */
  id: string;
  /**
   * An informative title for your exposed component.
   */
  title?: string;
}

export interface ExtensionPoint {
  /**
   * Additional information about your extension point.
   */
  description?: string;
  /**
   * A unique identifier for your extension point. This is used to reference the extension
   * point in other plugins. It must be in the following format:
   * '{PLUGIN_ID}/name-of-my-extension-point/v1'.
   */
  id: string;
  /**
   * An informative title for your extension point.
   */
  title?: string;
}

/**
* Identity and Access Management.
*/
export interface Iam {
  /**
   * Permissions are the permissions that the plugin needs its associated service account to
   * have
   */
  permissions?: IamPermission[];
}

export interface IamPermission {
  action?: string;
  scope?:  string;
}

export interface Include {
  /**
   * The RBAC action a user must have to see this page in the navigation menu.
   */
  action?: string;
  /**
   * Add the include to the navigation menu.
   */
  addToNav?: boolean;
  /**
   * (Legacy) The Angular component to use for a page.
   */
  component?: string;
  /**
   * Page or dashboard when user clicks the icon in the side menu.
   */
  defaultNav?: boolean;
  /**
   * Icon to use in the side menu. For information on available icon, refer to [Icons
   * Overview](https://developers.grafana.com/ui/latest/index.html?path=/story/docs-overview-icon--icons-overview).
   */
  icon?: string;
  name?: string;
  /**
   * Used for app plugins.
   */
  path?: string;
  /**
   * The minimum role a user must have to see this page in the navigation menu.
   */
  role?: RoleType;
  type?: IncludeType;
  /**
   * Unique identifier of the included resource
   */
  uid?: string;
}

/**
* The minimum role a user must have to see this page in the navigation menu.
*/
export type RoleType = "Admin" | "Editor" | "Viewer";

export type IncludeType = "dashboard" | "page" | "panel" | "datasource";

/**
* Metadata for the plugin. Some fields are used on the plugins page in Grafana and others
* on grafana.com if the plugin is published.
*/
export interface Info {
  /**
   * Information about the plugin author.
   */
  author?: Author;
  /**
   * Build information
   */
  build?: Build;
  /**
   * Description of plugin. Used on the plugins page in Grafana and for search on grafana.com.
   */
  description?: string;
  /**
   * Array of plugin keywords. Used for search on grafana.com.
   */
  keywords: string[];
  /**
   * An array of link objects to be displayed on this plugin's project page in the form
   * `{name: 'foo', url: 'http://example.com'}`
   */
  links?: Link[];
  /**
   * SVG images that are used as plugin icons.
   */
  logos: Logos;
  /**
   * An array of screenshot objects in the form `{name: 'bar', path: 'img/screenshot.png'}`
   */
  screenshots?: Screenshot[];
  /**
   * Date when this plugin was built.
   */
  updated: string;
  /**
   * Project version of this commit, e.g. `6.7.x`.
   */
  version: string;
}

/**
* Information about the plugin author.
*/
export interface Author {
  /**
   * Author's name.
   */
  email?: string;
  /**
   * Author's name.
   */
  name?: string;
  /**
   * Link to author's website.
   */
  url?: string;
}

/**
* Build information
*/
export interface Build {
  /**
   * Git branch the plugin was built from.
   */
  branch?: string;
  /**
   * Build job number used to build this plugin.
   */
  build?: number;
  /**
   * Git hash of the commit the plugin was built from
   */
  hash?:   string;
  number?: number;
  /**
   * GitHub pull request the plugin was built from
   */
  pr?:   number;
  repo?: string;
  /**
   * Time when the plugin was built, as a Unix timestamp.
   */
  time?: number;
}

export interface Link {
  name?: string;
  url?:  string;
}

/**
* SVG images that are used as plugin icons.
*/
export interface Logos {
  /**
   * Link to the "large" version of the plugin logo, which must be an SVG image. "Large" and
   * "small" logos can be the same image.
   */
  large: string;
  /**
   * Link to the "small" version of the plugin logo, which must be an SVG image. "Large" and
   * "small" logos can be the same image.
   */
  small: string;
}

export interface Screenshot {
  name?: string;
  path?: string;
}

/**
* For data source plugins. There is a query options section in the plugin's query editor
* and these options can be turned on if needed.
*/
export interface QueryOptions {
  /**
   * For data source plugins. If the `cache timeout` option should be shown in the query
   * options section in the query editor.
   */
  cacheTimeout?: boolean;
  /**
   * For data source plugins. If the `max data points` option should be shown in the query
   * options section in the query editor.
   */
  maxDataPoints?: boolean;
  /**
   * For data source plugins. If the `min interval` option should be shown in the query
   * options section in the query editor.
   */
  minInterval?: boolean;
}

export interface RoleElement {
  /**
   * Default assignments of the role to Grafana basic roles (Viewer, Editor, Admin, Grafana
   * Admin)
   */
  grants?: string[];
  /**
   * RBAC role definition to bundle related RBAC permissions on the plugin.
   */
  role?: RoleRole;
}

/**
* RBAC role definition to bundle related RBAC permissions on the plugin.
*/
export interface RoleRole {
  /**
   * Describe the aim of the role.
   */
  description?: string;
  /**
   * Display name of the role.
   */
  name?: string;
  /**
   * RBAC permission on the plugin.
   */
  permissions?: RolePermission[];
}

export interface RolePermission {
  action?: string;
  scope?:  string;
}

/**
* For data source plugins. Proxy routes used for plugin authentication and adding headers
* to HTTP requests made by the plugin. For more information, refer to [Authentication for
* data source
* plugins](https://grafana.com/developers/plugin-tools/how-to-guides/data-source-plugins/add-authentication-for-data-source-plugins).
*/
export interface Route {
  /**
   * For data source plugins. Route headers set the body content and length to the proxied
   * request.
   */
  body?: { [key: string]: any };
  /**
   * For data source plugins. Route headers adds HTTP headers to the proxied request.
   */
  headers?: any[];
  /**
   * For data source plugins. Token authentication section used with an JWT OAuth API.
   */
  jwtTokenAuth?: JwtTokenAuth;
  /**
   * For data source plugins. Route method matches the HTTP verb like GET or POST. Multiple
   * methods can be provided as a comma-separated list.
   */
  method?: string;
  /**
   * For data source plugins. The route path that is replaced by the route URL field when
   * proxying the call.
   */
  path?: string;
  /**
   * The RBAC action a user must have to use this route.
   */
  reqAction?:   string;
  reqRole?:     string;
  reqSignedIn?: boolean;
  /**
   * For data source plugins. Token authentication section used with an OAuth API.
   */
  tokenAuth?: TokenAuth;
  /**
   * For data source plugins. Route URL is where the request is proxied to.
   */
  url?: string;
  /**
   * Add URL parameters to a proxy route
   */
  urlParams?: URLParam[];
}

/**
* For data source plugins. Token authentication section used with an JWT OAuth API.
*/
export interface JwtTokenAuth {
  /**
   * Parameters for the JWT token authentication request.
   */
  params?: ParamsClass;
  /**
   * The list of scopes that your application should be granted access to.
   */
  scopes?: string[];
  /**
   * URL to fetch the JWT token.
   */
  url?: string;
}

/**
* Parameters for the JWT token authentication request.
*/
export interface ParamsClass {
  client_email?: string;
  private_key?:  string;
  token_uri?:    string;
}

/**
* For data source plugins. Token authentication section used with an OAuth API.
*/
export interface TokenAuth {
  /**
   * Parameters for the token authentication request.
   */
  params?: ParamsObject;
  /**
   * The list of scopes that your application should be granted access to.
   */
  scopes?: string[];
  /**
   * URL to fetch the authentication token.
   */
  url?: string;
}

/**
* Parameters for the token authentication request.
*/
export interface ParamsObject {
  /**
   * OAuth client ID
   */
  client_id?: string;
  /**
   * OAuth client secret. Usually populated by decrypting the secret from the SecureJson blob.
   */
  client_secret?: string;
  /**
   * OAuth grant type
   */
  grant_type?: string;
  /**
   * OAuth resource
   */
  resource?: string;
}

export interface URLParam {
  /**
   * Value of the URL parameter
   */
  content?: string;
  /**
   * Name of the URL parameter
   */
  name?: string;
}

/**
* Marks a plugin as a pre-release.
*/
export type State = "alpha" | "beta";

/**
* Plugin type.
*/
export type PluginSchemaType = "app" | "datasource" | "panel" | "renderer";

