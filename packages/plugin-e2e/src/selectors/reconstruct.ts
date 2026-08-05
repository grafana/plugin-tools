import { VersionedSelectorGroup } from '@grafana/e2e-selectors';

// Reconstructs the data-only selector tree served by Grafana (see grafana/grafana e2e-selectors
// build) back into a versioned selector tree with functions, so it can be passed to resolveSelectors.
// Function selectors are serialized as template descriptors; here they become fixed local functions
// that only substitute positional {0}, {1} placeholders - no code from the fetched file is executed.

type ConditionalTemplate = { whenPresent: string; whenAbsent: string };
type TemplateDescriptor = { $template: string | ConditionalTemplate; params?: string[] };

function isDescriptor(node: object): node is TemplateDescriptor {
  return '$template' in node;
}

function fill(template: string, args: string[]): string {
  return template.replace(/\{(\d+)\}/g, (_, index) => args[Number(index)] ?? '');
}

function reconstructDescriptor(descriptor: TemplateDescriptor): (...args: string[]) => string {
  const template = descriptor.$template;
  if (typeof template === 'string') {
    return (...args: string[]) => fill(template, args);
  }
  if (template && typeof template === 'object' && typeof template.whenPresent === 'string' && typeof template.whenAbsent === 'string') {
    return (...args: string[]) => (args[0] ? fill(template.whenPresent, args) : template.whenAbsent);
  }
  throw new Error('@grafana/plugin-e2e: malformed e2e-selectors template descriptor');
}

function reconstructNode(node: unknown): unknown {
  if (typeof node === 'string') {
    return node;
  }
  if (!node || typeof node !== 'object') {
    throw new Error('@grafana/plugin-e2e: unexpected e2e-selectors node');
  }
  if (isDescriptor(node)) {
    return reconstructDescriptor(node);
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(node)) {
    result[key] = reconstructNode(value);
  }
  return result;
}

export function reconstructSelectorTree(data: unknown): VersionedSelectorGroup {
  return reconstructNode(data) as VersionedSelectorGroup;
}
