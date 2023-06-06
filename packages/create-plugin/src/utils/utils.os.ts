import { platform } from 'os';

export function isUnsupportedPlatform() {
  const os = platform();

  if (os === 'win32') {
    return true;
  }

  return false;
}
