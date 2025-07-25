import { sunra } from '@sunra/client'
import chalk from 'chalk'

const apiKey = process.env.SUNRA_KEY || ''
if (!apiKey) {
  console.error(chalk.red('SUNRA_KEY is not set'))
  process.exit(1)
}

// sunra reads the credentials from the environment variable SUNRA_KEY by default, you can also set the credentials in the config
// sunra.config({
//   credentials: apiKey
// })

const main = async () => {
  try {

    console.log(chalk.green('Subscribing to the queue...'))

    // find more models here: https://sunra.ai/models
    const result = await sunra.subscribe('elevenlabs/scribe-v1/speech-to-text', {
      input: {
        audio: 'https://audio-samples.github.io/samples/mp3/blizzard_unconditional/sample-0.mp3'
      },
      onEnqueue(requestId) {
        console.log(chalk.green('Enqueued:'), requestId)
      },
      onQueueUpdate(status) {
        console.log(chalk.green('Queue update:'), status)
      },
    })
    console.log(result)
  } catch (error) {
    const data = (error as any).response?.data
    // check if this is an axios error
    if (data) {
      console.error(chalk.red('Error:'), data)
    } else {
      console.error(chalk.red('Error:'), error)
    }

    process.exit(1)
  }
}

main().catch(console.error)
