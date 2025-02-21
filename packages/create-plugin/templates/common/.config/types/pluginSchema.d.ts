/**
 * This file contains TypeScript interfaces for the Grafana plugin.json schema
 * @see https://grafana.com/developers/plugin-tools/reference-plugin-json
 */

export interface PluginSchemaMetadata {
  /** Unique name of the plugin [required] */
  id: string;

  /** Human-readable name shown in the UI [required] */
  name: string;

  /** Plugin type [required] */
  type: 'app' | 'datasource' | 'panel' | 'renderer' | 'secretsmanager';

  /** Plugin metadata [required] */
  info: PluginSchemaInfo;

  /** Dependencies information [required] */
  dependencies: PluginSchemaDependencies;

  /** Schema definition for the plugin.json file. Used primarily for schema validation. */
  $schema?: string;

  /** For data source plugins, if the plugin supports alerting. Requires backend to be set to true. */
  alerting?: boolean;

  /** For data source plugins, if the plugin supports annotation queries. */
  annotations?: boolean;

  /** Set to true for app plugins that should be enabled and pinned to the navigation bar in all orgs. */
  autoEnabled?: boolean;

  /** Backend configuration */
  backend?: boolean;

  /** Plugin category */
  category?: 'tsdb' | 'logging' | 'cloud' | 'tracing' | 'profiling' | 'sql' | 'enterprise' | 'iot' | 'other';

  /** Grafana Enterprise specific features */
  enterpriseFeatures?: PluginSchemaEnterpriseFeatures;

  /** Backend executable name */
  executable?: string;

  /** Initialize a service account for the plugin */
  iam?: PluginSchemaIAM;

  /** Resources to include */
  includes?: PluginSchemaInclude[];

  /** For data source plugins, if the plugin supports logs */
  logs?: boolean;

  /** For data source plugins, if the plugin supports metrics */
  metrics?: boolean;

  /** For data source plugins, if the plugin supports multi value operators in adhoc filters */
  multiValueFilterOperators?: boolean;

  /** Initialize plugin on startup */
  preload?: boolean;

  /** Query options configuration */
  queryOptions?: PluginSchemaQueryOptions;

  /** List of RBAC roles and their default assignments */
  roles?: PluginSchemaRole[];

  /** Routes for plugin authentication */
  routes?: PluginSchemaRoute[];

  /** Skip data query for panel plugins */
  skipDataQuery?: boolean;

  /** Mark plugin as pre-release */
  state?: 'alpha' | 'beta';

  /** If the plugin supports streaming */
  streaming?: boolean;

  /** If the plugin supports tracing */
  tracing?: boolean;

  /** Extensions related meta-info */
  extensions?: PluginSchemaExtensions;
}

export interface PluginSchemaAuthor {
  /** Author name */
  name: string;
  /** Author email */
  email?: string;
  /** Author URL */
  url?: string;
}

export interface PluginSchemaLogos {
  /** Small logo path */
  small: string;
  /** Large logo path */
  large: string;
}

export interface PluginSchemaScreenshot {
  /** Screenshot name */
  name: string;
  /** Screenshot path */
  path: string;
}

export interface PluginSchemaLink {
  /** Link name */
  name: string;
  /** Link URL */
  url: string;
}

export interface PluginSchemaStatus {
  /** Status logo */
  logo?: string;
  /** Status message */
  message?: string;
}

export interface PluginSchemaDependencyInfo {
  /** Plugin ID */
  id: string;
  /** Plugin name */
  name: string;
  /** Required version */
  version: string;
}

export interface PluginSchemaAuthParams {
  /** URL for authentication */
  url: string;
  /** Parameters for authentication */
  params: Record<string, string>;
}

export interface PluginSchemaExtensionLink {
  /** Link title */
  title: string;
  /** Link description */
  description?: string;
  /** Link path */
  path: string;
  /** Required role */
  role?: string;
  /** Extension icon */
  icon?: string;
}

export interface PluginSchemaInfo {
  /** Plugin description */
  description?: string;
  /** Plugin author */
  author: PluginSchemaAuthor;
  /** Plugin keywords */
  keywords: string[];
  /** Plugin logos */
  logos: PluginSchemaLogos;
  /** Screenshots */
  screenshots?: PluginSchemaScreenshot[];
  /** Plugin version */
  version: string;
  /** Last updated date */
  updated: string;
  /** Links */
  links?: PluginSchemaLink[];
  /** Plugin status */
  status?: PluginSchemaStatus;
}

export interface PluginSchemaDependencies {
  /** Required Grafana version */
  grafanaDependency: string;
  /** Required plugins */
  plugins?: PluginSchemaDependencyInfo[];
}

export interface PluginSchemaInclude {
  /** Name of the included resource */
  name: string;
  /** Path to the included resource */
  path: string;
  /** Type of the included resource */
  type: 'page' | 'dashboard' | 'panel';
  /** Role required to access the resource */
  role?: string;
  /** Add to navigation */
  addToNav?: boolean;
  /** Set as default navigation */
  defaultNav?: boolean;
  /** Icon name */
  icon?: string;
  /** Description of the included resource */
  description?: string;
}

export interface PluginSchemaRoute {
  /** Route path */
  path: string;
  /** Route method */
  method?: string;
  /** URL to proxy to */
  url?: string;
  /** Headers to add to the request */
  headers?: Record<string, string>;
  /** Body to add to the request */
  body?: Record<string, unknown>;
  /** Required role for accessing the route */
  reqRole?: string;
  /** Alternative role property */
  role?: string;
  /** Token authentication method (mutually exclusive with jwtTokenAuth) */
  tokenAuth?: PluginSchemaAuthParams;
  /** JWT authentication configuration (mutually exclusive with tokenAuth) */
  jwtTokenAuth?: PluginSchemaAuthParams;
}

export interface PluginSchemaExtensions {
  /** Link extensions */
  link?: PluginSchemaExtensionLink[];
}

export interface PluginSchemaPermission {
  /** Action, for example: teams:read */
  action: string;
  /** Scope, e.g: teams:* */
  scope?: string;
}

export interface PluginSchemaIAM {
  /** Required RBAC permissions to query Grafana. */
  permissions?: PluginSchemaPermission[];
}

export interface PluginSchemaEnterpriseFeatures {
  /** Enable/Disable health diagnostics errors. Requires Grafana >=7.5.5. */
  healthDiagnosticsErrors?: boolean;
}

export interface PluginSchemaQueryOptions {
  /** Support maxDataPoints */
  maxDataPoints?: boolean;
  /** Support minInterval */
  minInterval?: boolean;
  /** Support cacheTimeout */
  cacheTimeout?: boolean;
}

export interface PluginSchemaRoleDefinition {
  /** Name of the role */
  name: string;
  /** Describes the aim of the role */
  description?: string;
  /** RBAC permission on the plugin */
  permissions?: PluginSchemaPermission[];
}

export interface PluginSchemaRole {
  /** RBAC role definition */
  role: PluginSchemaRoleDefinition;
  /** Default assignments of the role to Grafana basic roles */
  grant?: string[];
}
