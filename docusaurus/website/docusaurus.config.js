// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion
const {
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
      items: [{ href: devPortalHome, label: 'Portal Home', position: 'right' }, ...themeConfigNavbar.items],
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
              to: devPortalHome,
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
    rudderStackTracking: {
      url: 'https://rs.grafana.com',
      writeKey: '1sBAgwTlZ2K0zTzkM8YTWorZI00',
      configUrl: 'https://rsc.grafana.com',
      sdkUrl: 'https://rsdk.grafana.com',
    },
    canSpamUrl: 'https://grafana.com/canspam',
  },
};

module.exports = config;
