/*
  This hideous script is temporarily committed to PR #602 for evaluating the scaffolded output
  from latest `npx -y @grafana/create-plugin@latest` and `npx -y @grafana/create-plugin@2.11.0-canary.602.81e7a0e.0`
  where plop has been removed from the codebase.
*/

import fs from 'fs';
import path from 'path';
import { marked } from 'marked';
import { diffLines } from 'diff';
import chalk from 'chalk';
import TerminalRenderer from 'marked-terminal';

marked.setOptions({
  renderer: new TerminalRenderer({}),
});

const outputDirectory = '/path/to/scaffolded/plugin/withoutPlop/myorg-myplugin-panel';
const previousOutputDirectory = '/path/to/scaffolded/plugin/withPlop/myorg-myplugin-panel';

const changesTable = [
  ['File/Directory', 'Change Type', 'Diff'],
  ['---', '---', '---'],
];

const compareDirectories = (dir1, dir2) => {
  const entries1 = fs.readdirSync(dir1);
  const entries2 = fs.readdirSync(dir2);
  console.log({ entries1, entries2 });
  entries1.forEach((entry) => {
    const entryPath1 = path.join(dir1, entry);
    const entryPath2 = path.join(dir2, entry);

    if (fs.statSync(entryPath1).isDirectory()) {
      if (!entries2.includes(entry)) {
        changesTable.push([entry, 'Deleted', '']);
      } else {
        compareDirectories(entryPath1, entryPath2);
      }
    } else {
      const content1 = fs.readFileSync(entryPath1, 'utf8');
      const content2 = fs.readFileSync(entryPath2, 'utf8');

      if (content1 !== content2) {
        const diff = getDiff(content1, content2);
        changesTable.push([entry, 'Modified', diff]);
      }
    }
  });

  // Check for new files in dir2
  entries2.forEach((entry) => {
    if (!entries1.includes(entry)) {
      changesTable.push([entry, 'Added', '']);
    }
  });
};

compareDirectories(previousOutputDirectory, outputDirectory);

function getDiff(text1, text2) {
  const diff = diffLines(text1, text2);

  let result = '```';
  let inChange = false;

  diff.forEach((part) => {
    const color = part.added ? 'green' : 'red';

    if (part.added || part.removed) {
      inChange = true;
    }

    if (inChange) {
      result += chalk[color](part.value);
    }

    if (part.value.endsWith('\n')) {
      inChange = false;
    }
  });

  result += '```';
  return result;
}

const markdownTable = marked(changesTable.map((row) => `| ${row.join(' | ')} |`).join('\n'));

console.log(markdownTable);
