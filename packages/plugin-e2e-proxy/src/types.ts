export const PROXY_MODES = ['record', 'replay'] as const;
export type ProxyMode = (typeof PROXY_MODES)[number];

export const FAKE_KINDS = ['email', 'username', 'name', 'ip', 'string'] as const;
export type FakeKind = (typeof FAKE_KINDS)[number];

export const PRESETS = ['aws'] as const;
export type Preset = (typeof PRESETS)[number];

export interface ProxyConfig {
  /** Hosts to record and replay. Exact names or a leading `*.` wildcard. */
  hosts: string[];
  /** Request headers that are stored and compared when matching. */
  keepHeaders: string[];
  /** Response headers that are stored and replayed. */
  keepResponseHeaders: string[];
  /** JSON or form body fields that are left out when matching, at any depth. */
  ignoreFields: string[];
  /** Query params that are left out when matching. */
  ignoreQueryParams: string[];
  /** Query params whose value is a credential by convention, redacted even when it isn't a known secret. */
  credentialQueryParams: string[];
  /** `host/path` prefixes whose request body is left out when matching. */
  ignoreBodyFor: string[];
  /** Response JSON fields replaced with `REDACTED`, at any depth. */
  redactFields: string[];
  /** Response JSON fields replaced with a stable fake value, at any depth. */
  fakeFields: Record<string, FakeKind>;
  /** Extra env vars whose values are scrubbed, on top of those found in provisioning. */
  secretEnvVars: string[];
  /**
   * Field names whose string values, once seen in a response, are treated as secrets and
   * scrubbed everywhere from then on (tokens issued mid-session: OAuth, STS, ...).
   */
  learnSecretFields: string[];
}

export interface HarNameValue {
  name: string;
  value: string;
}

export interface HarRequest {
  method: string;
  url: string;
  httpVersion: string;
  headers: HarNameValue[];
  queryString: HarNameValue[];
  cookies: HarNameValue[];
  headersSize: number;
  bodySize: number;
  postData?: {
    mimeType: string;
    text: string;
  };
}

export interface HarResponse {
  status: number;
  statusText: string;
  httpVersion: string;
  headers: HarNameValue[];
  cookies: HarNameValue[];
  content: {
    size: number;
    mimeType: string;
    text: string;
    encoding?: 'base64';
  };
  redirectURL: string;
  headersSize: number;
  bodySize: number;
}

export interface HarEntry {
  startedDateTime: string;
  time: number;
  request: HarRequest;
  response: HarResponse;
  cache: Record<string, never>;
  timings: {
    send: number;
    wait: number;
    receive: number;
  };
}

export interface Har {
  log: {
    version: string;
    creator: {
      name: string;
      version: string;
    };
    entries: HarEntry[];
  };
}

export interface CapturedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body: Buffer;
}

export interface CapturedResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: Buffer;
}

export interface Miss {
  method: string;
  url: string;
  closest?: {
    url: string;
    differences: string[];
  };
}

export interface ProxyStats {
  matched: number;
  missed: number;
  recorded: number;
  passthrough: number;
}

export interface ProxyStatus {
  mode: ProxyMode;
  hosts: string[];
  stats: ProxyStats;
}

export interface Finding {
  file: string;
  entry: number;
  location: string;
  rule: string;
  preview: string;
}

export interface SaveSummary {
  files: string[];
  entries: number;
  scrubbed: Record<string, number>;
  findings: Finding[];
  quarantined: string[];
}
