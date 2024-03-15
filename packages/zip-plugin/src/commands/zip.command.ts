import {
  existsSync,
  mkdirSync,
  cpSync,
  readdirSync,
  statSync,
  createReadStream,
  createWriteStream,
  rmdirSync,
  readFileSync,
  writeFileSync,
} from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import archiver from 'archiver';
import minimist from 'minimist';
import { buildManifest } from '../utils/manifest.js';
import { sign } from '../utils/sign.js';

function generateFolder(prefix: string): string {
  const randomHash = crypto.createHash('md5').update(new Date().getTime().toString()).digest('hex');
  const folderName = `${prefix}-${randomHash}`;

  if (!existsSync(folderName)) {
    mkdirSync(folderName);
  } else {
    throw new Error(`Folder ${folderName} already exists`);
  }
  return folderName;
}

// Takes a directory, gives absolute paths for all files in it
// and its subdirectories
function listFiles(dir: string): string[] {
  const out: string[] = [];
  readdirSync(dir).forEach((file) => {
    if (statSync(path.join(dir, file)).isDirectory()) {
      out.push(...listFiles(path.join(dir, file)));
    } else {
      out.push(path.join(dir, file));
    }
  });
  return out;
}

function addSha1ForFiles(files: any[]) {
  files.forEach((file) => {
    const fileContent = readFileSync(file);
    const sha1 = crypto.createHash('sha1').update(fileContent).digest('hex');
    writeFileSync(`${file}.sha1`, sha1);
  });
}

function compressFilesToZip(zipFilePath: string, pluginId: string, fileMapping: { [key: string]: string }) {
  return new Promise<void>((resolve, reject) => {
    // Create the folder for output if it does not exist
    const outputDir = path.dirname(zipFilePath);
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }
    // create a write stream for the output zip file
    console.log('Creating zip write stream for ' + zipFilePath);
    const output = createWriteStream(zipFilePath);
    const archive = archiver('zip', {
      zlib: { level: 9 }, // Sets the compression level.
    });

    // listen for all archive data to be written
    output.on('close', function () {
      console.log(archive.pointer() + ' total bytes');
      console.log(`archiver for ${zipFilePath} has been finalized and the output file descriptor has closed.`);
      resolve();
    });

    // handle errors
    output.on('error', reject);

    // pipe archive data to the file
    archive.pipe(output);

    // append files to the archive
    Object.keys(fileMapping).forEach((filePath) => {
      const fileName = pluginId + '/' + fileMapping[filePath]; // get the file name
      archive.append(createReadStream(filePath), { name: fileName, mode: 0o755 });
    });

    // finalize the archive
    archive.finalize();
  });
}

export const absoluteToRelativePaths = (dir: string) => {
  const out: { [key: string]: string } = {};
  listFiles(dir).forEach((file) => {
    out[file] = file.replace(dir, '');
  });
  return out;
};

export const zip = async (argv: minimist.ParsedArgs) => {
  const distDir = argv.distDir ?? 'dist';
  const pluginDistDir = path.resolve(distDir);

  if (!existsSync(pluginDistDir)) {
    throw new Error(
      `Plugin \`${distDir}\` directory is missing. Did you build the plugin before attempting to to zip it?`
    );
  }

  const buildDir = generateFolder('package-zip');
  const pluginJson = JSON.parse(readFileSync(`${pluginDistDir}/plugin.json`, 'utf-8'));
  const {
    id: pluginId,
    info: { version: pluginVersion },
  } = pluginJson;

  const copiedPath = path.join(process.cwd(), buildDir, pluginId);

  cpSync(pluginDistDir, copiedPath, { recursive: true });

  const filesWithZipPaths = absoluteToRelativePaths(copiedPath);

  sign(copiedPath);

  // Binary distribution for any platform
  await compressFilesToZip(
    `${buildDir}/${pluginVersion}/${pluginId}-${pluginVersion}.zip`,
    pluginId,
    filesWithZipPaths
  );

  // Take filesWithZipPaths and split them into goBuildFiles and nonGoBuildFiles
  const goBuildFiles: { [key: string]: string } = {};
  const nonGoBuildFiles: { [key: string]: string } = {};
  Object.keys(filesWithZipPaths).forEach((filePath: string) => {
    const zipPath = filesWithZipPaths[filePath];
    const fileName = filePath.split('/').pop();
    if (!fileName) {
      throw new Error('fileName is undefined or null');
    }
    if (fileName.startsWith('gpx')) {
      goBuildFiles[filePath] = zipPath;
    } else {
      nonGoBuildFiles[filePath] = zipPath;
    }
  });

  // Noop if there are no go build files
  // Otherwise, compress each go build file along with all non-go files into a separate zip
  // Creates os/arch specific distributions
  for (let [filePath, zipPath] of Object.entries(goBuildFiles)) {
    const fileName = filePath
      .split('/')
      .pop()
      ?.replace(/\.exe$/, '');

    if (fileName === null || fileName === undefined) {
      throw new Error('fileName is undefined or null');
    }

    const [goos, goarch] = fileName?.split('_').slice(2) ?? [];

    // If any of these are null, throw an error
    if (fileName === null || goos === null || goarch === null) {
      throw new Error('fileName, goos, or goarch is undefined or null');
    }

    const outputName = `${pluginId}-${pluginVersion}.${goos}_${goarch}.zip`;
    const zipDestination = `${buildDir}/${pluginVersion}/${goos}/${outputName}`;

    mkdirSync(path.dirname(zipDestination), { recursive: true });

    const workingDir = path.join(path.dirname(zipDestination), 'working');

    mkdirSync(workingDir, { recursive: true });
    // Copy filePath to workingDir
    cpSync(filePath, path.join(workingDir, filePath));

    // Copy all nonGoBuildFiles into workingDir
    Object.entries(nonGoBuildFiles).forEach(([absPath, relPath]) => {
      cpSync(absPath, path.join(workingDir, relPath));
    });

    // Add the manifest
    sign(workingDir);
    const toCompress = absoluteToRelativePaths(workingDir);
    await compressFilesToZip(zipDestination, pluginId, toCompress);

    rmdirSync(workingDir, { recursive: true });
  }

  // Copy all of the files from buildDir/pluginVersion to buildDir/latest
  // Removes pluginVersion from their path and filename and replaces it with latest
  const latestPath = `${buildDir}/latest`;
  const currentVersionPath = `${buildDir}/${pluginVersion}`;
  mkdirSync(latestPath, { recursive: true });
  const filesToCopy = listFiles(currentVersionPath);
  filesToCopy.forEach((filePath) => {
    const fileNameArray = filePath.split('/');
    const newFileName = fileNameArray.pop()?.replace(`${pluginVersion}`, 'latest');
    // If newfilename is null, then throw an error
    if (newFileName === null) {
      throw new Error('Bad filename while trying to copy files to latest');
    }
    if (newFileName) {
      const newFileSubdirectory = filePath.replace(currentVersionPath, latestPath).split('/').slice(0, -1).join('/');
      const newFilePath = `${newFileSubdirectory}/${newFileName}`;
      mkdirSync(path.dirname(newFilePath), { recursive: true });
      cpSync(filePath, newFilePath);
    }
  });

  // Sign all zip files with sha1
  const zipFiles = listFiles(currentVersionPath).filter((file) => file.endsWith('.zip'));
  addSha1ForFiles(zipFiles);
  const latestZipFiles = listFiles(latestPath).filter((file) => file.endsWith('.zip'));
  addSha1ForFiles(latestZipFiles);

  // Move buildDir/latest and buildDir/pluginVersion to rootDir/__to-upload__
  const toUploadPath = path.join(process.cwd(), '__to-upload__');
  mkdirSync(toUploadPath, { recursive: true });
  cpSync(latestPath, path.join(toUploadPath, 'latest'), { recursive: true });
  cpSync(currentVersionPath, path.join(toUploadPath, pluginVersion), { recursive: true });

  // Clean up after yourself
  rmdirSync(buildDir, { recursive: true });
};
