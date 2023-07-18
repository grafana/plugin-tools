// @ts-check
// Note: type annotations allow type checking and IDEs autocompletion

const lightCodeTheme = require('prism-react-renderer/themes/github');
const darkCodeTheme = require('prism-react-renderer/themes/dracula');
const path = require('path');
const remark = require('remark');
const stripHTML = require('remark-strip-html');

/** @type {import('@docusaurus/types').Config} */
const config = {
  title: 'Grafana Plugin Tools',
  tagline: 'Scaffold a Grafana plugin by running one command',
  url: 'https://grafana.github.io/',
  baseUrl: 'plugin-tools/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.png',
  noIndex: true,
  // GitHub pages deployment config.
  // If you aren't using GitHub pages, you don't need these.
  organizationName: 'grafana', // Usually your GitHub org/user name.
  projectName: 'plugin-tools', // Usually your repo name.

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  plugins: [
    [
      './plugins/docusaurus-custom-webpack-plugin',
      {
        resolve: {
          alias: {
            '@snippets': path.resolve(__dirname, '..', 'docs', 'snippets'),
          },
        },
      },
    ],
  ],

  presets: [
    [
      'classic',
      /** @type {import('@docusaurus/preset-classic').Options} */
      ({
        docs: {
          path: '../docs',
          exclude: ['**/snippets/**'],
          sidebarPath: require.resolve('./sidebars.js'),
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/grafana/plugin-tools/edit/main/docusaurus/website',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
      }),
    ],
  ],

  themeConfig:
    /** @type {import('@docusaurus/preset-classic').ThemeConfig} */
    ({
      navbar: {
        title: 'Grafana Plugin Tools',
        logo: {
          alt: 'Grafana Logo',
          src: 'img/logo.svg',
        },
        items: [
          {
            type: 'doc',
            docId: 'getting-started',
            position: 'right',
            label: 'Docs',
          },
          { href: 'https://community.grafana.com/c/plugin-development/30', label: 'Help', position: 'right' },
          {
            href: 'https://www.github.com/grafana/plugin-tools',
            label: 'GitHub',
            position: 'right',
          },
        ],
      },
      footer: {
        style: 'dark',
        links: [
          {
            title: 'Docs',
            items: [
              {
                label: 'Get Started',
                to: '/docs/Get started/get-started',
              },
            ],
          },
          {
            title: 'Community',
            items: [
              {
                label: 'Stack Overflow',
                href: 'https://stackoverflow.com/questions/tagged/grafana',
              },
              {
                label: 'Github Discussions',
                href: 'https://www.github.com/grafana/plugin-tools/discussions',
              },
              {
                label: 'Grafana Community Forums',
                href: 'https://community.grafana.com/c/plugin-development/30',
              },
            ],
          },
          {
            title: 'Social',
            items: [
              {
                label: 'GitHub',
                href: 'https://www.github.com/grafana/plugin-tools',
              },
            ],
          },
        ],
        copyright: `Copyright © ${new Date().getFullYear()} Grafana Labs. Built with Docusaurus.`,
      },
      prism: {
        theme: lightCodeTheme,
        darkTheme: darkCodeTheme,
      },
    }),
};

module.exports = config;
