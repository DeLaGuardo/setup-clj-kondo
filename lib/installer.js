"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
let tempDirectory = process.env['RUNNER_TEMP'] || '';
const core = __importStar(require("@actions/core"));
const io = __importStar(require("@actions/io"));
const tc = __importStar(require("@actions/tool-cache"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
const IS_WINDOWS = process.platform === 'win32';
if (!tempDirectory) {
    let baseLocation;
    if (IS_WINDOWS) {
        baseLocation = process.env['USERPROFILE'] || 'C:\\';
    }
    else {
        if (process.platform === 'darwin') {
            baseLocation = '/Users';
        }
        else {
            baseLocation = '/home';
        }
    }
    tempDirectory = path.join(baseLocation, 'actions', 'temp');
}
let platform = '';
if (IS_WINDOWS) {
    platform = 'windows';
}
else {
    if (process.platform === 'darwin') {
        platform = 'macos';
    }
    else {
        platform = 'linux';
    }
}
function getCljKondo(version) {
    return __awaiter(this, void 0, void 0, function* () {
        let toolPath = tc.find('CljKondo', getCacheVersionString(version), os.arch());
        if (toolPath) {
            core.debug(`Clj Kondo found in cache ${toolPath}`);
        }
        else {
            const downloadPath = `https://github.com/borkdude/clj-kondo/releases/download/v${version}/clj-kondo-${version}-${platform}-amd64.zip`;
            core.info(`Downloading Clj Kondo from ${downloadPath}`);
            let kondoFile = yield tc.downloadTool(downloadPath);
            let tempDir = path.join(tempDirectory, 'temp_' + Math.floor(Math.random() * 2000000000));
            const kondoBin = yield unzipKondoDownload(kondoFile, tempDir);
            core.info(`clj-kondo extracted to ${tempDir}/${kondoBin}`);
            toolPath = yield tc.cacheDir(tempDir, 'CljKondo', getCacheVersionString(version));
        }
        core.addPath(toolPath);
    });
}
exports.getCljKondo = getCljKondo;
function getCacheVersionString(version) {
    const versionArray = version.split('.');
    const major = versionArray[0];
    const minor = versionArray.length > 1 ? versionArray[1] : '0';
    const patch = versionArray.length > 2 ? versionArray.slice(2).join('-') : '0';
    return `${major}.${minor}.${patch}`;
}
function extractFiles(file, destinationFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        const stats = fs.statSync(file);
        if (!stats) {
            throw new Error(`Failed to extract ${file} - it doesn't exist`);
        }
        else if (stats.isDirectory()) {
            throw new Error(`Failed to extract ${file} - it is a directory`);
        }
        yield tc.extractZip(file, destinationFolder);
    });
}
function unzipKondoDownload(repoRoot, destinationFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        yield io.mkdirP(destinationFolder);
        const kondoFile = path.normalize(repoRoot);
        const stats = fs.statSync(kondoFile);
        if (stats.isFile()) {
            yield extractFiles(kondoFile, destinationFolder);
            const kondoBin = fs.readdirSync(destinationFolder)[0];
            return kondoBin;
        }
        else {
            throw new Error(`${kondoFile} is not a file`);
        }
    });
}
