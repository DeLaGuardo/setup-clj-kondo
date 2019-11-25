let tempDirectory = process.env['RUNNER_TEMP'] || '';

import * as core from '@actions/core';
import * as io from '@actions/io';
import * as tc from '@actions/tool-cache';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';

const IS_WINDOWS = process.platform === 'win32';

if (!tempDirectory) {
    let baseLocation: string;
    if (IS_WINDOWS) {
        baseLocation = process.env['USERPROFILE'] || 'C:\\';
    } else {
        if (process.platform === 'darwin') {
            baseLocation = '/Users';
        } else {
            baseLocation = '/home';
        }
    }
    tempDirectory = path.join(baseLocation, 'actions', 'temp');
}

let platform = '';

if (IS_WINDOWS) {
    platform = 'windows';
} else {
    if (process.platform === 'darwin') {
        platform = 'macos';
    } else {
        platform = 'linux';
    }
}

export async function getCljKondo(version: string): Promise<void> {
    let toolPath = tc.find('CljKondo', getCacheVersionString(version), os.arch());

    if (toolPath) {
        core.debug(`Clj Kondo found in cache ${toolPath}`);
    } else {
        const downloadPath = `https://github.com/borkdude/clj-kondo/releases/download/v${version}/clj-kondo-${version}-${platform}-amd64.zip`;

        core.info(`Downloading Clj Kondo from ${downloadPath}`);

        let kondoFile = await tc.downloadTool(downloadPath);
        let tempDir: string = path.join(
            tempDirectory,
            'temp_' + Math.floor(Math.random() * 2000000000)
        );
        const kondoDir = await unzipKondoDownload(
            kondoFile,
            tempDir
        );

        core.debug(`clj-kondo extracted to ${kondoDir}`);

        toolPath = await tc.cacheDir(
            kondoDir,
            'CljKondo',
            getCacheVersionString(version)
        );
    }

    core.addPath(toolPath);
}

function getCacheVersionString(version: string) {
    const versionArray = version.split('.');
    const major = versionArray[0];
    const minor = versionArray.length > 1 ? versionArray[1] : '0';
    const patch = versionArray.length > 2 ? versionArray.slice(2).join('-') : '0';
    return `${major}.${minor}.${patch}`;
}

async function extractFiles(
    file: string,
    destinationFolder: string
): Promise<void> {
    const stats = fs.statSync(file);
    if (!stats) {
        throw new Error(`Failed to extract ${file} - it doesn't exist`);
    } else if (stats.isDirectory()) {
        throw new Error(`Failed to extract ${file} - it is a directory`);
    }

    await tc.extractZip(file, destinationFolder);
}

async function unzipKondoDownload(
    repoRoot: string,
    destinationFolder: string
): Promise<string> {
    await io.mkdirP(destinationFolder);

    const kondoFile = path.normalize(repoRoot);
    const stats = fs.statSync(kondoFile);
    if (stats.isFile()) {
        await extractFiles(kondoFile, destinationFolder);
        const kondoBin = fs.readdirSync(destinationFolder)[0];
        return kondoBin;
    } else {
        throw new Error(`${kondoFile} is not a file`);
    }
}
