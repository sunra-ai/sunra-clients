import { sunra } from '@sunra/client'
import chalk from 'chalk'
import axios from 'axios'
import { HttpsProxyAgent } from 'https-proxy-agent'


const apiKey = process.env.SUNRA_KEY || ''
if (!apiKey) {
  console.error(chalk.red('SUNRA_KEY is not set'))
  process.exit(1)
}

const myAwesomeAxios = axios.create({
  // set the proxy for the axios client
  httpsAgent: new HttpsProxyAgent(process.env.HTTPS_PROXY || 'http://127.0.0.1:7890')
})

myAwesomeAxios.interceptors.request.use((config) => {
  config.headers = config.headers || {}
  config.headers['Authorization'] = `Key ${apiKey}`
  config.headers['User-Agent'] = 'my-awesome-axios-client'
  console.log('request.headers is: ', config.headers)
  return config
})

sunra.config({
  axios: myAwesomeAxios
})

// you can also set the credentials in the config
// const proxyAxios = axios.create({
//   httpsAgent: new HttpsProxyAgent(process.env.HTTPS_PROXY || 'http://127.0.0.1:7890'),
//   timeout: 30000, // 30 seconds timeout
// })
// sunra.config({
//   axios: proxyAxios,
//   credentials: process.env.SUNRA_KEY // Optional: set credentials here too
// })

const main = async () => {
  try {
    console.log(chalk.green('Subscribing to the queue...'))

    // find more models here: https://sunra.ai/models
    const result = await sunra.subscribe('black-forest-labs/flux-kontext-pro/text-to-image', {
      input: {
        prompt: 'a bedroom with messy goods on the bed and floor',
        prompt_enhancer: false,
        seed: 0,
        aspect_ratio: '16:9',
        output_format: 'jpeg',
        safety_tolerance: 6
      },
      logs: true,
      onEnqueue: (requestId) => {
        console.log(chalk.green('Enqueued:'), requestId)
      },
      onQueueUpdate: (status) => {
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
