import ai.sunra.client.*;
import java.util.Map;
import com.google.gson.JsonObject;

public class SunraDemo {
  public static void main(String[] args) {
    var client = SunraClient.withEnvCredentials();

    var response = client.subscribe(
      "black-forest-labs/flux-kontext-pro/text-to-image",
      SubscribeOptions.<JsonObject>builder()
        .input(Map.of("prompt", "a dog running in the park"))
        .resultType(JsonObject.class)
        .onQueueUpdate(update -> System.out.printf(
          "\nStatus Update: %s, Request ID: %s%n",
          update.getStatus(),
          update.getRequestId()
        ))
        .logs(true)
        .build()
    );

    System.out.println("Completed!");
    System.out.println(response.getData());
  }
}
