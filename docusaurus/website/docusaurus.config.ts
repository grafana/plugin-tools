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

const devPortalHome = 'https://grafana.com/developers';
const [docsFooterLinks, ...otherFooterLinks] = themeConfigFooter.links;
const gitHash = process.env.GITHUB_SHA || 'local';

const config: Config = {
  ...generalConfig,
  url: 'https://grafana.com/',
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
    announcementBar: {
      id: 'community_callout',
      content:
        '💬 Learn more and connect with fellow plugin developers in the <a href="https://community.grafana.com/c/plugin-development/30?utm_source=plugin-docs&utm_medium=banner&utm_campaign=community-announcement" target="_blank" rel="noopener">Grafana Community Forum</a>. Ask questions, share knowledge, and get support from the Grafana team and community.',
      backgroundColor: '#EC7E39',
      textColor: '#000',
      isCloseable: false,
    },
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
      url: 'https://rs.grafana.com',
      writeKey: '1sBAgwTlZ2K0zTzkM8YTWorZI00',
      configUrl: 'https://rsc.grafana.com',
      sdkUrl: 'https://rsdk.grafana.com',
    },
    canSpamUrl: 'https://grafana.com/canspam',
    faroConfig: {
      url: '/connect/af1fca71911a9641ebdffddb56889e97',
      appName: 'grafana-website',
      version: gitHash,
      environment: 'production',
    },
  },
  scripts: [
    // adobe target
    'https://grafana.com/at.js',
  ],
};

export default config;
