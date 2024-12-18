import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import {
  customFields,
  generalConfig,
  plugins,
  presetsDocs,
  presetsTheme,
  themeConfigNavbar,
  themeConfigFooter,
  themeConfigPrism,
  themeConfigColorMode,
} from './docusaurus.config.base';

const devPortalHome = 'https://grafana-dev.com/developers';
const [docsFooterLinks, ...otherFooterLinks] = themeConfigFooter.links;
const gitHash = process.env.GITHUB_SHA || 'local';

const config: Config = {
  ...generalConfig,
  url: 'https://grafana-dev.com/',
  baseUrl: 'developers/plugin-tools/',
  plugins,
  presets: [
    [
      'classic',
      {
        docs: {
          ...presetsDocs,
          routeBasePath: '/',
        },
        theme: presetsTheme,
        blog: false,
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    navbar: {
      ...themeConfigNavbar,
      items: [
        { href: devPortalHome, label: 'Portal Home', position: 'right', target: '_self' },
        ...themeConfigNavbar.items,
      ],
    },
    footer: {
      ...themeConfigFooter,
      links: [
        {
          ...docsFooterLinks,
          items: [
            ...docsFooterLinks.items,
            {
              label: 'Portal Home',
              href: devPortalHome,
              target: '_self',
            },
          ],
        },
        ...otherFooterLinks,
      ],
    },
    prism: themeConfigPrism,
    colorMode: themeConfigColorMode,
  },

  customFields: {
    ...customFields,
    rudderStackTracking: {
      url: 'https://rs.grafana-dev.com',
      writeKey: '1w02fcWseyqcwsJA9CSKRkfEOfU',
      configUrl: 'https://rsc.grafana.com',
      sdkUrl: 'https://rsdk.grafana.com',
    },
    canSpamUrl: 'https://grafana-dev.com/canspam',
    faroConfig: {
      url: '/connect/af1fca71911a9641ebdffddb56889e97',
      appName: 'grafana-website',
      version: gitHash,
      environment: 'development',
    },
  },

  scripts: [
    // adobe target
    'https://grafana-dev.com/at.js',
  ],
};

export default config;
