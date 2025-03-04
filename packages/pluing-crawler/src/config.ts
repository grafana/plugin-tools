import path from 'node:path';

// Default configuration
let config = {
  cacheTtl: 1800000, //in ms (30 minutes)
  cachePath: process.env.CACHE_PATH || path.resolve('../cache.sqlite'),
  githubPat: process.env.GITHUB_PAT,
  org: 'grafana',
  clearCache: false,
  // These repos don't contain "actual" plugins and produce noise
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
