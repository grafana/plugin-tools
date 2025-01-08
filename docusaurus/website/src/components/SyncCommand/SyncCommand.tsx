import React from 'react';
import { useLocation } from '@docusaurus/router';
import useIsBrowser from '@docusaurus/useIsBrowser';

interface SyncCommandProps {
  cmd: string;
}

function BrowserSyncCommand({ cmd }: SyncCommandProps) {
  let currentPackageManager = window.localStorage['docusaurus.tab.npm2yarn'];

  const cmdString = `${currentPackageManager} ${cmd}`;

  return <code>{cmdString}</code>;
}

function ServerSyncCommand({ cmd }: SyncCommandProps) {
  const cmdString = `npm ${cmd}`;
  return <code>{cmdString}</code>;
}

function SyncCommand({ cmd }: SyncCommandProps) {
  const isBrowser = useIsBrowser();
  return isBrowser ? <BrowserSyncCommand cmd={cmd} /> : <ServerSyncCommand cmd={cmd} />;
}

export default SyncCommand;
