import { faro, LogLevel } from '@grafana/faro-web-sdk';
import { SEARCH_TRACKING_SOURCE } from './constants';

export function log(message: string, level: LogLevel) {
  const context = { source: SEARCH_TRACKING_SOURCE };
  faro?.api?.pushLog([message], { level, context });
}
