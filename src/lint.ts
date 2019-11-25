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

    let {data: {id}} = await octokit.checks.create({
        ...context.repo,
        name: 'clj-kondo check',
        head_sha: context.sha
    })

    let args = [];
    let kondoOutput = '';
    let output: { findings: [],
                  summary: {
                      error: number,
                      warning: number,
                      info: number,
                      duration: number
                  }
                };
    let kondoError = '';
    let exitCode = await exec.exec(
        kondoBin,
        ['--lint', pathToLint, '--config', '{:output {:format :json}}'],
        {
            ignoreReturnCode: true,
            listeners: {
                stdout: (data: Buffer) => {
                    kondoOutput += data.toString();
                },
                stderr: (data: Buffer) => {
                    kondoError += data.toString();
                }
        }}
    );

    if (exitCode === 2 || exitCode === 3) {
        output = JSON.parse(kondoOutput);
        for (const c of chunk(output.findings, 50)) {
            let annotations: {
                path: string,
                annotation_level: string,
                start_line: number,
                end_line: number,
                message: string}[] = [];
            for (const f of c) {
                const { filename, level, type, row, message } = f;
                annotations.push({
                    path: filename,
                    start_line: row,
                    end_line: row,
                    annotation_level: annotationLevels[level],
                    message: `[${type}] ${message}`
                })
            }
            await octokit.checks.update({
                ...context.repo,
                check_run_id: id,
                output: {
                    annotations,
                    title: 'Report from clj-kondo',
                    summary: `linting took ${output.summary.duration}ms, errors: ${output.summary.error}, warnings: ${output.summary.warning}, info: ${output.summary.info}`
                }
            })
        }
    }
}

run();

export default run;
