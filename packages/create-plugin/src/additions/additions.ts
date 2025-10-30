export type AdditionMeta = {
  name: string;
  description: string;
  scriptPath: string;
  featureName: string;
};

export default {
  additions: {
    i18n: {
      name: 'i18n',
      description: 'Add internationalization (i18n) support to your plugin',
      scriptPath: './scripts/add-i18n.js',
      featureName: 'i18nEnabled',
    },
  },
};
