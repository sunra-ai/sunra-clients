package ai.sunra.client.queue;

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.google.gson.JsonObject;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class QueueSubmitOptionsTest {

    @Test
    void addsProviderRoutingToTheCanonicalRequestBody() {
        var options = QueueSubmitOptions.builder()
                .input(Map.of("prompt", "sunrise"))
                .provider(Map.of("only", List.of("fal")))
                .build();

        var body = (JsonObject) options.getInput();

        assertEquals("sunrise", body.get("prompt").getAsString());
        assertEquals("fal", body.getAsJsonObject("provider")
                .getAsJsonArray("only")
                .get(0)
                .getAsString());
    }

    @Test
    void leavesAutomaticRequestsUnchanged() {
        var input = Map.of("prompt", "sunrise");
        var options = QueueSubmitOptions.builder().input(input).build();

        assertEquals(input, options.getInput());
    }
}
