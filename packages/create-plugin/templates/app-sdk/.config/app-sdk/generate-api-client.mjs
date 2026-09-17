// Generates RTK Query API clients for this plugin's kinds, in two steps:
//
//   1. `grafana cli write-openapi` renders the OpenAPI documents Grafana serves for the app manifest
//      in src/app-sdk-manifest.json, one per served version, into .config/app-sdk/openapi/.
//   2. `grafana-api-clients generate` (from @grafana/api-clients) turns them into clients under
//      src/api/generated/<version>/ — the same generator core Grafana uses for its own APIs.
//
// Step 1 runs the Grafana release pinned in GRAFANA_VERSION below, resolved as:
//   1. a previously obtained copy in node_modules/.cache/grafana/<version>/
//   2. a fresh copy of just the `grafana` binary, extracted from the official release tarball
// A `grafana` on your PATH is deliberately ignored: the spec has to come from the Grafana version the
// plugin targets. To use your own build, set GRAFANA_BIN to the binary.
//
// Run this after `generate:kinds` whenever the manifest changes. Generated clients are intended to be
// committed; the openapi/ directory is not.

import { execFileSync, spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { arch, platform, tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

// `grafana cli write-openapi` shipped in Grafana main on 2026-09-08; 13.3.0 is the first release
// with it. Until then this pins a nightly build. The suffix is the grafana/grafana Actions run id that
// built it, so it identifies one commit: this one is b8b4b49a6d388dd6584417c3fabb91c6ab81b423.
// Find other builds at https://grafana.com/api/downloads/grafana/versions?channel=nightly and their
// commit with `gh run view <id> --repo grafana/grafana --json headSha`.
const GRAFANA_VERSION = '13.3.0-35040200895';
const BIN_OVERRIDE = 'GRAFANA_BIN';

const MANIFEST = resolve('src', 'app-sdk-manifest.json');
const SPEC_DIR = resolve('.config', 'app-sdk', 'openapi');
const OUT_DIR = resolve('src', 'api', 'generated');
const CACHE_DIR = resolve('node_modules', '.cache', 'grafana', GRAFANA_VERSION);

const EXE = platform() === 'win32' ? '.exe' : '';

function run(command, args, options = {}) {
  return spawnSync(command, args, { stdio: 'inherit', ...options });
}

/** Returns the release tarball's platform pair, or exits if this platform has no published build. */
function target() {
  const goos = { linux: 'linux', darwin: 'darwin', win32: 'windows' }[platform()];
  const goarch = { x64: 'amd64', arm64: 'arm64' }[arch()];

  if (!goos || !goarch) {
    console.error(
      `No Grafana release build for ${platform()}/${arch()}.\n` +
        `Install Grafana yourself and set ${BIN_OVERRIDE} to its \`grafana\` binary.`
    );
    process.exit(1);
  }

  return { goos, goarch };
}

/** The download URL for a version, from the same API grafana.com's download page uses. */
async function tarballURL({ goos, goarch }) {
  const url = `https://grafana.com/api/downloads/grafana/versions/${GRAFANA_VERSION}/packages`;
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to look up Grafana ${GRAFANA_VERSION} (${response.status} ${response.statusText})\n  ${url}`);
    process.exit(1);
  }
  const { items } = await response.json();
  const pkg = items.find((p) => p.os === goos && p.arch === goarch && p.url.endsWith('.tar.gz'));
  if (!pkg) {
    console.error(`Grafana ${GRAFANA_VERSION} has no tar.gz for ${goos}/${goarch}.`);
    process.exit(1);
  }
  return pkg.url;
}

/** Downloads the release tarball and extracts only bin/grafana into CACHE_DIR. */
async function download(platformPair) {
  const url = await tarballURL(platformPair);
  console.log(`Downloading Grafana ${GRAFANA_VERSION} for ${platformPair.goos}/${platformPair.goarch}...`);

  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to download Grafana (${response.status} ${response.statusText})\n  ${url}`);
    process.exit(1);
  }
  const tarPath = join(tmpdir(), `grafana-${GRAFANA_VERSION}-${process.pid}.tar.gz`);
  writeFileSync(tarPath, Buffer.from(await response.arrayBuffer()));

  // The tarball unpacks to grafana-<version>/; only the binary is needed.
  mkdirSync(CACHE_DIR, { recursive: true });
  const untar = run('tar', [
    '-xzf',
    tarPath,
    '-C',
    CACHE_DIR,
    '--strip-components=2',
    `grafana-${GRAFANA_VERSION}/bin/grafana${EXE}`,
  ]);
  rmSync(tarPath, { force: true });
  if (untar.status !== 0) {
    console.error('Could not unpack the Grafana tarball. Is tar available on your PATH?');
    process.exit(1);
  }

  const binary = join(CACHE_DIR, `grafana${EXE}`);
  chmodSync(binary, 0o755);
  return binary;
}

async function resolveGrafana() {
  const override = process.env[BIN_OVERRIDE];
  if (override) {
    if (!existsSync(override)) {
      console.error(`${BIN_OVERRIDE} is set to ${override}, but no such file exists.`);
      process.exit(1);
    }
    console.log(`Using grafana from ${BIN_OVERRIDE}: ${override}`);
    return resolve(override);
  }

  const cached = join(CACHE_DIR, `grafana${EXE}`);
  if (existsSync(cached)) {
    return cached;
  }

  return download(target());
}

if (!existsSync(MANIFEST)) {
  console.error(`${MANIFEST} not found. Run generate:kinds first.`);
  process.exit(1);
}

const grafana = await resolveGrafana();
rmSync(SPEC_DIR, { recursive: true, force: true });
execFileSync(grafana, ['cli', 'write-openapi', MANIFEST, '-o', SPEC_DIR], { stdio: 'inherit' });

const result = run('npx', ['--no-install', 'grafana-api-clients', 'generate', '--spec', SPEC_DIR, '--out', OUT_DIR]);
process.exit(result.status ?? 1);
