export enum MetaKind {
  extensionLink = 'extensionLink',
  extensionComponent = 'extensionComponent',
}

export interface MetaBase {
  kind: MetaKind;
}
