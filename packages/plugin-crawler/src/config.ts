import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));

// Default configuration
let config = {
  cacheTtl: 3600000, //in ms (1 hour)
  cachePath: process.env.CACHE_PATH || path.resolve(path.join(__dirname, '../cache.sqlite')),
  githubPat: process.env.GITHUB_PAT,
  org: 'grafana',
  clearCache: false,
  // These repos are not meant to be production plugins, so we are ignoring them by default.
  // (run the commands with `--no-filter` to stop ignoring these).
  ignoredRepos: [
    'grafana/plugins-platform-plugin',
    'grafana/grafana-pluginsplatformprovisioned-app',
    'grafana/scenes-app-template',
    'grafana/grafana-crowdin-test',
    'grafana/grafana-ci-sandbox',
    'grafana/grafana-security-mirror',
    'grafana/plugin-validator',
    'grafana/plugins-cdn-tools',
    'grafana/build-pipeline',
  ],
  // We are looking for these words in the plugin-id or the repo-name to filter out plugins that are not meant to be for production.
  // (run the commands with `--no-filter` to stop ignoring these).
  ignoredWords: ['test', 'spec', 'mock', 'e2e', 'fixture', 'example', 'tutorial', 'dummy', 'training', 'demo'],
};

if (!config.githubPat) {
  console.error('GITHUB_PAT environment variable is required');
  process.exit(1);
}

export const setConfig = (newConfig: Partial<typeof config>) => {
  config = { ...config, ...newConfig };
};

export const getConfig = () => config;
