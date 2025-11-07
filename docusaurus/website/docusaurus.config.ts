import type * as Preset from '@docusaurus/preset-classic';
import type { Config } from '@docusaurus/types';
import dotenv from 'dotenv';
import remarkFigureCaption from 'gridsome-remark-figure-caption';
import npm2yarn from '@docusaurus/remark-plugin-npm2yarn';
import { resolve } from 'node:path';
import { themes, type PrismTheme } from 'prism-react-renderer';
import redirects from './websiteRedirects.json';

const gitHash = process.env.GITHUB_SHA || 'local';
const envFile = process.env.DEV_PORTAL_ENV === 'dev' ? '.env.development' : '.env.production';

dotenv.config({ path: `${__dirname}/${envFile}`, encoding: 'utf8' });

const PORTAL_URL = `https://${process.env.DEV_PORTAL_HOST}`;
const PORTAL_HOME_HREF = `${PORTAL_URL}/developers`;

// Replace background and color to better match Grafana theme.
const grafanaPrismTheme: PrismTheme = {
  ...themes.oneDark,
  plain: {
    color: 'rgb(204, 204, 220)',
    backgroundColor: '#181b1f',
  },
};

const config: Config = {
  title: 'Grafana Plugin Tools',
  tagline: 'Scaffold a Grafana plugin with one command',
  url: PORTAL_URL,
  baseUrl: 'developers/plugin-tools/',
  onBrokenLinks: 'throw',
  onBrokenAnchors: 'throw',
  favicon: 'img/favicon.png',
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
  future: {
    experimental_faster: true,
    v4: {
      removeLegacyPostBuildHeadAttribute: true,
      useCssCascadeLayers: false,
    },
  },
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'warn',
    },
  },
  plugins: [
    [
      './plugins/docusaurus-custom-webpack-plugin',
      {
        resolve: {
          alias: {
            '@snippets': resolve(__dirname, '..', 'docs', 'snippets'),
            '@shared': resolve(__dirname, '..', 'docs', 'shared'),
          },
        },
      },
    ],
    [
      'docusaurus-lunr-search',
      {
        disableVersioning: true,
      },
    ],
    [
      '@docusaurus/plugin-client-redirects',
      {
        // how to use https://docusaurus.io/docs/api/plugins/@docusaurus/plugin-client-redirects#ex-config
        // This plugin is only active in production because it works on the build output.
        // Edit the redirects in file://./websiteRedirects.json
        redirects,
      },
    ],
  ],
  presets: [
    [
      'classic',
      {
        docs: {
          path: '../docs',
          exclude: ['**/snippets/**', '**/shared/**', '**/drafts/**'],
          sidebarPath: './sidebars.ts',
          // Please change this to your repo.
          // Remove this to remove the "edit this page" links.
          editUrl: 'https://github.com/grafana/plugin-tools/edit/main/docusaurus/website',
          beforeDefaultRemarkPlugins: [
            [
              remarkFigureCaption,
              {
                figureClassName: 'md-figure-block',
                imageClassName: 'md-figure-image',
                captionClassName: 'md-figure-caption',
              },
            ],
          ],
          remarkPlugins: [[npm2yarn, { sync: true, converters: ['yarn', 'pnpm'] }]],
          routeBasePath: '/',
        },
        theme: {
          customCss: require.resolve('./src/css/custom.css'),
        },
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
      title: 'Grafana Plugin Tools',
      logo: {
        alt: 'Grafana Logo',
        src: 'img/logo.svg',
      },
      items: [
        { href: PORTAL_HOME_HREF, label: 'Portal Home', position: 'right', target: '_self' },
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
              to: '/',
            },
            {
              label: 'Portal Home',
              href: PORTAL_HOME_HREF,
              target: '_self',
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
      theme: grafanaPrismTheme,
      additionalLanguages: ['bash', 'diff', 'json'],
      magicComments: [
        {
          className: 'code-block-addition-highlighted-line',
          line: 'addition-highlight-next-line',
          block: { start: 'addition-highlight-start', end: 'addition-highlight-end' },
        },
      ],
    },
    colorMode: {
      defaultMode: 'dark',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
  },

  customFields: {
    nodeEnv: process.env.NODE_ENV,
    rudderStackTracking: {
      url: process.env.DEV_PORTAL_RUDDERSTACK_URL,
      writeKey: process.env.DEV_PORTAL_RUDDERSTACK_WRITE_KEY,
      configUrl: process.env.DEV_PORTAL_RUDDERSTACK_CONFIG_URL,
      sdkUrl: process.env.DEV_PORTAL_RUDDERSTACK_SDK_URL,
    },
    canSpamUrl: `${PORTAL_URL}/canspam`,
    faroConfig: {
      url: process.env.DEV_PORTAL_FARO_CONFIG_URL,
      appName: process.env.DEV_PORTAL_FARO_CONFIG_APP_NAME,
      version: gitHash,
      environment: process.env.DEV_PORTAL_FARO_CONFIG_ENVIRONMENT,
    },
    oneTrust: {
      enabled: true,
      scriptSrc: 'https://cdn.cookielaw.org/scripttemplates/otSDKStub.js',
      domainId: process.env.DEV_PORTAL_ONETRUST_DOMAIN_ID,
      analyticsGroupId: 'C0002', // OneTrust group ID for analytics consent
    },
  },
  scripts: [
    // adobe target
    `${PORTAL_URL}/at.js`,
  ],
};

export default config;
