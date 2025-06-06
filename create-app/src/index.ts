#!/usr/bin/env node

import { input } from '@inquirer/prompts'
import select from '@inquirer/select'
import chalk from 'chalk'
import childProcess from 'child_process'
import { Command } from 'commander'
import { execa, execaCommand } from 'execa'
import fs from 'fs'
import open from 'open'
import ora from 'ora'
import path from 'path'

const program = new Command()
const log = console.log
const repoUrl = 'https://github.com/sunra/sunra-nextjs-template.git'
const green = chalk.green
const purple = chalk.hex('#6e40c9')

async function main() {
  const spinner = ora({
    text: 'Creating codebase',
  })
  try {
    const kebabRegez = /^([a-z]+)(-[a-z0-9]+)*$/

    program
      .name('The sunra App Generator')
      .description('Generate full stack AI apps integrated with sunra')

    program.parse(process.argv)

    const args = program.args
    let appName = args[0]

    if (!appName || !kebabRegez.test(args[0] as string)) {
      appName = await input({
        message: 'Enter your app name',
        default: 'my-app',
        validate: (d) => {
          if (!kebabRegez.test(d)) {
            return 'please enter your app name in the format of my-app-name'
          }
          return true
        },
      })
    }

    const hasSunraEnv = await select({
      message: 'Do you have a sunra API key?',
      choices: [
        {
          name: 'Yes',
          value: true,
        },
        {
          name: 'No',
          value: false,
        },
      ],
    })

    if (!hasSunraEnv) {
      await open('https://app.sunra.ai/dashboard')
    }

    const apiKey = await input({ message: 'Sunra AI API Key' })

    const envs = `
    # SUNRA AI API Key
    SUNRA_KEY="${apiKey}"
    `

    log('\nInitializing project. \n')

    spinner.start()
    await execa('git', ['clone', repoUrl, appName])

    let packageJson = fs.readFileSync(`${appName}/package.json`, 'utf8')
    const packageObj = JSON.parse(packageJson)
    packageObj.name = appName
    packageJson = JSON.stringify(packageObj, null, 2)
    fs.writeFileSync(`${appName}/package.json`, packageJson)
    fs.writeFileSync(`${appName}/.env.local`, envs)

    process.chdir(path.join(process.cwd(), appName))
    await execa('rm', ['-rf', '.git'])
    await execa('git', ['init'])

    spinner.text = ''
    let startCommand = ''

    if (isBunInstalled()) {
      spinner.text = 'Installing dependencies'
      await execaCommand('bun install').pipeStdout?.(process.stdout)
      spinner.text = ''
      startCommand = 'bun dev'
      console.log('\n')
    } else if (isYarnInstalled()) {
      await execaCommand('yarn').pipeStdout?.(process.stdout)
      startCommand = 'yarn dev'
    } else {
      spinner.text = 'Installing dependencies'
      await execa('npm', ['install', '--verbose']).pipeStdout?.(process.stdout)
      spinner.text = ''
      startCommand = 'npm run dev'
    }

    spinner.stop()
    await execa('git', ['add', '.'])
    await execa('git', ['commit', '-m', 'Initial commit'])

    process.chdir('../')
    log(
      `${green.bold('Success!')} Created ${purple.bold(
        appName,
      )} at ${process.cwd()} \n`,
    )
    log(
      `To get started, change into the new directory and run ${chalk.cyan(
        startCommand,
      )}\n`,
    )
  } catch (err: unknown) {
    log('\n')
    if ((err as any).exitCode == 128) {
      log('Error: directory already exists.')
    }
    spinner.stop()
  }
}

main()

function isYarnInstalled() {
  try {
    childProcess.execSync('yarn --version')
    return true
  } catch {
    return false
  }
}

function isBunInstalled() {
  try {
    childProcess.execSync('bun --version')
    return true
  } catch {
    return false
  }
}
