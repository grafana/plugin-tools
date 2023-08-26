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

/** @type {import('@docusaurus/types').Config} */
const config = {
  ...generalConfig,
  url: 'https://grafana.com/',
  baseUrl: 'developers/plugin-tools/',
  plugins,
  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          ...presetsDocs,
          routeBasePath: '/',
        },
        theme: presetsTheme,
        blog: false,
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: themeConfigNavbar,
      footer: themeConfigFooter,
      prism: themeConfigPrism,
      colorMode: themeConfigColorMode,
    }),
  
  customFields: {
    rudderStackTracking: {
      url: "https://rs.grafana.com",
      writeKey: "1sBAgwTlZ2K0zTzkM8YTWorZI00",
      configUrl: "https://rsc.grafana.com",
      sdkUrl: "https://rsdk.grafana.com",
    },
    canSpamUrl: "https://grafana.com/canspam",
  },
};

module.exports = config;
