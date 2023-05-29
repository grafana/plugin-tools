import { platform } from 'os';

export function operatingSystemCheck() {
  const os = platform();

  if (os === 'win32') {
    console.error(`Unsupported operating system 'Windows' detected. Please use WSL with create-plugin.`);
    process.exit(1);
  }
}
