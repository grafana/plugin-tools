import React, { useEffect } from 'react';
import useIsBrowser from '@docusaurus/useIsBrowser';

interface SyncCommandProps {
  cmd: string;
}

const LOCAL_STORAGE_KEY = 'docusaurus.tab.npm2yarn';

function BrowserSyncCommand({ cmd }: SyncCommandProps) {
  let currentPackageManager = window.localStorage[LOCAL_STORAGE_KEY];
  const [packageManager, setPackageManager] = React.useState(currentPackageManager ?? 'npm');

  const handleStorage = (event: StorageEvent) => {
    if (event.key === LOCAL_STORAGE_KEY) {
      setPackageManager(event.newValue);
    }
  };

  useEffect(() => {
    window.addEventListener('storage', handleStorage);
    return () => {
      window.removeEventListener('storage', handleStorage);
    };
  }, []);

  const cmdString = `${packageManager} ${cmd}`;

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
