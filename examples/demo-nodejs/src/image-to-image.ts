import { sunra } from '@sunra/client'
import chalk from 'chalk'

// get your API key from https://sunra.ai/dashboard/api-tokens
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
    const result = await sunra.subscribe('black-forest-labs/flux-kontext-dev/image-to-image', {
      input: {
        image: 'https://assets.sunra.ai/uploads/1751343718083-1751343717640.png',
        prompt: 'Change the text in the image to "FLUX Kontext Dev".',
        aspect_ratio: 'None',
        number_of_steps: 28,
        guidance_scale: 2.5,
        output_format: 'webp',
        output_quality: 80,
        disable_safety_checker: false,
        fast_mode: true
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log(`Status Update: ${update.status}, Request ID: ${update.request_id}`)
      },
    })
    console.log(result.data)
    console.log(result.requestId)
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
