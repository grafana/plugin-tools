import React from 'react';
import { useLocation } from '@docusaurus/router';
import useIsBrowser from '@docusaurus/useIsBrowser';

interface SyncCommandProps {
  cmd: string;
}

function BrowserSyncCommand({ cmd }: SyncCommandProps) {
  let currentPackageManager = window.localStorage['docusaurus.tab.package-manager'];
  const location = useLocation();

  if (!currentPackageManager) {
    if (location && location.search && location.search.includes('current-package-manager')) {
      const searchParams = new URLSearchParams(location.search);
      currentPackageManager = searchParams.get('current-package-manager');
    } else {
      currentPackageManager = 'npm';
    }
  }
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
