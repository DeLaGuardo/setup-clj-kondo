import * as core from '@actions/core'
import {getCljKondo} from './installer'

async function run(): Promise<void> {
  try {
    const version = core.getInput('version', {required: true})
    await getCljKondo(version)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
