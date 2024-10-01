import { VersionedAPIs } from './versionedAPIs';
import { VersionedConstants } from './versionedConstants';

export type CustomSelectorGroup = {
  constants: SelectorsOf<VersionedConstants>;
  apis: SelectorsOf<VersionedAPIs>;
};

export type SelectorsOf<T> = {
  [Property in keyof T]: T[Property] extends VersionedFunctionSelector
    ? FunctionSelector
    : T[Property] extends VersionedStringSelector
    ? StringSelector
    : SelectorsOf<T[Property]>;
};

export type StringSelector = string;

export type FunctionSelector = (...args: string[]) => string;

export type VersionedFunctionSelector = Record<string, FunctionSelector>;

export type VersionedStringSelector = Record<string, StringSelector>;

export type VersionedSelectorGroup = {
  [property: string]: VersionedFunctionSelector | VersionedStringSelector | VersionedSelectorGroup;
};
