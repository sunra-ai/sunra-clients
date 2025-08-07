// get your API key from https://sunra.ai/dashboard/api-tokens
// createSunraClient() reads the credentials from the environment variable SUNRA_KEY by default
import ai.sunra.client.kt.*
import com.google.gson.JsonObject
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    val client = createSunraClient()

    // find more models here: https://sunra.ai/models
    val response = client.subscribe<JsonObject>(
        endpointId = "black-forest-labs/flux.1-schnell/text-to-image",
        input = mapOf("prompt" to "a dog running in the park"),
        options = ai.sunra.client.kt.SubscribeOptions(logs = true),
        onUpdate = { update ->
            println("\nStatus Update: ${update.status}, Request ID: ${update.requestId}")
        }
    )

    println("Completed!")
    println(response.data)
}
