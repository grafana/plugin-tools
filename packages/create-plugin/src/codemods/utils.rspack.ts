import type { Context } from './context.js';
import { readJsonFile } from './utils.js';

const ROOT_CPRC_PATH = '.config/.cprc.json';
const USER_CPRC_PATH = '.cprc.json';
const EXPERIMENTAL_RSPACK_FLAG = 'useExperimentalRspack';

interface CprcConfig {
  features?: Record<string, unknown>;
}

/**
 * Replaces the `useExperimentalRspack` feature flag with `useRspack` in `.config/.cprc.json`, and removes the old flag
 * from both config files. Every generated plugin's own `.cprc.json` carried the old flag as `false`, and that file
 * overrides `.config/.cprc.json`. `useRspack` is set when the old flag was on in either file, or when `enable` is true.
 * Files that need no change are left untouched.
 */
export function replaceExperimentalRspackFlag(context: Context, { enable }: { enable: boolean }): void {
  const wasRspack = [ROOT_CPRC_PATH, USER_CPRC_PATH].some(
    (path) => readCprc(context, path)?.features?.[EXPERIMENTAL_RSPACK_FLAG] === true
  );

  updateFeatures(context, USER_CPRC_PATH, (features) => withoutExperimentalFlag(features));
  updateFeatures(context, ROOT_CPRC_PATH, (features) => {
    const cleaned = withoutExperimentalFlag(features);
    return enable || wasRspack ? { ...cleaned, useRspack: true } : cleaned;
  });
}

function readCprc(context: Context, path: string): CprcConfig | undefined {
  if (!context.doesFileExist(path)) {
    return undefined;
  }
  return readJsonFile<CprcConfig>(context, path);
}

function updateFeatures(
  context: Context,
  path: string,
  update: (features: Record<string, unknown>) => Record<string, unknown>
): void {
  const config = readCprc(context, path);
  if (!config) {
    return;
  }

  const features = config.features ?? {};
  const updatedFeatures = update(features);
  if (JSON.stringify(updatedFeatures) === JSON.stringify(features)) {
    return;
  }

  context.updateFile(path, JSON.stringify({ ...config, features: updatedFeatures }, null, 2));
}

function withoutExperimentalFlag(features: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(features).filter(([name]) => name !== EXPERIMENTAL_RSPACK_FLAG));
}
