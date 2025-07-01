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
    console.log(chalk.green('Sumitting to the queue...'))
    const res = await sunra.subscribe('black-forest-labs/flux-kontext-pro/text-to-image', {
      input: {
        prompt: 'a bedroom with messy goods on the bed and floor',
        prompt_enhancer: false,
        seed: 0,
        aspect_ratio: '16:9',
        output_format: 'jpeg',
        safety_tolerance: 6
      },
      onEnqueue(requestId) {
        console.log(chalk.green('Request ID:'), requestId)
      },
      onQueueUpdate(status) {
        console.log('Queue update:', status)
      },
      mode: 'streaming',
    })
    console.log(chalk.green('Stream done'))
    console.log(chalk.green('Response:'), res)
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