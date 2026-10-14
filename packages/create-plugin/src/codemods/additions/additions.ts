interface AdditionBase {
  name: string;
  description: string;
  // package.json scripts create-plugin runs itself after an agent step, e.g. ['typecheck', 'build'].
  // only used by additions with a prompt
  verify?: string[];
  // shown before asking whether to use an agent, e.g. 'An AI agent can port your custom config.'
  agentSummary?: string;
}

export interface ScriptAddition extends AdditionBase {
  scriptPath: string;
  // hybrid additions pair a codemod with agent instructions that finish the work
  prompt?: string;
  // the codemod alone leaves a complete result, so a missing agent skips the agent step instead of failing
  optionalAgent?: boolean;
}

export interface PromptOnlyAddition extends AdditionBase {
  prompt: string;
  // declared as optional-undefined so `addition.scriptPath` is a legal access on the union.
  // without it the isScriptAddition guard below would not compile
  scriptPath?: undefined;
  // with no codemod half there is nothing to fall back on, so the agent step is never optional
  optionalAgent?: undefined;
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
    name: 'experimental-app-sdk',
    description: 'Adds grafana-app-sdk CUE kind code generation to an app plugin',
    scriptPath: import.meta.resolve('./scripts/experimental-app-sdk.js'),
  },
];

export default additions;
