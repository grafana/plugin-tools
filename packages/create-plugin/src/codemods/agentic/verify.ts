import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export type VerifyOutcome = 'passed' | 'failed' | 'missing';

export interface VerifyResult {
  script: string;
  outcome: VerifyOutcome;
}

export interface VerifyOptions {
  scripts: string[];
  cwd: string;
  packageManagerName: string;
  runScript?: (packageManagerName: string, script: string, cwd: string) => boolean;
}

export interface VerifyWarning {
  title: string;
  body: string[];
}

// the agent runs the prompt's own Verify step and reports on itself. these scripts are run by
// create-plugin after the session, so the final result never rests on the agent's account alone
export function runVerifyScripts(options: VerifyOptions): VerifyResult[] {
  const { scripts, cwd, packageManagerName, runScript = runPackageScript } = options;
  const availableScripts = readPackageScripts(cwd);
  const results: VerifyResult[] = [];

  // sequential, and every script runs even after a failure, so the user sees the whole picture at once
  for (const script of scripts) {
    if (!availableScripts.has(script)) {
      results.push({ script, outcome: 'missing' });
      continue;
    }
    const hasPassed = runScript(packageManagerName, script, cwd);
    results.push({ script, outcome: hasPassed ? 'passed' : 'failed' });
  }

  return results;
}

export function buildVerifyWarning(
  additionName: string,
  packageManagerName: string,
  results: VerifyResult[]
): VerifyWarning | undefined {
  const failedResults = results.filter((result) => result.outcome !== 'passed');
  if (failedResults.length === 0) {
    return undefined;
  }

  const failedCount = failedResults.filter((result) => result.outcome === 'failed').length;
  const title =
    failedCount > 0
      ? `${additionName} was applied, but ${failedCount} of its checks failed.`
      : `${additionName} was applied, but some of its checks could not run.`;

  return {
    title,
    body: [
      ...failedResults.map(({ script, outcome }) =>
        outcome === 'failed'
          ? `${packageManagerName} run ${script}  failed`
          : `${packageManagerName} run ${script}  skipped: package.json has no "${script}" script`
      ),
      'Nothing was committed. Review the changes with git diff before you commit them.',
    ],
  };
}

function readPackageScripts(cwd: string): Set<string> {
  try {
    const packageJson: { scripts?: Record<string, string> } = JSON.parse(
      readFileSync(join(cwd, 'package.json'), 'utf-8')
    );
    return new Set(Object.keys(packageJson.scripts ?? {}));
  } catch {
    return new Set();
  }
}

function runPackageScript(packageManagerName: string, script: string, cwd: string): boolean {
  try {
    // inherit stdio so the user sees the check's own output, exactly as if they ran it themselves.
    // script names come from the additions registry, never from user input
    execSync(`${packageManagerName} run ${script}`, { cwd, stdio: 'inherit' });
    return true;
  } catch {
    return false;
  }
}
