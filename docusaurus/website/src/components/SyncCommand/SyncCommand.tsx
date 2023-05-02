import React from 'react';
import { useLocation } from '@docusaurus/router';

function SyncCommand({ cmd }) {
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

export default SyncCommand;
