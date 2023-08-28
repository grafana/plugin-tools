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

const devPortalHome = 'https://grafana-dev.com/developers';

// @ts-ignore
themeConfigFooter.links[0].items.push({
  label: 'Portal Home',
  to: devPortalHome,
});

themeConfigNavbar.items.unshift({ href: devPortalHome, label: 'Portal Home', position: 'right' });

/** @type {import('@docusaurus/types').Config} */
const config = {
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
      },
    ],
  ],

  themeConfig: {
    navbar: themeConfigNavbar,
    footer: themeConfigFooter,
    prism: themeConfigPrism,
    colorMode: themeConfigColorMode,
  },

  customFields: {
    rudderStackTracking: {
      url: 'https://rs.grafana-dev.com',
      writeKey: '1w02fcWseyqcwsJA9CSKRkfEOfU',
      configUrl: 'https://rsc.grafana.com',
      sdkUrl: 'https://rsdk.grafana.com',
    },
    canSpamUrl: 'https://grafana-dev.com/canspam',
  },
};

module.exports = config;
