// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion
const {
  customFields,
  generalConfig,
  plugins,
  presetsDocs,
  presetsTheme,
  themeConfigNavbar,
  themeConfigFooter,
  themeConfigPrism,
  themeConfigColorMode,
} = require('./docusaurus.config.base');

const devPortalHome = 'https://grafana.com/developers';
const [docsFooterLinks, ...otherFooterLinks] = themeConfigFooter.links;
const gitHash = process.env.GITHUB_SHA || 'local';

/** @type {import('@docusaurus/types').Config} */
const config = {
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
      },
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
      environment: process.env.NODE_ENV,
    },
  },
};

module.exports = config;
