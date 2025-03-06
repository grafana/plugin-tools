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
  ignoredRepos: [
    'grafana/grafana-crowdin-test',
    'grafana/grafana-ci-sandbox',
    'grafana/grafana-security-mirror',
    'grafana/plugin-validator',
    'grafana/plugins-cdn-tools',
    'grafana/build-pipeline',
  ],
};

if (!config.githubPat) {
  console.error('GITHUB_PAT environment variable is required');
  process.exit(1);
}

export const setConfig = (newConfig: Partial<typeof config>) => {
  config = { ...config, ...newConfig };
};

export const getConfig = () => config;
