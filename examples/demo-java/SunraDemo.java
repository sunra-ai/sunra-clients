import ai.sunra.client.*;
import ai.sunra.client.queue.*;
import java.util.Map;
import com.google.gson.JsonObject;
import java.util.function.Consumer;

public class SunraDemo {
  public static void main(String[] args) {
    var config = ClientConfig.builder()
        .withCredentials(CredentialsResolver.fromEnv())
        .build();

    var client = SunraClient.withConfig(config);
    var input = Map.of(
        "prompt", "a dog running in the park");

    var statusUpdateHandler = (Consumer<QueueStatus.StatusUpdate>) update -> {
      String status = update.getStatus().toString();
      String message = String.format("\nStatus Update: %s, Request ID: %s",
          status, update.getRequestId());
      System.out.println(message);
    };

    var options = SubscribeOptions.<JsonObject>builder()
        .input(input)
        .resultType(JsonObject.class)
        .onQueueUpdate(statusUpdateHandler)
        .logs(true)
        .build();

    // save the subscribe request to a variable and print it
    var response = client.subscribe("sunra/lcm/text-to-image", options);
    System.out.println("Completed!");
    System.out.println(response.getData());
    System.exit(0);
  }
}
