import OpenAI from 'openai'
import chalk from 'chalk'
import { setGlobalDispatcher, ProxyAgent } from 'undici'

const apiKey = process.env.SUNRA_KEY || ''
if (!apiKey) {
  console.error(chalk.red('SUNRA_KEY is not set'))
  console.error(chalk.yellow('Get your API key from https://sunra.ai/dashboard/api-tokens'))
  process.exit(1)
}

/**
 * Demo script for LLM endpoint using OpenAI SDK directly.
 * This demonstrates how to use Sunra's LLM API with the standard OpenAI client.
 */
const main = async () => {
  try {
    console.log(chalk.green('Initializing OpenAI client with Sunra endpoint...'))

    // Configure undici (which fetch uses) to respect proxy settings
    const proxyUrl = process.env.HTTPS_PROXY || process.env.HTTP_PROXY
    if (proxyUrl) {
      console.log(chalk.yellow(`Using proxy: ${proxyUrl}`))
      setGlobalDispatcher(new ProxyAgent(proxyUrl))
    }

    // Initialize OpenAI client with Sunra endpoint (now proxy-aware!)
    const client = new OpenAI({
      apiKey,
      baseURL: 'http://api-llm.sunra.ai/v1'
    })

    console.log(chalk.green('Sending streaming chat completion request...'))

    // Make a streaming chat completion request
    const stream = await client.chat.completions.create({
      model: 'google/gemini-2.5-flash-lite', // You can use any llm model available on Sunra
      messages: [
        {
          'role': 'system',
          'content': 'You are an expert in AIGC, you can help me optimize the prompt for better results, especially for text to image models. I will give you a prompt, you can help me optimize it.'

        },
        {
          role: 'user',
          content: 'the original prompt is: "A scene from a high-quality animated film, like a work by Makoto Shinkai. In a deep midsummer forest, a train speeds down tracks showered in sunlight filtering through the trees (komorebi). The camera weaves through the trees, chasing the train to emphasize the sense of speed. A girl with her head out the window is bathed in the rapidly changing light and shadow, her hair fluttering in a wind that carries the scent of green. The trees in the background become a green afterimage, vividly highlighting her expression, full of liberation, from moment to moment. "'
        }
      ],
      stream: true
    })

    console.log(chalk.blue('\n' + '='.repeat(50)))
    console.log(chalk.blue('Streaming Response:'))
    console.log(chalk.blue('='.repeat(50)))

    let fullResponse = ''
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content
      if (content) {
        process.stdout.write(content)
        fullResponse += content
      }
    }

    console.log(chalk.blue('\n' + '='.repeat(50)))
    console.log(chalk.green(`Full Response: ${fullResponse}`))
    console.log(chalk.blue('='.repeat(50)))


  } catch (error) {
    const data = (error as any).response?.data
    // Check if this is an axios/fetch error with response data
    if (data) {
      console.error(chalk.red('Error:'), data)
    } else {
      console.error(chalk.red('Error:'), error)
    }
    process.exit(1)
  }
}

main().catch(console.error)
