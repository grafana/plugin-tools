#!/usr/bin/env node
// Runs grafana-app-sdk kind code generation from the CUE kinds in ./kinds.
//
// Always runs the CLI at the version pinned in VERSION below, resolved as:
//   1. a previously obtained copy in .cache/grafana-app-sdk/<version>/
//   2. a fresh copy, downloaded from the official release and verified against its checksum
//
// A `grafana-app-sdk` on your PATH is deliberately ignored: generated code has to match the library
// version it is compiled against, and silently generating with whatever happens to be installed makes
// that mismatch invisible. To use your own build, set GRAFANA_APP_SDK_BIN to the binary — an explicit,
// per-invocation override for local development.
//
// Downloading the CLI needs no Go toolchain, but note that generation itself always requires Go: the
// generator formats its output with golang.org/x/tools, which shells out to `go`.
//
// Output paths are configured in kinds/config.cue. Generated code is intended to be committed.

import { createHash } from 'node:crypto';
import { spawnSync } from 'node:child_process';
import { chmodSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { arch, platform, tmpdir } from 'node:os';

const VERSION = 'v0.58.0';
const REPO = 'grafana/grafana-app-sdk';
const BIN = 'grafana-app-sdk';

// Escape hatch for developing against a local CLI build, e.g. one you are changing yourself. Unlike a
// binary that merely happens to be on PATH, setting this is a deliberate act, so it is honoured.
const BIN_OVERRIDE = 'GRAFANA_APP_SDK_BIN';

const CACHE_DIR = resolve('.cache', 'grafana-app-sdk', VERSION);

function run(command, args, options = {}) {
  return spawnSync(command, args, { stdio: 'inherit', ...options });
}

const EXE = platform() === 'win32' ? '.exe' : '';

/** Returns the release asset's platform pair, or exits if this platform has no published build. */
function target() {
  const goos = { linux: 'linux', darwin: 'darwin', win32: 'windows' }[platform()];
  const goarch = { x64: 'amd64', arm64: 'arm64' }[arch()];

  if (!goos || !goarch) {
    console.error(
      `No grafana-app-sdk release build for ${platform()}/${arch()}.\n` +
        `Install the CLI yourself and re-run: https://github.com/${REPO}/releases`
    );
    process.exit(1);
  }

  return { goos, goarch };
}

async function fetchOrDie(url, what) {
  const response = await fetch(url);
  if (!response.ok) {
    console.error(`Failed to download ${what} (${response.status} ${response.statusText})\n  ${url}`);
    process.exit(1);
  }
  return Buffer.from(await response.arrayBuffer());
}

/** Downloads the release archive, verifies it against checksums.txt, and unpacks it into CACHE_DIR. */
async function download({ goos, goarch }) {
  // Release assets drop the leading "v" from the tag.
  const archive = `${BIN}_${VERSION.replace(/^v/, '')}_${goos}_${goarch}.tar.gz`;
  const base = `https://github.com/${REPO}/releases/download/${VERSION}`;

  console.log(`Downloading ${BIN} ${VERSION} for ${goos}/${goarch}...`);
  const [tarball, checksums] = await Promise.all([
    fetchOrDie(`${base}/${archive}`, archive),
    fetchOrDie(`${base}/checksums.txt`, 'checksums.txt'),
  ]);

  const expected = checksums
    .toString('utf8')
    .split('\n')
    .map((line) => line.trim().split(/\s+/))
    .find(([, name]) => name === archive)?.[0];

  if (!expected) {
    console.error(`${archive} is not listed in checksums.txt; refusing to run an unverified binary.`);
    process.exit(1);
  }

  const actual = createHash('sha256').update(tarball).digest('hex');
  if (actual !== expected) {
    console.error(`Checksum mismatch for ${archive}.\n  expected ${expected}\n  actual   ${actual}`);
    process.exit(1);
  }

  // Unpack via tar(1): available on macOS/Linux and shipped with Windows 10+.
  const staging = join(tmpdir(), `${BIN}-${VERSION}-${process.pid}`);
  mkdirSync(staging, { recursive: true });
  const tarPath = join(staging, archive);
  writeFileSync(tarPath, tarball);

  const untar = run('tar', ['-xzf', tarPath, '-C', staging]);
  if (untar.status !== 0) {
    console.error(`Could not unpack ${archive}. Is tar available on your PATH?`);
    process.exit(1);
  }

  mkdirSync(CACHE_DIR, { recursive: true });
  const binary = join(CACHE_DIR, `${BIN}${EXE}`);
  // The archive layout has varied between releases, so find the binary rather than assuming a path.
  const found = findBinary(staging, `${BIN}${EXE}`);
  if (!found) {
    console.error(`Could not find ${BIN}${EXE} inside ${archive}.`);
    process.exit(1);
  }
  writeFileSync(binary, readFileSync(found));
  chmodSync(binary, 0o755);
  rmSync(staging, { recursive: true, force: true });

  return binary;
}

function findBinary(dir, name) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = findBinary(path, name);
      if (nested) {
        return nested;
      }
    } else if (entry.name === name) {
      return path;
    }
  }
  return undefined;
}

async function resolveBinary() {
  const override = process.env[BIN_OVERRIDE];
  if (override) {
    // Exit rather than falling back to the pinned version: you asked for a specific binary, so
    // silently generating with a different one is the surprise worth avoiding.
    if (!existsSync(override)) {
      console.error(`${BIN_OVERRIDE} is set to ${override}, but no such file exists.`);
      process.exit(1);
    }

    console.log(`Using ${BIN} from ${BIN_OVERRIDE}: ${override}`);
    return resolve(override);
  }

  const cached = join(CACHE_DIR, `${BIN}${EXE}`);
  if (existsSync(cached)) {
    return cached;
  }

  return download(target());
}

const binary = await resolveBinary();
const result = run(binary, ['generate', '--source', 'kinds']);
process.exit(result.status ?? 1);
