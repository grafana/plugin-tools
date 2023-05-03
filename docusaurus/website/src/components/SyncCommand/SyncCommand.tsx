import React from 'react';
import { useLocation } from '@docusaurus/router';
import BrowserOnly from '@docusaurus/BrowserOnly';

interface SyncCommandProps {
  cmd: string;
}

function SyncCommand({ cmd }: SyncCommandProps) {
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

function BrowserOnlySyncCommand({ cmd }: SyncCommandProps) {
  return <BrowserOnly>{() => <SyncCommand cmd={cmd} />}</BrowserOnly>;
}

export default BrowserOnlySyncCommand;
