import path from 'path';
import { TestFixture } from '@playwright/test';
import { parse as parseYml } from 'yaml';
import { promises } from 'fs';
import { AlertRule, PlaywrightArgs, ReadProvisionedAlertRuleArgs } from '../../types';

type ReadProvisionedAlertRuleFixture = TestFixture<
  (args: ReadProvisionedAlertRuleArgs) => Promise<AlertRule>,
  PlaywrightArgs
>;

const ALERTING_DIR = 'alerting';

export const readProvisionedAlertRule: ReadProvisionedAlertRuleFixture = async ({ provisioningRootDir }, use) => {
  await use(async ({ fileName, groupName, ruleTitle }) => {
    const resolvedPath = path.resolve(path.join(provisioningRootDir, ALERTING_DIR, fileName));
    const raw = await promises.readFile(resolvedPath, 'utf8');
    const contents = raw.replace(/\$\{([A-Za-z_][A-Za-z0-9_]*)(?::-(.*?))?\}|\$([A-Za-z_][A-Za-z0-9_]*)/g, (_, braced, fallback, plain) => {
      const varName = braced ?? plain;
      const envValue = process.env[varName];
      if (envValue === undefined || envValue === '') {
        return fallback ?? '';
      }
      return envValue;
    });
    const yml = parseYml(contents);
    let group = yml.groups[0];
    if (groupName) {
      group = yml.groups.find((group: { name: string }) => group.name === groupName);
    }
    let rule = group.rules[0];
    if (ruleTitle) {
      rule = group.rules.find((rule: AlertRule) => rule.title === ruleTitle);
    }

    return rule;
  });
};
