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

// Type guard for SunraError (until the new types are available)
function isSunraError(error: any): boolean {
  return error && error.name === 'SunraError' && typeof error.code === 'string'
}

const testValidationError = async () => {
  console.log(chalk.blue('=== Testing Validation Error (Enhanced) ==='))
  try {
    // find more models here: https://sunra.ai/models
    const result = await sunra.subscribe('black-forest-labs/flux-kontext-pro/text-to-image', {
      input: {
        prompt: 'a bedroom with messy goods on the bed and floor',
        prompt_enhancer: false,
        seed: -2, // Invalid seed (should be >= 0)
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
  } catch (error: any) {
    // With the new error handling, this will be a structured SunraError
    if (isSunraError(error)) {
      console.log(chalk.red('Caught Enhanced SunraError:'))
      console.log(`  Type: ${error.type || 'N/A'}`)
      console.log(`  Code: ${error.code}`)
      console.log(`  Message: ${error.message}`)
      console.log('  Details:', error.details || 'N/A')
      console.log(`  Request ID: ${error.requestId || 'N/A'}`)
      console.log('  Rate Limit:', error.rateLimit || 'N/A')
      console.log(`  Timestamp: ${error.timestamp || 'N/A'}`)
    } else {
      // Fallback to old error handling for comparison
      const data = error.response?.data ?? error
      if (data) {
        console.log(chalk.yellow('Legacy error format:'))
        console.log(`  Code: ${data.error?.code || 'Unknown'}`)
        console.log(`  Message: ${data.error?.message || error.message}`)
      } else {
        console.error(chalk.red('Unexpected error:'), error)
      }
    }
  }
}

const testHttpError = async () => {
  console.log(chalk.blue('\n=== Testing HTTP Error (Enhanced) ==='))
  try {
    // Try to access a non-existent endpoint to trigger HTTP error
    const result = await sunra.subscribe('non-existent-model/endpoint', {
      input: { prompt: 'test' },
      logs: true,
    })
    console.log(result)
  } catch (error: any) {
    if (isSunraError(error)) {
      console.log(chalk.red('Caught Enhanced SunraError:'))
      console.log(`  Type: ${error.type || 'N/A'}`)
      console.log(`  Code: ${error.code}`)
      console.log(`  Message: ${error.message}`)
      console.log('  Details:', error.details || 'N/A')
      console.log(`  Request ID: ${error.requestId || 'N/A'}`)
      console.log('  Rate Limit:', error.rateLimit || 'N/A')
    } else {
      console.log(chalk.yellow('Legacy error format:'))
      const data = error.response?.data ?? error
      console.log(`  Status: ${error.response?.status || 'Unknown'}`)
      console.log(`  Message: ${data.message || error.message}`)
    }
  }
}

const testOnErrorCallback = async () => {
  console.log(chalk.blue('\n=== Testing onError Callback (Enhanced - No Exceptions) ==='))

  // Note: onError callback will be available with the new implementation
  console.log(chalk.yellow('Note: onError callback feature will be available after the enhanced error handling is built'))

  // For now, demonstrate the concept with try-catch
  try {
    const result = await sunra.subscribe('black-forest-labs/flux-kontext-pro/text-to-image', {
      input: {
        prompt: 'a bedroom with messy goods on the bed and floor',
        prompt_enhancer: false,
        seed: -2, // Invalid seed (should be >= 0)
        aspect_ratio: '16:9',
        output_format: 'jpeg',
        safety_tolerance: 6
      },
      logs: true,
      // onError: (error) => {
      //   console.log(chalk.yellow('Error handled by callback:'))
      //   console.log(`  Type: ${error.type}`)
      //   console.log(`  Code: ${error.code}`)
      //   console.log(`  Message: ${error.message}`)
      // },
      onEnqueue: (requestId) => {
        console.log(chalk.green('Enqueued:'), requestId)
      },
      onQueueUpdate: (status) => {
        console.log(chalk.green('Queue update:'), status)
      },
    })

    if (result) {
      console.log('Success:', result)
    }
  } catch (error: any) {
    console.log(chalk.yellow('Error that would be handled by onError callback:'))
    if (isSunraError(error)) {
      console.log(`  Enhanced: Code ${error.code}, Message: ${error.message}`)
    } else {
      console.log(`  Legacy: ${error.message}`)
    }
    console.log('With onError callback, this would not throw an exception')
  }
}

const main = async () => {
  console.log(chalk.magenta('🚀 Enhanced Error Handling Demo'))
  console.log(chalk.gray('This demo shows the new standardized error handling across SDKs\n'))

  await testValidationError()
  await testHttpError()
  await testOnErrorCallback()

  console.log(chalk.magenta('\n✅ Demo completed'))
  console.log(chalk.gray('Key improvements:'))
  console.log(chalk.gray('• Consistent error structure with type, code, message, details'))
  console.log(chalk.gray('• Automatic extraction of request ID and rate limit info'))
  console.log(chalk.gray('• Optional onError callbacks for graceful error handling'))
  console.log(chalk.gray('• No more manual axios response destructuring needed'))
}

main().catch(console.error)
