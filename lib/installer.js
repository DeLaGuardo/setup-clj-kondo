"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getCljKondo = void 0;
const core = __importStar(require("@actions/core"));
const io = __importStar(require("@actions/io"));
const tc = __importStar(require("@actions/tool-cache"));
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const os = __importStar(require("os"));
let tempDirectory = process.env['RUNNER_TEMP'] || '';
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
            const kondoFile = yield tc.downloadTool(downloadPath);
            const tempDir = path.join(tempDirectory, `temp_${Math.floor(Math.random() * 2000000000)}`);
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
