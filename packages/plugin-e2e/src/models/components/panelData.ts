export const E2E_DATA_PANEL_ID = 'grafana-e2edata-panel';
export const E2E_DATA_PANEL_TESTID = 'data-testid e2e-data-panel';
export const E2E_DATA_PANEL_JSON_TESTID = 'data-testid e2e-data-panel-json';
export const SUPPORTED_PANEL_DATA_SCHEMA_VERSIONS = [1];

export interface PanelDataLink {
  title?: string;
  url?: string;
  internal?: { datasourceUid?: string };
}

export interface PanelDataFieldConfig {
  unit?: string;
  displayName?: string;
  displayNameFromDS?: string;
  decimals?: number;
  min?: number;
  max?: number;
  interval?: number;
  links?: PanelDataLink[];
}

export interface PanelDataField {
  name: string;
  displayName: string;
  type: string;
  labels?: Record<string, string>;
  config: PanelDataFieldConfig;
  values: unknown[];
}

export interface PanelDataFrameMeta {
  type?: string;
  preferredVisualisationType?: string;
  notices?: unknown[];
  custom?: Record<string, unknown>;
}

export interface PanelDataFrame {
  refId?: string;
  name?: string;
  length: number;
  meta?: PanelDataFrameMeta;
  fields: PanelDataField[];
}

export interface PanelDataError {
  refId?: string;
  message?: string;
  status?: number;
}

/**
 * The data a panel received, as serialised by the grafana-e2edata-panel panel plugin.
 *
 * @alpha - the API is not yet stable and may change without a major version bump. Use with caution.
 */
export interface PanelData {
  schemaVersion: number;
  requestId?: string;
  state: string;
  errors: PanelDataError[];
  series: PanelDataFrame[];
}

export interface GetPanelDataOptions {
  /**
   * Loading states to wait for before reading the data. Defaults to `['Done', 'Error']`.
   * Pass `['Streaming']` for live or polling data sources.
   */
  states?: string[];
  timeout?: number;
}

export function parsePanelData(json: string | null, panelDescription: string): PanelData {
  let data: PanelData;
  try {
    data = JSON.parse(json ?? '');
  } catch {
    throw new Error(`Could not parse the data of ${panelDescription}. Is it using the ${E2E_DATA_PANEL_ID} panel?`);
  }
  if (!SUPPORTED_PANEL_DATA_SCHEMA_VERSIONS.includes(data?.schemaVersion)) {
    throw new Error(
      `${panelDescription} uses schema version ${data?.schemaVersion}, but this version of @grafana/plugin-e2e supports ${SUPPORTED_PANEL_DATA_SCHEMA_VERSIONS.join(', ')}. Use a matching version of ${E2E_DATA_PANEL_ID}.`
    );
  }
  return data;
}
