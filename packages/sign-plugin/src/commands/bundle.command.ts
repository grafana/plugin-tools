import { chmodSync, mkdirSync, readdirSync, copyFileSync, rmSync, readFileSync } from "fs";
import { platform } from 'os';
import { getPluginJson } from "../utils/pluginValidation";
import { resolve, join } from 'path';
import { createHash } from "crypto";
import { execSync } from "child_process";

export const zipFolder = (zipName: string, folderPath: string): void => {
    if(!zipName.endsWith('.zip')) { zipName = `${zipName}.zip`}
    if(platform() === 'win32') {
        // we call powershell in case of system default being cmd
        execSync(`powershell Compress-Archive -Path ${folderPath} -Destination ${zipName}`)
        return;
    }
    execSync(`zip -r ${zipName} ${folderPath}`);
}

function copyDirectory(source: string, destination: string) {
    mkdirSync(destination, { recursive: true });

    readdirSync(source, { withFileTypes: true }).forEach((entry) => {
        let sourcePath = join(source, entry.name);
        let destinationPath = join(destination, entry.name);

        entry.isDirectory()
        ? copyDirectory(sourcePath, destinationPath)
        : copyFileSync(sourcePath, destinationPath);
    });
}

export const bundle = (pluginDistDir: string) => {
    const pluginJson = getPluginJson(resolve(pluginDistDir, 'plugin.json'));
    const pluginId = pluginJson.id;

    try {
        console.log('Creating Bundle Directory...')
        // plugin files must be contained inside a dir with same name as the plugin id
        mkdirSync(pluginId)

        console.log('Copying Files to Bundle...')
        copyDirectory(pluginDistDir, pluginId)

        console.log('verifying file permissions...')
        if (platform() === 'win32') { 
            console.warn("Warning: Windows-based systems cannot update unix permissions. Please use WSL or a Unix based system to automatically handle permissions.");
        }
        const newFiles = readdirSync(pluginId);
        newFiles.forEach(fileName => {
            if (fileName.startsWith(pluginJson.executable)) {
                chmodSync(`${pluginId}/${fileName}`, '0755')
            }
        })

        console.log('Zipping Bundle...')
        // plugin must be zipped inside folder named after pluginId + version
        const outputFilename = `${pluginId}-${pluginJson.info.version}.zip`;

        zipFolder(outputFilename, pluginId)

        console.log('Cleaning Up...')
        rmSync(pluginId, {recursive: true, force: true});

        // md5 or sha1 is required for submission, log for convinience
        const buff = readFileSync(outputFilename);
        const md5Hash = createHash("md5").update(buff).digest("hex");
        const sha1Hash = createHash("sha1").update(buff).digest("hex");

        console.log(`Bundled Successfully - ${outputFilename}`)
        console.log(`md5: ${md5Hash}`)
        console.log(`sha1: ${sha1Hash}`)
    } catch (err) {
        console.warn('Error bundling plugin: ', err);
        process.exitCode = 1;
    }
}
