import ai.sunra.client.*;
import java.util.Map;
import com.google.gson.JsonObject;

public class SunraDemo {
  public static void main(String[] args) {
    var client = AsyncSunraClient.withEnvCredentials();

    var future = client.subscribe(
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

    try {
      var data = future.get().getData();

      System.out.println("Completed!");
      System.out.println(data);
    } catch (Exception e) {
      System.out.println("Error!");
      System.out.println(e);
    }
  }
}
