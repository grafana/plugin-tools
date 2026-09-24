interface AdditionBase {
  name: string;
  description: string;
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
const additions: Addition[] = [
  {
    name: 'example-addition',
    description: 'Adds an example addition to the plugin',
    scriptPath: import.meta.resolve('./scripts/example-addition.js'),
  },
  {
    name: 'externalize-jsx-runtime',
    description: 'Externalizes the react JSX runtime to help migrate plugins to React 19',
    scriptPath: import.meta.resolve('./scripts/externalize-jsx-runtime.js'),
  },
  {
    name: 'experimental-app-sdk',
    description: 'Adds grafana-app-sdk CUE kind code generation to an app plugin',
    scriptPath: import.meta.resolve('./scripts/experimental-app-sdk.js'),
  },
];

export default additions;
