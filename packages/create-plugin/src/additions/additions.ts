export type AdditionMeta<TFeatureName extends string = string> = {
  name: string;
  description: string;
  scriptPath: string;
  featureName: TFeatureName;
};

const additions = {
  i18n: {
    name: 'i18n',
    description: 'Add internationalization (i18n) support to your plugin',
    scriptPath: './scripts/add-i18n.js',
    featureName: 'i18nEnabled',
  },
};

export default { additions };

type AdditionValues = (typeof additions)[keyof typeof additions];
export type AdditionFeatureName = AdditionValues['featureName'];

export type TypedAdditionMeta = AdditionMeta<AdditionFeatureName>;
