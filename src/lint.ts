import * as core from "@actions/core";
import * as exec from "@actions/exec";

const IS_WINDOWS = process.platform === 'win32';

async function run(): Promise<void> {
    const pathToLint = core.getInput('path-to-lint');
    const kondoBin = IS_WINDOWS ? 'clj-kondo.exe' : 'clj-kondo';

    let args = [];
    let kondoOutput = '';
    let kondoError = '';
    const options = {listeners: {}};
    options.listeners = {
        stdout: (data: Buffer) => {
            kondoOutput += data.toString();
        },
        stderr: (data: Buffer) => {
            kondoError += data.toString();
        }
    };

    await exec.exec(kondoBin, ['--lint', pathToLint, '--config', '{:output {:format :json}}'], options);

    core.info(`output: ${kondoOutput}, error: ${kondoError}`);
}

run();

export default run;
