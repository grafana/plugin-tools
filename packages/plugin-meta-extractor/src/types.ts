export enum MetaKind {
  extensionLink = 'extensionLink',
  extensionComponent = 'extensionComponent',
}

export interface MetaBase {
  kind: MetaKind;
}

export interface ExtensionLinkMeta extends MetaBase {
  kind: MetaKind.extensionLink;
  extensionPointId: string;
  title: string;
  description: string;
}

export interface ExtensionComponentMeta extends MetaBase {
  kind: MetaKind.extensionComponent;
  extensionPointId: string;
  title: string;
  description: string;
}
