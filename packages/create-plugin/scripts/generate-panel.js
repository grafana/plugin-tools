const nodePlop = require('node-plop');
const path = require('path');
const fs = require('fs');

async function generatePanel() {
  const plopFile = path.join(__dirname, '../dist/commands/generate.plopfile.js');
  if (!fs.existsSync(plopFile)) {
    console.error('Run build first');
    process.exit(1);
  }
  const plop = await nodePlop(plopFile);
  const generator = plop.getGenerator('create-plugin');
  await generator.runActions({
    pluginName: 'my-plugin',
    orgName: 'my-org',
    pluginDescription: 'Auto-generated panel',
    pluginType: 'panel',
    hasGithubWorkflows: true,
    hasGithubLevitateWorkflow: true,
  });
}

generatePanel();
