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

// ============================================================================
// RECOMMENDED APPROACH: Using onError Callback Style (Non-Throwing)
// ============================================================================

const testValidationErrorWithCallback = async () => {
  console.log(chalk.blue('=== Validation Error with onError Callback (Recommended) ==='))

  let hasError = false

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
    onEnqueue: (requestId: string) => {
      console.log(chalk.green('Enqueued:'), requestId)
    },
    onQueueUpdate: (status: any) => {
      console.log(chalk.green('Queue update:'), status)
    },
    onError: (error: any) => {
      hasError = true
      console.log(chalk.yellow('Error handled gracefully by onError callback:'))
      console.log(`  Type: ${error.type || 'N/A'}`)
      console.log(`  Code: ${error.code}`)
      console.log(`  Message: ${error.message}`)
      console.log('  Details:', error.details || 'N/A')
      console.log(`  Request ID: ${error.requestId || 'N/A'}`)
      console.log('  Rate Limit:', error.rateLimit || 'N/A')
      console.log(`  Timestamp: ${error.timestamp || 'N/A'}`)
    },
  })

  if (hasError) {
    console.log(chalk.green('✓ Error handled without throwing exception'))
    console.log(chalk.gray('  This is the recommended approach for production applications'))
  } else if (result) {
    console.log(chalk.green('✓ Request succeeded:'), result)
  }
}

const testHttpErrorWithCallback = async () => {
  console.log(chalk.blue('\n=== HTTP Error with onError Callback (Recommended) ==='))

  let hasError = false

  const result = await sunra.subscribe('non-existent-model/endpoint', {
    input: { prompt: 'test' },
    logs: true,
    onError: (error: any) => {
      hasError = true
      console.log(chalk.yellow('HTTP error handled gracefully by onError callback:'))
      console.log(`  Type: ${error.type || 'N/A'}`)
      console.log(`  Code: ${error.code}`)
      console.log(`  Message: ${error.message}`)
      console.log('  Details:', error.details || 'N/A')
      console.log(`  Request ID: ${error.requestId || 'N/A'}`)
      console.log('  Rate Limit:', error.rateLimit || 'N/A')
    },
  })

  if (hasError) {
    console.log(chalk.green('✓ HTTP error handled without throwing exception'))
  } else if (result) {
    console.log(chalk.green('✓ Request succeeded:'), result)
  }
}

const testRateLimitingWithCallback = async () => {
  console.log(chalk.blue('\n=== Rate Limiting with onError Callback (Recommended) ==='))

  // Make multiple rapid requests to potentially trigger rate limiting
  const promises = Array.from({ length: 5 }, (_, i) =>
    sunra.subscribe('black-forest-labs/flux-kontext-pro/text-to-image', {
      input: {
        prompt: `test image ${i}`,
        aspect_ratio: '1:1'
      },
      onError: (error: any) => {
        console.log(chalk.yellow(`Request ${i} error handled by onError callback:`))
        console.log(`  Code: ${error.code}`)
        console.log(`  Message: ${error.message}`)
        if (error.rateLimit) {
          console.log(`  Rate Limit - Reset Time: ${error.rateLimit.resetTime || 'N/A'}`)
          console.log(`  Rate Limit - Remaining: ${error.rateLimit.remaining || 'N/A'}`)
        }
      },
      onEnqueue: (requestId: string) => {
        console.log(chalk.gray(`Request ${i} enqueued: ${requestId}`))
      }
    })
  )

  const results = await Promise.all(promises)
  const successCount = results.filter((r: any) => r !== undefined).length
  const errorCount = results.filter((r: any) => r === undefined).length

  console.log(chalk.green(`✓ Completed: ${successCount} successful, ${errorCount} handled errors`))
}

const testMultipleErrorTypesWithCallback = async () => {
  console.log(chalk.blue('\n=== Multiple Error Types with onError Callback (Recommended) ==='))

  const testCases = [
    {
      name: 'Valid Request',
      endpoint: 'black-forest-labs/flux-kontext-pro/text-to-image',
      input: { prompt: 'a beautiful sunset', aspect_ratio: '16:9' }
    },
    {
      name: 'Invalid Endpoint',
      endpoint: 'invalid/model/endpoint',
      input: { prompt: 'test' }
    },
    {
      name: 'Invalid Input',
      endpoint: 'black-forest-labs/flux-kontext-pro/text-to-image',
      input: { prompt: 'test', seed: -999, aspect_ratio: 'invalid_ratio' }
    }
  ]

  for (const testCase of testCases) {
    console.log(chalk.cyan(`\n  Testing: ${testCase.name}`))

    const result = await sunra.subscribe(testCase.endpoint, {
      input: testCase.input,
      onError: (error: any) => {
        console.log(chalk.yellow(`    Error handled for ${testCase.name}:`))
        console.log(`      Code: ${error.code}`)
        console.log(`      Message: ${error.message}`)
        if (error.type) console.log(`      Type: ${error.type}`)
        if (error.details) console.log(`      Details: ${JSON.stringify(error.details, null, 8)}`)
      },
      onEnqueue: (requestId: string) => {
        console.log(chalk.gray(`    Enqueued: ${requestId}`))
      }
    })

    if (result) {
      console.log(chalk.green(`    ✓ ${testCase.name} succeeded`))
    } else {
      console.log(chalk.green(`    ✓ ${testCase.name} error handled gracefully`))
    }
  }
}

// ============================================================================
// ALTERNATIVE APPROACH: Traditional Try/Catch Style
// ============================================================================

// Type guard for SunraError (for enhanced error information)
function isSunraError(error: any): boolean {
  return error && error.name === 'SunraError' && typeof error.code === 'string'
}

const testValidationErrorTryCatch = async () => {
  console.log(chalk.blue('\n=== Validation Error with Try/Catch (Alternative) ==='))
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
      onEnqueue: (requestId: string) => {
        console.log(chalk.green('Enqueued:'), requestId)
      },
      onQueueUpdate: (status: any) => {
        console.log(chalk.green('Queue update:'), status)
      },
    })
    console.log(result)
  } catch (error: any) {
    if (isSunraError(error)) {
      console.log(chalk.red('Caught SunraError in try/catch:'))
      console.log(`  Type: ${error.type || 'N/A'}`)
      console.log(`  Code: ${error.code}`)
      console.log(`  Message: ${error.message}`)
      console.log('  Details:', error.details || 'N/A')
      console.log(`  Request ID: ${error.requestId || 'N/A'}`)
      console.log('  Rate Limit:', error.rateLimit || 'N/A')
      console.log(`  Timestamp: ${error.timestamp || 'N/A'}`)
    } else {
      // Fallback to legacy error handling for comparison
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

const testHttpErrorTryCatch = async () => {
  console.log(chalk.blue('\n=== HTTP Error with Try/Catch (Alternative) ==='))
  try {
    const result = await sunra.subscribe('non-existent-model/endpoint', {
      input: { prompt: 'test' },
      logs: true,
    })
    console.log(result)
  } catch (error: any) {
    if (isSunraError(error)) {
      console.log(chalk.red('Caught SunraError in try/catch:'))
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

const main = async () => {
  console.log(chalk.magenta('🚀 Enhanced Error Handling Demo'))
  console.log(chalk.gray('This demo shows different approaches to error handling in the Sunra SDK\n'))

  // RECOMMENDED: onError callback style (non-throwing)
  console.log(chalk.magenta('🌟 RECOMMENDED APPROACH: onError Callback Style'))
  console.log(chalk.gray('This approach provides graceful error handling without exceptions\n'))

  await testValidationErrorWithCallback()
  await testHttpErrorWithCallback()
  await testRateLimitingWithCallback()
  await testMultipleErrorTypesWithCallback()

  // ALTERNATIVE: try/catch style (throwing)
  console.log(chalk.magenta('\n📦 ALTERNATIVE APPROACH: Try/Catch Style'))
  console.log(chalk.gray('This approach uses traditional exception handling\n'))

  await testValidationErrorTryCatch()
  await testHttpErrorTryCatch()

  console.log(chalk.magenta('\n✅ Demo completed'))
  console.log(chalk.gray('Key benefits of onError callback approach:'))
  console.log(chalk.gray('• No exception handling required'))
  console.log(chalk.gray('• Graceful error handling in production'))
  console.log(chalk.gray('• Consistent error structure with type, code, message, details'))
  console.log(chalk.gray('• Automatic extraction of request ID and rate limit info'))
  console.log(chalk.gray('• Better user experience with non-blocking error handling'))
  console.log(chalk.gray('\nWhen to use try/catch:'))
  console.log(chalk.gray('• When you need to halt execution on errors'))
  console.log(chalk.gray('• For debugging and development'))
  console.log(chalk.gray('• When integrating with existing exception-based error handling'))
}

main().catch(console.error)
