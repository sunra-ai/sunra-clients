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
    const result = await sunra.subscribe('kling/kling-v2-master/text-to-video', {
      input: {
        prompt: 'A pole bear playing violin in the snow.',
        negative_prompt: '',
        guidance_scale: 0.5,
        aspect_ratio: '16:9',
        duration: 5
      },
      logs: true,
      onEnqueue: (requestId) => {
        console.log(chalk.green('Enqueued:'), requestId)
      },
      onQueueUpdate: (update) => {
        if (update.status === 'IN_PROGRESS') {
          console.log(update.logs)
        }
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