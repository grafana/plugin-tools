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


// Replace docs link in footer so builds don't have broken links.
const [docs, ...rest] = themeConfigFooter.links;
const footerConfig = {
  ...themeConfigFooter,
  links: [
    {
      title: 'Docs',
      items: [
        {
          label: 'Get Started',
          to: '/',
        },
      ],
    },
    ...rest,
  ],
};

/** @type {import('@docusaurus/types').Config} */
const config = {
  ...generalConfig,
  url: 'https://grafana-dev.com/',
  baseUrl: 'developers/plugin-tools/',

  plugins: plugins,

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
      footer: footerConfig,
      prism: themeConfigPrism,
      colorMode: themeConfigColorMode,
    }),
};

module.exports = config;
