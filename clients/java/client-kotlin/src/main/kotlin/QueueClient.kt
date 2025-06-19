package ai.sunra.client.kt

import ai.sunra.client.queue.AsyncQueueClient
import ai.sunra.client.queue.QueueStatus
import com.google.gson.JsonObject
import kotlinx.coroutines.future.await
import kotlin.reflect.KClass
import ai.sunra.client.queue.QueueResultOptions as InternalResultOptions
import ai.sunra.client.queue.QueueStatusOptions as InternalStatusOptions
import ai.sunra.client.queue.QueueSubmitOptions as InternalSubmitOptions
import ai.sunra.client.queue.QueueSubscribeOptions as InternalSubscribeOptions

data class SubmitOptions(
    val webhookUrl: String? = null,
)

data class StatusOptions(
    val logs: Boolean = false,
)

data class StatusSubscribeOptions(
    val logs: Boolean = false,
)

/**
 * A Kotlin queue client for interacting with the sunra queue APIs.
 * @see AsyncQueueClient
 */
interface QueueClient {
    /**
     * Submits a request to the given [endpointId]. This method
     * uses the Queue API to submit the request and returns the initial
     * status of the request.
     *
     * @param endpointId The ID of the endpoint to send the request to.
     * @param input The input data to send to the endpoint.
     * @param options The options to use for the request.
     *
     * @see #status
     * @see #result
     */
    suspend fun <Input> submit(
        endpointId: String,
        input: Input,
        options: SubmitOptions = SubmitOptions(),
    ): QueueStatus.InQueue

    /**
     * Gets the current status of the request with the given [requestId].
     *
     * @param requestId The ID of the request to get the status for.
     * @param options The options to use for the request.
     *
     * @see #submit
     */
    suspend fun status(
        requestId: String,
        options: StatusOptions = StatusOptions(),
    ): QueueStatus.StatusUpdate

    /**
     * Subscribes to the status updates of the request with the given [requestId].
     * This method uses the Queue API to subscribe to the status updates of the request.
     *
     * @param requestId The ID of the request to subscribe to.
     * @param options The options to use for the request.
     * @param onQueueUpdate The status update callback.
     *
     * @see #submit
     * @see #status
     */
    suspend fun subscribeToStatus(
        requestId: String,
        options: StatusSubscribeOptions = StatusSubscribeOptions(),
        onQueueUpdate: OnStatusUpdate? = null,
    ): QueueStatus.Completed

    /**
     * Gets the result of the request with the given `requestId`.
     *
     * @param requestId The ID of the request to get the result for.
     * @param resultType The expected result type of the request.
     *
     * @see #submit
     */
    suspend fun <Output : Any> result(
        requestId: String,
        resultType: KClass<Output>,
    ): RequestOutput<Output>
}

/**
 * An implementation of [QueueClient] that wraps the Java [AsyncQueueClient]
 * and offer a coroutine-based contract.
 */
internal class QueueClientImpl(
    private val queueClient: AsyncQueueClient,
) : QueueClient {
    override suspend fun <Input> submit(
        endpointId: String,
        input: Input,
        options: SubmitOptions,
    ): QueueStatus.InQueue {
        return queueClient.submit(
            endpointId,
            InternalSubmitOptions.builder()
                .input(input)
                .webhookUrl(options.webhookUrl)
                .build(),
        ).await()
    }

    override suspend fun status(
        requestId: String,
        options: StatusOptions,
    ): QueueStatus.StatusUpdate {
        return queueClient.status(
            InternalStatusOptions.builder()
                .requestId(requestId)
                .logs(options.logs)
                .build(),
        ).await()
    }

    override suspend fun subscribeToStatus(
        requestId: String,
        options: StatusSubscribeOptions,
        onQueueUpdate: OnStatusUpdate?,
    ): QueueStatus.Completed {
        return queueClient.subscribeToStatus(
            InternalSubscribeOptions.builder()
                .requestId(requestId)
                .logs(options.logs)
                .onQueueUpdate(onQueueUpdate)
                .build(),
        ).await()
    }

    override suspend fun <Output : Any> result(
        requestId: String,
        resultType: KClass<Output>,
    ): RequestOutput<Output> {
        return queueClient.result(
            InternalResultOptions.builder<Output>()
                .requestId(requestId)
                .resultType(resultType.java)
                .build(),
        ).thenConvertOutput().await()
    }
}

suspend inline fun <reified Output : Any> QueueClient.result(
    requestId: String,
): RequestOutput<Output> {
    return result(requestId, Output::class)
}

@JvmName("result_")
suspend inline fun QueueClient.result(
    requestId: String,
): RequestOutput<JsonObject> {
    return result(requestId, JsonObject::class)
}
