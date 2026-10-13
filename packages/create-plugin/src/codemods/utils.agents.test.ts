import { join } from 'node:path';
import { Context } from './context.js';
import {
  AGENT_INSTRUCTIONS_PATH,
  appendToAgentInstructions,
  ensureConfigAgentFiles,
  ensureRootAgentFiles,
} from './utils.agents.js';

describe('utils.agents', () => {
  describe('ensureRootAgentFiles', () => {
    const templateDir = join(__dirname, '..', '..', 'templates', 'common');

    it('creates the missing root agent files', () => {
      const context = new Context('/virtual');
      expect(ensureRootAgentFiles(context, templateDir)).toEqual([]);
      for (const file of ['AGENTS.md', 'CLAUDE.md', 'GEMINI.md']) {
        expect(context.getFile(file), file).toContain(AGENT_INSTRUCTIONS_PATH);
      }
    });

    it('appends a pointer to an existing file that never reaches instructions.md', () => {
      const context = new Context('/virtual');
      context.addFile('CLAUDE.md', '# Mine\n');
      expect(ensureRootAgentFiles(context, templateDir)).toEqual(['CLAUDE.md']);
      expect(context.getFile('CLAUDE.md')).toContain(AGENT_INSTRUCTIONS_PATH);
      expect(context.getFile('CLAUDE.md')).toContain('# Mine');
    });

    it('treats a file that imports a linked AGENTS.md as linked', () => {
      const context = new Context('/virtual');
      context.addFile('AGENTS.md', `Read @./${AGENT_INSTRUCTIONS_PATH}\n`);
      context.addFile('CLAUDE.md', '@AGENTS.md\n');
      expect(ensureRootAgentFiles(context, templateDir)).toEqual([]);
      expect(context.getFile('CLAUDE.md')).toBe('@AGENTS.md\n');
    });

    it('links existing files that never reach instructions.md', () => {
      const context = new Context('/virtual');
      context.addFile('AGENTS.md', '# Mine\n');
      context.addFile('CLAUDE.md', '@AGENTS.md\n');
      context.addFile('GEMINI.md', 'See docs/AGENTS.md\n');
      // AGENTS.md gets the pointer first, so CLAUDE.md's @AGENTS.md then resolves without its own edit
      expect(ensureRootAgentFiles(context, templateDir)).toEqual(['AGENTS.md', 'GEMINI.md']);
      expect(context.getFile('AGENTS.md')).toContain(AGENT_INSTRUCTIONS_PATH);
      expect(context.getFile('CLAUDE.md')).toBe('@AGENTS.md\n');
      expect(context.getFile('GEMINI.md')).toContain(AGENT_INSTRUCTIONS_PATH);
    });
  });

  describe('ensureConfigAgentFiles', () => {
    const templateDir = join(__dirname, '..', '..', 'templates', 'common');

    it('creates the given files from the template dir', () => {
      const context = new Context('/virtual');
      ensureConfigAgentFiles(context, templateDir, ['instructions.md', 'e2e-testing.md'], {
        packageManagerName: 'npm',
      });

      expect(context.doesFileExist(AGENT_INSTRUCTIONS_PATH)).toBe(true);
      expect(context.doesFileExist('.config/AGENTS/e2e-testing.md')).toBe(true);
    });

    it('does nothing when instructions.md already exists', () => {
      const context = new Context('/virtual');
      context.addFile(AGENT_INSTRUCTIONS_PATH, '# Mine\n');
      ensureConfigAgentFiles(context, templateDir, ['instructions.md', 'e2e-testing.md'], {
        packageManagerName: 'npm',
      });

      expect(context.getFile(AGENT_INSTRUCTIONS_PATH)).toBe('# Mine\n');
      expect(context.doesFileExist('.config/AGENTS/e2e-testing.md')).toBe(false);
    });
  });

  describe('appendToAgentInstructions', () => {
    it('writes just the text into an empty instructions file', () => {
      const context = new Context('/virtual');
      context.addFile(AGENT_INSTRUCTIONS_PATH, '\n');
      appendToAgentInstructions(context, 'new.md', '## New\n');
      expect(context.getFile(AGENT_INSTRUCTIONS_PATH)).toBe('## New\n');
    });

    it('appends after a blank line', () => {
      const context = new Context('/virtual');
      context.addFile(AGENT_INSTRUCTIONS_PATH, '# Mine\n');
      appendToAgentInstructions(context, 'new.md', '## New\n');

      expect(context.getFile(AGENT_INSTRUCTIONS_PATH)).toBe('# Mine\n\n## New\n');
    });

    it('uses the given separator', () => {
      const context = new Context('/virtual');
      context.addFile(AGENT_INSTRUCTIONS_PATH, '- one\n');
      appendToAgentInstructions(context, 'new.md', '- two\n', '\n');

      expect(context.getFile(AGENT_INSTRUCTIONS_PATH)).toBe('- one\n- two\n');
    });

    it('skips when the marker is already present', () => {
      const context = new Context('/virtual');
      context.addFile(AGENT_INSTRUCTIONS_PATH, 'See new.md\n');
      appendToAgentInstructions(context, 'new.md', '## New\n');

      expect(context.getFile(AGENT_INSTRUCTIONS_PATH)).toBe('See new.md\n');
    });

    it('skips when there is no instructions file', () => {
      const context = new Context('/virtual');
      appendToAgentInstructions(context, 'new.md', '## New\n');

      expect(context.doesFileExist(AGENT_INSTRUCTIONS_PATH)).toBe(false);
    });
  });
});
