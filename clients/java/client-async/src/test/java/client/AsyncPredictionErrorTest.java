package client;

import static org.junit.jupiter.api.Assertions.*;

import ai.sunra.client.ClientConfig;
import ai.sunra.client.CredentialsResolver;
import ai.sunra.client.exception.PredictionError;
import ai.sunra.client.exception.SunraException;
import ai.sunra.client.http.HttpClient;
import ai.sunra.client.queue.QueueStatus;
import com.google.gson.JsonParser;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import okhttp3.MediaType;
import okhttp3.Protocol;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import org.junit.jupiter.api.Test;

/**
 * SUNRA-819 Phase 4, async side.
 *
 * <p>The async client used to hand-roll its own copy of the failed-status
 * parser — two copies, in fact, one per listener callback — and both had
 * drifted from their synchronous counterparts: they read {@code details} with
 * {@code getAsString()}, which throws {@code UnsupportedOperationException} on
 * the object-valued details the API actually sends, and they dropped
 * {@code type} entirely. All four copies are now one shared
 * {@link QueueStatus#toException}, so this file asserts the behaviour that
 * used to be missing here rather than parity between two implementations that
 * no longer exist.
 *
 * <p>Offline: builds real {@link Response} objects, needs no {@code SUNRA_KEY}
 * and no network — unlike {@code AsyncSunraClientImplRealTest}, which skips
 * itself when no key is present.
 */
class AsyncPredictionErrorTest {

    // pd_VEwnjvrLmVq5hzjpY5gUsNq4 (prod, 2026-08-14) — the input-fetch class.
    private static final String INPUT_FETCH_FAILED_JSON =
            "{\"code\":\"invalid_input\","
                    + "\"message\":\"Failed to fetch an input file (https://eae11ef1ce149104a83288cc3847b6fb.r2.cloudflarestorage.com/clawly-conductor-lab-artifacts/inbound/imsg_smoke_eng8643_20260803T042129Z_4...): HTTP 403.\","
                    + "\"reason\":\"input_fetch_failed\",\"retryable\":false,"
                    + "\"timestamp\":\"2026-08-14T18:22:33.179Z\"}";

    // An object-valued `details`: the exact shape the old async parser threw
    // on. It must parse, and the unknown field must simply be ignored.
    private static final String OBJECT_DETAILS_JSON =
            "{\"code\":\"invalid_input\",\"message\":\"boom\",\"reason\":\"input_validation_failed\","
                    + "\"retryable\":false,\"details\":{\"field\":\"prompt\"}}";

    /** When the API answered, as opposed to when the prediction failed. */
    private static final String RESPONSE_TIMESTAMP = "2026-08-17T09:00:00.000Z";

    private static HttpClient httpClient() {
        return new HttpClient(
                ClientConfig.withCredentials(CredentialsResolver.fromApiKey("test-key")),
                new okhttp3.OkHttpClient());
    }

    private static String predictionFailedBody() {
        return "{\"error\":{\"type\":\"invalid_request_error\",\"code\":\"PREDICTION_FAILED\","
                + "\"message\":\"Failed to fetch an input file\","
                + "\"details\":" + INPUT_FETCH_FAILED_JSON + "},"
                + "\"request_id\":\"req_01JXQ2\","
                + "\"timestamp\":\"" + RESPONSE_TIMESTAMP + "\"}";
    }

    private static Response response(String body) {
        return new Response.Builder()
                .request(new Request.Builder()
                        .url("https://api.sunra.ai/v1/queue/requests/pd_VEwnjvrLmVq5hzjpY5gUsNq4")
                        .build())
                .protocol(Protocol.HTTP_1_1)
                .code(400)
                .message("Bad Request")
                .header("content-type", "application/json")
                .header("x-request-id", "req_01JXQ2")
                .body(ResponseBody.create(body, MediaType.get("application/json")))
                .build();
    }

    private static QueueStatus.Completed completedWith(String predictionErrorJson) {
        final var completed = new QueueStatus.Completed();
        completed.setSuccess(false);
        completed.setError(JsonParser.parseString(predictionErrorJson));
        return completed;
    }

    @Test
    void asyncResultSurfacesTheV2FieldsThroughCompletionException() {
        // `AsyncQueueClientImpl.result` is
        // executeRequestAsync(...).thenApply(wrapInResult), so this is that
        // composition with the transport swapped for a canned response. The
        // populated exception has to survive the CompletableFuture wrapping —
        // an async caller must be able to read `reason` / `retryable` too.
        final var client = httpClient();
        final var future = CompletableFuture.completedFuture(response(predictionFailedBody()))
                .thenApply(response -> client.wrapInResult(response, Object.class));

        final var completion = assertThrows(CompletionException.class, future::join);
        final var cause = assertInstanceOf(SunraException.class, completion.getCause());

        assertEquals("invalid_input", cause.getCode());
        assertEquals("input_fetch_failed", cause.getReason());
        assertEquals(Boolean.FALSE, cause.getRetryable());
        assertEquals("prediction_failed", cause.getType());
        assertNotNull(cause.getPredictionError());
    }

    @Test
    void asyncResultKeepsTheTwoTimestampsApart() {
        // r4-B3 on the async path too: the outer timestamp is when the API
        // answered; the prediction failed days earlier.
        final var thrown = assertThrows(
                SunraException.class,
                () -> httpClient().wrapInResult(response(predictionFailedBody()), Object.class));

        assertEquals(RESPONSE_TIMESTAMP, thrown.getTimestamp());
        assertEquals("2026-08-14T18:22:33.179Z", thrown.getPredictionError().getTimestamp());
        assertNotEquals(thrown.getTimestamp(), thrown.getPredictionError().getTimestamp());
    }

    @Test
    void theStatusPathNoLongerThrowsOnAnObjectValuedDetails() {
        // Regression for the drift: `errorObject.get("details").getAsString()`
        // threw here, so what the user actually got was an internal crash
        // instead of their prediction error.
        final var thrown = QueueStatus.toException(completedWith(OBJECT_DETAILS_JSON), "pd_x");

        assertEquals("invalid_input", thrown.getCode());
        assertEquals("input_validation_failed", thrown.getReason());
        assertEquals(Boolean.FALSE, thrown.getRetryable());
    }

    @Test
    void theStatusPathNowCarriesTheErrorType() {
        // The old async parser dropped `type` entirely.
        assertEquals(
                "prediction_failed",
                QueueStatus.toException(completedWith(INPUT_FETCH_FAILED_JSON), "pd_x").getType());
    }

    @Test
    void theStatusPathAgreesWithTheResultEndpoint() {
        // Two ways of learning a prediction failed must not disagree about
        // what the failure was — asserted here for the async module's own
        // dependency graph as well as the sync one's.
        final var fromStatus = QueueStatus.toException(completedWith(INPUT_FETCH_FAILED_JSON), "pd_x");
        final var fromResult = assertThrows(
                SunraException.class,
                () -> httpClient().wrapInResult(response(predictionFailedBody()), Object.class));

        assertEquals(fromResult.getCode(), fromStatus.getCode());
        assertEquals(fromResult.getType(), fromStatus.getType());
        assertEquals(fromResult.getReason(), fromStatus.getReason());
        assertEquals(fromResult.getRetryable(), fromStatus.getRetryable());
        assertEquals(fromResult.getPredictionError(), fromStatus.getPredictionError());
    }

    @Test
    void predictionErrorEqualityIsByValue() {
        // The agreement assertion above leans on it, so pin it rather than let
        // it pass vacuously through reference equality.
        assertEquals(
                PredictionError.fromJson(JsonParser.parseString(INPUT_FETCH_FAILED_JSON)),
                PredictionError.fromJson(JsonParser.parseString(INPUT_FETCH_FAILED_JSON)));
        assertNotEquals(
                PredictionError.fromJson(JsonParser.parseString(INPUT_FETCH_FAILED_JSON)),
                PredictionError.fromJson(JsonParser.parseString(OBJECT_DETAILS_JSON)));
    }
}
