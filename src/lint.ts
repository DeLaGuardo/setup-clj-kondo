import * as core from "@actions/core";

function run(): string {
    const pathToLint = core.getInput('path-to-lint', {required: true});
    core.info(pathToLint);
    return pathToLint;
}

run();

export default run;
