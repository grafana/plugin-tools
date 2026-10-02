interface AdditionBase {
  name: string;
  description: string;
  // package.json scripts create-plugin runs itself after an agent step, e.g. ['typecheck', 'build'].
  // only used by additions with a prompt
  verify?: string[];
}

export interface ScriptAddition extends AdditionBase {
  scriptPath: string;
  // hybrid additions pair a codemod with agent instructions that finish the work
  prompt?: string;
}

export interface PromptOnlyAddition extends AdditionBase {
  prompt: string;
  // declared as optional-undefined so `addition.scriptPath` is a legal access on the union.
  // without it the isScriptAddition guard below would not compile
  scriptPath?: undefined;
}

export type Addition = ScriptAddition | PromptOnlyAddition;

export function isScriptAddition(addition: Addition): addition is ScriptAddition {
  return typeof addition.scriptPath === 'string';
}

// an intersection rather than `is PromptOnlyAddition` because this is true for hybrids too
export function hasPromptStep(addition: Addition): addition is Addition & { prompt: string } {
  return typeof addition.prompt === 'string';
}

// annotated rather than `satisfies Addition[]` so consumers see the union. with `satisfies` the
// inferred element type stays the object literal, which means the type guards above cannot narrow it
// scripts/example-addition.ts is a reference for authors and is deliberately not registered, so users never see it
const additions: Addition[] = [
  {
    name: 'externalize-jsx-runtime',
    description: 'Externalizes the react JSX runtime to help migrate plugins to React 19',
    scriptPath: import.meta.resolve('./scripts/externalize-jsx-runtime.js'),
  },
  {
    name: 'rspack',
    description: 'Migrates the plugin frontend build from webpack or experimental rspack to rspack 2',
    scriptPath: import.meta.resolve('./scripts/rspack.js'),
    prompt: import.meta.resolve('./prompts/rspack.md'),
    verify: ['typecheck', 'build'],
  },
  {
    name: 'experimental-app-sdk',
    description: 'Adds grafana-app-sdk CUE kind code generation to an app plugin',
    scriptPath: import.meta.resolve('./scripts/experimental-app-sdk.js'),
  },
  {
    name: 'docs',
    description: 'Scaffolds plugin docs for a Grafana plugin',
    scriptPath: import.meta.resolve('./scripts/docs.js'),
  },
  {
    name: 'docs-content',
    description: 'Drafts the plugin docs pages from source code and existing docs with an AI agent',
    scriptPath: import.meta.resolve('./scripts/docs-content.js'),
    prompt: import.meta.resolve('./prompts/docs-content.md'),
    verify: ['docs:validate'],
  },
];

export default additions;
