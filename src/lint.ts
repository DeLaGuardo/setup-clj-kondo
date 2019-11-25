import * as core from "@actions/core";
import * as exec from "@actions/exec";
import { GitHub, context } from "@actions/github";

const IS_WINDOWS = process.platform === 'win32';

function chunk(list: object[], size: number) {
    if (!list) return [];
    const firstChunk = list.slice(0, size);
    if (!firstChunk.length) {
        return list;
    }
    return [firstChunk].concat(chunk(list.slice(size, list.length), size));
}

const annotationLevels = {
    info: "notice",
    warning: "warning",
    error: "failure"
};

async function run(): Promise<void> {
    const pathToLint = core.getInput('path-to-lint');
    const kondoBin = IS_WINDOWS ? 'clj-kondo.exe' : 'clj-kondo';
    const githubToken = core.getInput('github-token', {required: true});
    const octokit = new GitHub(githubToken);

    let data = await octokit.checks.create({
        ...context.repo,
        name: 'clj-kondo check',
        head_sha: context.sha
    })

    core.info(JSON.stringify(data))

    let args = [];
    let kondoOutput = '';
    let output = { findings: []}
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

    let exitCode = await exec.exec(kondoBin, ['--lint', pathToLint, '--config', '{:output {:format :json}}'], options);

    if (exitCode === 2 || exitCode === 3) {
        output = JSON.parse(kondoOutput);
        for (const c of chunk(output.findings, 50)) {
            let annotations: {}[] = [];
            for (const f of c) {
                const { filename, level, type, col, row, message } = f;
                annotations.push({
                    path: filename,
                    start_line: row,
                    end_line: row,
                    annotations_level: annotationLevels[level],
                    message: `[${type}] ${message}`
                })
            }
            // await octokit.checks.update({
            //     ...context.repo,
            //     check_run_id: checkId
            // })
            core.info(JSON.stringify(annotations));
        }
    }

    core.info(`output: ${kondoOutput}, error: ${kondoError}`);
}

run();

export default run;
