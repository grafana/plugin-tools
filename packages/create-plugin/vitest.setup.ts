import { expect } from 'vitest';
import type { Context } from './src/migrations/context';
import { inspect } from 'node:util';

type ClonedContext = {
  files: Record<string, { content: string; changeType: 'add' | 'update' | 'delete' }>;
};

async function compareContexts(firstRun: ClonedContext, secondRun: ClonedContext) {
  for (const file of Object.keys(firstRun.files)) {
    const firstRunContent = firstRun.files[file].content;
    const secondRunContent = secondRun.files[file].content;
    if (firstRunContent !== secondRunContent) {
      return {
        pass: false,
        file,
        firstRunContent,
        secondRunContent,
      };
    }
  }

  return { pass: true };
}

const parseContent = (content?: string) => (content ? JSON.parse(content) : '');

expect.extend({
  async toBeIdempotent(migrate: (context: Context) => Promise<Context>, context: Context) {
    const firstRun = await migrate(context);
    const firstRunDeepCopy = structuredClone(firstRun) as unknown as ClonedContext;

    const secondRun = await migrate(firstRun);
    const secondRunDeepCopy = structuredClone(secondRun) as unknown as ClonedContext;

    const result = await compareContexts(firstRunDeepCopy, secondRunDeepCopy);

    if (result.pass) {
      return {
        pass: true,
        message: () => 'Expected migration not to be idempotent',
      };
    }

    return {
      pass: false,
      message: () =>
        `Migration is not idempotent. File ${result.file} changed on second run.\n` +
        `First run content: ${inspect(parseContent(result.firstRunContent), { colors: true })}\n` +
        `Second run content: ${inspect(parseContent(result.secondRunContent), { colors: true })}`,
    };
  },
});
