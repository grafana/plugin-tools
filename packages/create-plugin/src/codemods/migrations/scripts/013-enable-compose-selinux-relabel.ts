import { type Context } from '../../context.js';
import { parseDocument, stringify, isSeq, isScalar } from 'yaml';

export default async function migrate(context: Context) {
  const baseComposeContent = context.getFile('./.config/docker-compose-base.yaml');

  if (!baseComposeContent) {
    return context;
  }

  const baseComposeData = parseDocument(baseComposeContent);

  const mounts = baseComposeData.getIn(['services', 'grafana', 'volumes']);
  if (!isSeq(mounts)) {
    return context;
  }
  for (const m of mounts.items) {
    if (!isScalar(m) || typeof m.value !== 'string') {
      continue;
    }

    const parts = m.value.split(':');
    if (parts.length < 3) {
      m.value += ':Z';
      continue;
    }

    const opts = parts[parts.length - 1];
    if (!opts.match(/[zZ]/)) {
      m.value = [...parts.slice(0, -1), opts + 'Z'].join(':');
    }
  }

  context.updateFile(
    './.config/docker-compose-base.yaml',
    stringify(baseComposeData, { lineWidth: 120, singleQuote: true })
  );

  return context;
}
