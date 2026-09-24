import { AGENT_DEFINITIONS } from './definitions.js';
import { AgentInvocationContext } from './types.js';

const invocationContext: AgentInvocationContext = {
  systemPrompt: 'system prompt contents',
  userPrompt: 'user prompt contents',
  workspaceRoot: '/virtual/workspace',
  handoffDir: '/virtual/workspace/node_modules/.cache/grafana-create-plugin/migrate-runs/run-1',
};

function getDefinition(id: string) {
  const definition = AGENT_DEFINITIONS.find((agentDefinition) => agentDefinition.id === id);
  if (!definition) {
    throw new Error(`No agent definition found for ${id}`);
  }
  return definition;
}

describe('AGENT_DEFINITIONS', () => {
  it('should define claude-code and codex in preference order', () => {
    expect(AGENT_DEFINITIONS.map((agentDefinition) => agentDefinition.id)).toEqual(['claude-code', 'codex']);
  });

  AGENT_DEFINITIONS.forEach((definition) => {
    describe(definition.id, () => {
      it('should have at least one binary name to probe', () => {
        expect(definition.binaryNames.length).toBeGreaterThan(0);
      });

      it('should embed both prompts in the interactive invocation', () => {
        const invocation = definition.buildInteractive(invocationContext);
        const serialisedArgs = invocation.args.join(' ');
        expect(serialisedArgs).toContain(invocationContext.systemPrompt);
        expect(serialisedArgs).toContain(invocationContext.userPrompt);
      });
    });
  });

  it('should pre-authorize the handoff write for claude-code', () => {
    const invocation = getDefinition('claude-code').buildInteractive(invocationContext);
    const allowedToolsIndex = invocation.args.indexOf('--allowedTools');
    expect(allowedToolsIndex).toBeGreaterThan(-1);
    expect(invocation.args[allowedToolsIndex + 1]).toBe(`Write(${invocationContext.handoffDir}/**)`);
  });

  it('should pass the system prompt as developer instructions for codex', () => {
    const invocation = getDefinition('codex').buildInteractive(invocationContext);
    expect(invocation.args).toContain(`developer_instructions=${invocationContext.systemPrompt}`);
  });
});
