import { PluginAnalysisResults } from '../types/reporters.js';
import { output } from '../utils/output.js';

export function consoleReporter(results: PluginAnalysisResults) {
  if (results.summary.totalIssues === 0) {
    output.success({
      title: 'No React 19 breaking changes detected!',
      body: [
        `Plugin: ${results.plugin.name} v${results.plugin.version}`,
        'Your plugin appears to be compatible with React 19.',
      ],
    });
    return;
  }

  output.error({
    title: 'React 19 breaking changes detected!',
    body: [
      `Plugin: ${results.plugin.name} v${results.plugin.version}`,
      'Your plugin appears to be incompatible with React 19.',
    ],
  });
  return;
}
