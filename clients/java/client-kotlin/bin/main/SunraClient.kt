package ai.sunra.client.kt

import ai.sunra.client.AsyncSunraClient
import ai.sunra.client.ClientConfig
import ai.sunra.client.CredentialsResolver
import ai.sunra.client.queue.QueueStatus
import com.google.gson.JsonObject
import kotlinx.coroutines.future.await
import kotlin.reflect.KClass
import ai.sunra.client.RunOptions as InternalRunOptions
import ai.sunra.client.SubscribeOptions as InternalSubscribeOptions

data class RunOptions(
    val httpMethod: String = "POST",
)

data class SubscribeOptions(
    val logs: Boolean = false,
    val webhookUrl: String? = null,
)

/**
 * The main client class that provides access to simple API model usage,
 * as well as access to the [queue] APIs.
 * @see AsyncSunraClient
 */
interface SunraClient {
    /** The queue client with specific methods to interact with the queue API.
     *
     * **Note:** that the [subscribe] method is a convenience method that uses the
     * [queue] client to submit a request and poll for the result.
     */
    val queue: QueueClient

    /**
     * Submits a request to the given [endpointId]. This method
     * uses the [queue] API to submit the request and poll for the result.
     *
     * This is useful for long running requests, and it's the preffered way
     * to interact with the model APIs.
     *
     * @param endpointId The ID of the endpoint to send the request to.
     * @param input The input data to send to the endpoint.
     * @param resultType The expected result type of the request.
     * @param options The options to use for the request.
     * @param onQueueUpdate A callback to receive status updates from the queue subscription.
     */
    suspend fun <Output : Any> subscribe(
        endpointId: String,
        input: Any,
        resultType: KClass<Output>,
        options: SubscribeOptions = SubscribeOptions(),
        onQueueUpdate: OnStatusUpdate? = null,
    ): RequestOutput<Output>
}

/**
 * A callback for receiving status updates from a queue subscription.
 */
typealias OnStatusUpdate = (update: QueueStatus.StatusUpdate) -> Unit

/**
 * A Kotlin implementation of [SunraClient] that wraps the Java [AsyncSunraClient].
 */
internal class SunraClientKotlinImpl(
    config: ClientConfig,
) : SunraClient {
    private val client = AsyncSunraClient.withConfig(config)

    override val queue: QueueClient = QueueClientImpl(client.queue())

    override suspend fun <Output : Any> subscribe(
        endpointId: String,
        input: Any,
        resultType: KClass<Output>,
        options: SubscribeOptions,
        onQueueUpdate: OnStatusUpdate?,
    ): RequestOutput<Output> {
        println(resultType)
        println(options)
        val internalOptions =
            InternalSubscribeOptions.builder<Output>()
                .input(input)
                .resultType(resultType.java)
                .logs(options.logs)
                .onQueueUpdate(onQueueUpdate)
                .build()
        return client.subscribe(endpointId, internalOptions).thenConvertOutput().await()
    }
}

suspend inline fun <reified Output : Any> SunraClient.subscribe(
    endpointId: String,
    input: Any,
    options: SubscribeOptions = SubscribeOptions(),
    noinline onUpdate: OnStatusUpdate? = null,
) = this.subscribe(endpointId, input, Output::class, options, onUpdate)

@JvmName("subscribe_")
suspend inline fun SunraClient.subscribe(
    endpointId: String,
    input: Any,
    options: SubscribeOptions = SubscribeOptions(),
    noinline onUpdate: OnStatusUpdate? = null,
) = this.subscribe(endpointId, input, JsonObject::class, options, onUpdate)

fun createSunraClient(config: ClientConfig? = null): SunraClient =
    SunraClientKotlinImpl(config ?: ClientConfig.withCredentials(CredentialsResolver.fromEnv()))

fun createSunraClient(credentialsResolver: CredentialsResolver): SunraClient =
    SunraClientKotlinImpl(ClientConfig.withCredentials(credentialsResolver))
