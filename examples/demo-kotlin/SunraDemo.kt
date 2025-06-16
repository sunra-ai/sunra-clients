import ai.sunra.client.kt.*
import com.google.gson.JsonObject
import kotlinx.coroutines.runBlocking

fun main() = runBlocking {
    val client = createSunraClient()

    val response = client.subscribe<JsonObject>(
        endpointId = "sunra/lcm/text-to-image",
        input = mapOf("prompt" to "a dog running in the park"),
        options = ai.sunra.client.kt.SubscribeOptions(logs = true),
        onUpdate = { update ->
            println("\nStatus Update: ${update.status}, Request ID: ${update.requestId}")
        }
    )

    println("Completed!")
    println(response.data)
}
