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
    const result = await sunra.subscribe('kling/kling-v2-master/image-to-video', {
      input: {
        prompt: 'A cute hamster lies leisurely on a lifebuoy, wearing fashionable sunglasses, and drifts with the gentle waves on the shimmering sea surface. The hamster reclines comfortably, enjoying a peaceful and pleasant time. Cartoon style, the camera follows the subject moving, with a heartwarming and high picture quality.',
        negative_prompt: '',
        guidance_scale: 0.5,
        aspect_ratio: '16:9',
        duration: 5,
        start_image: 'https://assets.sunra.ai/uploads/1748811753168-05ceab0d.png'
      },
      logs: true,
      onQueueUpdate: (update) => {
        console.log(`Status Update: ${update.status}, Request ID: ${update.request_id}`)
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
