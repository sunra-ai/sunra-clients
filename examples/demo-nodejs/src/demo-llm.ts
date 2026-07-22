import OpenAI from 'openai'
import chalk from 'chalk'
import { setGlobalDispatcher, ProxyAgent } from 'undici'

type SunraChatCompletionParams = OpenAI.Chat.Completions.ChatCompletionCreateParamsStreaming & {
  provider?: {
    only?: string[];
  };
};

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

    // Initialize the standard OpenAI client with Sunra's compatible endpoint.
    const client = new OpenAI({
      apiKey,
      baseURL: 'https://api-llm.sunra.ai/v1',
    })

    console.log(chalk.green('Sending streaming chat completion request...'))

    const request: SunraChatCompletionParams = {
      model: 'google/gemini-2.5-flash',
      // Omit provider to use automatic routing.
      provider: { only: ['google-vertexai'] },
      messages: [
        {
          role: 'system',
          content: 'You are a helpful assistant.',
        },
        {
          role: 'user',
          content: 'Explain provider routing in two short sentences.',
        },
      ],
      stream: true,
    }
    const stream = await client.chat.completions.create(request)

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
