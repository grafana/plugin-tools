export enum PluginExtensionTypes {
  link = 'link',
  component = 'component',
}

export type PluginMeta = {
  extensions: PluginExtensionMeta[];
};

export type PluginExtensionMeta = {
  type: PluginExtensionTypes;
  extensionPointId: string;
  title: string;
  description: string;
};

export type PluginExtensionLinkMeta = PluginExtensionMeta & {
  icon?: string;
  category?: string;
};

export type PluginExtensionComponentMeta = PluginExtensionMeta & {};
