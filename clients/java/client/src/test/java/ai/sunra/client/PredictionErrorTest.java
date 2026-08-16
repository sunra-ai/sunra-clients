package ai.sunra.client;

import static org.junit.jupiter.api.Assertions.*;

import ai.sunra.client.exception.PredictionError;
import ai.sunra.client.exception.SunraException;
import ai.sunra.client.http.HttpClient;
import ai.sunra.client.queue.QueueStatus;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import com.google.gson.JsonParser;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.CompletionException;
import okhttp3.MediaType;
import okhttp3.Protocol;
import okhttp3.Request;
import okhttp3.Response;
import okhttp3.ResponseBody;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;

/**
 * SUNRA-819 Phase 4 — the prediction error contract v2 in the Java SDK.
 *
 * <p>Offline by construction: every case builds a real {@link Response} and
 * drives the real parsing, so it runs without {@code SUNRA_KEY} and without
 * network — unlike the pre-existing {@code *RealTest} files, which skip
 * themselves when no key is present and therefore never gated anything in CI.
 *
 * <p>Fixtures are verbatim prod rows ({@code sunra-prod.predictions},
 * 2026-08-17 sweep). The two reasons below are the only two with live
 * producers in prod.
 */
class PredictionErrorTest {

    // pd_VEwnjvrLmVq5hzjpY5gUsNq4 (2026-08-14) — the SUNRA-841 input-fetch class.
    private static final String INPUT_FETCH_FAILED_JSON =
            "{\"code\":\"invalid_input\","
                    + "\"message\":\"Failed to fetch an input file (https://eae11ef1ce149104a83288cc3847b6fb.r2.cloudflarestorage.com/clawly-conductor-lab-artifacts/inbound/imsg_smoke_eng8643_20260803T042129Z_4...): HTTP 403.\","
                    + "\"reason\":\"input_fetch_failed\",\"retryable\":false,"
                    + "\"timestamp\":\"2026-08-14T18:22:33.179Z\"}";

    // pd_a839exsaLNmVZzWvDaxAuapS (2026-08-14) — the moderation class.
    private static final String MODERATION_BLOCKED_JSON =
            "{\"code\":\"unsafe_content\","
                    + "\"message\":\"The prediction may contain sensitive or restricted content and has been suppressed. Please revise your input.\","
                    + "\"reason\":\"moderation_blocked\",\"retryable\":false,"
                    + "\"timestamp\":\"2026-08-14T17:51:47.206Z\"}";

    // pd_Gf4L83a52tmeQBeqm2w4GdnQ — a pre-v2 row, still the bulk of the table.
    private static final String PRE_V2_JSON =
            "{\"code\":\"service_provider_error\",\"message\":\"Predict failed. Please try again.\"}";

    /** When the API answered, as opposed to when the prediction failed. */
    private static final String RESPONSE_TIMESTAMP = "2026-08-17T09:00:00.000Z";

    private static JsonElement json(String raw) {
        return JsonParser.parseString(raw);
    }

    /** The wire body {@code GET /queue/requests/:id} returns for a failed prediction. */
    private static String predictionFailedBody(String predictionErrorJson) {
        final var error = JsonParser.parseString(predictionErrorJson).getAsJsonObject();
        return "{\"error\":{\"type\":\"invalid_request_error\","
                + "\"code\":\"PREDICTION_FAILED\","
                + "\"message\":" + new Gson().toJson(error.get("message").getAsString()) + ","
                + "\"details\":" + predictionErrorJson + "},"
                + "\"request_id\":\"req_01JXQ2\","
                + "\"timestamp\":\"" + RESPONSE_TIMESTAMP + "\","
                + "\"path\":\"/v1/queue/requests/pd_VEwnjvrLmVq5hzjpY5gUsNq4\"}";
    }

    private static Response response(String body, int code) {
        return new Response.Builder()
                .request(new Request.Builder()
                        .url("https://api.sunra.ai/v1/queue/requests/pd_VEwnjvrLmVq5hzjpY5gUsNq4")
                        .build())
                .protocol(Protocol.HTTP_1_1)
                .code(code)
                .message("Bad Request")
                .header("content-type", "application/json")
                .header("x-request-id", "req_01JXQ2")
                .body(ResponseBody.create(body, MediaType.get("application/json")))
                .build();
    }

    private static QueueStatus.Completed completedWith(String predictionErrorJson) {
        final var completed = new QueueStatus.Completed();
        completed.setSuccess(false);
        completed.setError(predictionErrorJson == null ? null : json(predictionErrorJson));
        return completed;
    }

    @Nested
    @DisplayName("PredictionError.fromJson is a guard, not a cast")
    class Parsing {

        @Test
        void parsesTheProdV2Object() {
            final var parsed = PredictionError.fromJson(json(INPUT_FETCH_FAILED_JSON));

            assertNotNull(parsed);
            assertEquals("invalid_input", parsed.getCode());
            assertEquals("input_fetch_failed", parsed.getReason());
            assertEquals(Boolean.FALSE, parsed.getRetryable());
            assertEquals("2026-08-14T18:22:33.179Z", parsed.getTimestamp());
        }

        @Test
        void inventsNothingForAPreV2Object() {
            final var parsed = PredictionError.fromJson(json(PRE_V2_JSON));

            assertNotNull(parsed);
            assertEquals("service_provider_error", parsed.getCode());
            // Deriving `retryable` from the coarse code would publish `true`
            // for failures that are permanently hopeless. Silence is the
            // contract; the caller falls back to the per-code default.
            assertNull(parsed.getReason());
            assertNull(parsed.getRetryable());
            assertFalse(parsed.toMap().containsKey("reason"));
            assertFalse(parsed.toMap().containsKey("retryable"));
        }

        @Test
        void returnsNullForAnythingThatIsNotAV2Object() {
            assertNull(PredictionError.fromJson(null));
            assertNull(PredictionError.fromJson(json("null")));
            assertNull(PredictionError.fromJson(json("\"boom\"")));
            assertNull(PredictionError.fromJson(json("[{\"code\":\"a\",\"message\":\"b\"}]")));
            assertNull(PredictionError.fromJson(json("{\"message\":\"b\"}")));
            assertNull(PredictionError.fromJson(json("{\"code\":\"a\"}")));
            assertNull(PredictionError.fromJson(json("{\"code\":42,\"message\":\"b\"}")));
            assertNull(PredictionError.fromJson(json("{\"code\":\"a\",\"message\":[\"b\"]}")));
        }

        @Test
        void dropsWronglyTypedOptionalsRatherThanCoercing() {
            // The pre-existing async client called getAsString() on `details`
            // and blew up on an object; a malformed field must be ignored, not
            // coerced and not fatal.
            final var parsed = PredictionError.fromJson(
                    json("{\"code\":\"invalid_input\",\"message\":\"x\","
                            + "\"reason\":42,\"retryable\":\"false\",\"timestamp\":0}"));

            assertNotNull(parsed);
            assertNull(parsed.getReason());
            assertNull(parsed.getRetryable());
            assertNull(parsed.getTimestamp());
        }

        @Test
        void survivesAnObjectValuedDetailsField() {
            // The exact shape that threw before: `details` present and an
            // object. It is not part of the v2 contract, so it is ignored —
            // but ignoring must not mean crashing.
            assertNotNull(PredictionError.fromJson(
                    json("{\"code\":\"a\",\"message\":\"b\",\"details\":{\"nested\":true}}")));
        }

        @Test
        void keepsRetryableTrue() {
            final var parsed = PredictionError.fromJson(
                    json("{\"code\":\"internal_server_error\",\"message\":\"x\",\"retryable\":true}"));

            assertNotNull(parsed);
            assertEquals(Boolean.TRUE, parsed.getRetryable());
        }
    }

    @Nested
    @DisplayName("result() on a failed prediction (r4-B2)")
    class ResultEndpoint {

        private final HttpClient httpClient = new HttpClient(
                ClientConfig.withCredentials(CredentialsResolver.fromApiKey("test-key")),
                new okhttp3.OkHttpClient());

        /**
         * Both {@code QueueClientImpl.result} and
         * {@code AsyncQueueClientImpl.result} funnel the response through
         * {@code wrapInResult} → {@code handleResponse}, so this exercises the
         * exact code both of them run on a failure body.
         */
        private SunraException thrownBy(String body) {
            return assertThrows(
                    SunraException.class,
                    () -> httpClient.wrapInResult(
                            response(body, 400), Object.class));
        }

        @Test
        void promotesTheV2ObjectToFirstClassFields() {
            final var thrown = thrownBy(predictionFailedBody(INPUT_FETCH_FAILED_JSON));

            // Not "PREDICTION_FAILED": the caller wants to know WHY, and this
            // is the same code subscribeToStatus() surfaces for the same
            // failure.
            assertEquals("invalid_input", thrown.getCode());
            assertEquals("input_fetch_failed", thrown.getReason());
            assertEquals(Boolean.FALSE, thrown.getRetryable());
            assertEquals("prediction_failed", thrown.getType());
            assertEquals("req_01JXQ2", thrown.getRequestId());
            assertTrue(thrown.getMessage().startsWith("Failed to fetch an input file"));
        }

        @Test
        void keepsTheWholePredictionErrorEnvelope() {
            final var thrown = thrownBy(predictionFailedBody(MODERATION_BLOCKED_JSON));

            assertNotNull(thrown.getPredictionError());
            assertEquals("moderation_blocked", thrown.getPredictionError().getReason());
        }

        @Test
        void modelsTheTwoTimestampsSeparately() {
            // r4-B3: the outer envelope's timestamp is when the API answered;
            // the prediction failed days earlier. Collapsing them into one
            // field would silently lie about one of the two.
            final var thrown = thrownBy(predictionFailedBody(INPUT_FETCH_FAILED_JSON));

            assertEquals(RESPONSE_TIMESTAMP, thrown.getTimestamp());
            assertEquals("2026-08-14T18:22:33.179Z", thrown.getPredictionError().getTimestamp());
            assertNotEquals(thrown.getTimestamp(), thrown.getPredictionError().getTimestamp());
        }

        @Test
        void synthesizesNothingForAPreV2Failure() {
            final var thrown = thrownBy(predictionFailedBody(PRE_V2_JSON));

            assertEquals("service_provider_error", thrown.getCode());
            assertNull(thrown.getReason());
            assertNull(thrown.getRetryable());
            @SuppressWarnings("unchecked")
            final var error = (java.util.Map<String, Object>) thrown.toMap().get("error");
            assertFalse(error.containsKey("reason"));
            assertFalse(error.containsKey("retryable"));
        }

        @Test
        void leavesANonPredictionApiErrorUntouched() {
            final var thrown = thrownBy("{\"error\":{\"type\":\"authorization_error\","
                    + "\"code\":\"MODEL_ACCESS_DENIED\","
                    + "\"message\":\"Access to the requested model is not allowed\","
                    + "\"details\":{\"model\":\"black-forest-labs/flux-1.1-pro\"}},"
                    + "\"timestamp\":\"" + RESPONSE_TIMESTAMP + "\"}");

            assertEquals("MODEL_ACCESS_DENIED", thrown.getCode());
            assertEquals("authorization_error", thrown.getType());
            assertNull(thrown.getPredictionError());
            assertNull(thrown.getReason());
        }

        @Test
        void fallsBackWhenDetailsAreNotAV2Object() {
            final var thrown = thrownBy("{\"error\":{\"type\":\"invalid_request_error\","
                    + "\"code\":\"PREDICTION_FAILED\",\"message\":\"Something failed\","
                    + "\"details\":\"not an object\"}}");

            assertEquals("PREDICTION_FAILED", thrown.getCode());
            assertNull(thrown.getPredictionError());
            assertEquals("Something failed", thrown.getMessage());
        }

        @Test
        void surfacesThroughTheAsyncCompletionChainToo() {
            // The async client is `executeRequestAsync(...).thenApply(handleResponse)`,
            // so its failure arrives wrapped in a CompletionException. The
            // populated exception must survive that unwrapping — an async
            // caller has to be able to read `reason` / `retryable` as well.
            final var future = CompletableFuture.completedFuture(
                            response(predictionFailedBody(INPUT_FETCH_FAILED_JSON), 400))
                    .thenApply(response -> httpClient.wrapInResult(response, Object.class));

            final var completion = assertThrows(CompletionException.class, future::join);
            final var cause = assertInstanceOf(SunraException.class, completion.getCause());

            assertEquals("invalid_input", cause.getCode());
            assertEquals("input_fetch_failed", cause.getReason());
            assertEquals(Boolean.FALSE, cause.getRetryable());
            assertNotNull(cause.getPredictionError());
        }
    }

    @Nested
    @DisplayName("subscribeToStatus agrees with result()")
    class StatusPath {

        @Test
        void agreesWithWhatTheResultEndpointWouldHaveSaid() {
            // The point of the exercise: two ways of learning a prediction
            // failed must not disagree about what the failure was. (The
            // sync and async clients now share this one helper, and the
            // client-async module asserts that too.)
            final var fromStatus = QueueStatus.toException(
                    completedWith(INPUT_FETCH_FAILED_JSON), "pd_x");
            final var fromResult = assertThrows(
                    SunraException.class,
                    () -> new HttpClient(
                ClientConfig.withCredentials(CredentialsResolver.fromApiKey("test-key")),
                new okhttp3.OkHttpClient())
                            .wrapInResult(
                                    response(predictionFailedBody(INPUT_FETCH_FAILED_JSON), 400),
                                    Object.class));

            assertEquals(fromResult.getCode(), fromStatus.getCode());
            assertEquals(fromResult.getReason(), fromStatus.getReason());
            assertEquals(fromResult.getRetryable(), fromStatus.getRetryable());
            assertEquals(fromResult.getMessage(), fromStatus.getMessage());
            assertEquals(fromResult.getPredictionError(), fromStatus.getPredictionError());
        }

        @Test
        void carriesTheV2FieldsFromAFailedStatus() {
            final var thrown = QueueStatus.toException(
                    completedWith(MODERATION_BLOCKED_JSON), "pd_a839exsaLNmVZzWvDaxAuapS");

            assertEquals("unsafe_content", thrown.getCode());
            assertEquals("moderation_blocked", thrown.getReason());
            assertEquals(Boolean.FALSE, thrown.getRetryable());
            // No response envelope on this path — so no outer timestamp, and
            // the failure time is on the unambiguous field.
            assertNull(thrown.getTimestamp());
            assertEquals("2026-08-14T17:51:47.206Z", thrown.getPredictionError().getTimestamp());
        }

        @Test
        void degradesToAPlainFailureWhenTheStatusCarriesNoError() {
            final var thrown = QueueStatus.toException(completedWith(null), "pd_x");

            assertEquals("Request failed", thrown.getMessage());
            assertNull(thrown.getPredictionError());
            assertNull(thrown.getReason());
        }
    }

    @Nested
    @DisplayName("SunraException serialization")
    class Serialization {

        @Test
        void reasonAndRetryableRideInsideTheErrorEnvelope() {
            final var error = PredictionError.fromJson(json(INPUT_FETCH_FAILED_JSON));
            final var exception = SunraException.fromPredictionError(error, "req_1", null, null);

            @SuppressWarnings("unchecked")
            final var serialized = (java.util.Map<String, Object>) exception.toMap().get("error");
            assertEquals("input_fetch_failed", serialized.get("reason"));
            // `false` is an answer, not an absence — a truthiness check drops it.
            assertEquals(Boolean.FALSE, serialized.get("retryable"));
        }

        @Test
        void namesTheReasonAndRetryVerdictInToString() {
            final var error = PredictionError.fromJson(json(INPUT_FETCH_FAILED_JSON));
            final var rendered =
                    SunraException.fromPredictionError(error, "req_1", null, null).toString();

            assertTrue(rendered.contains("Reason: input_fetch_failed"));
            assertTrue(rendered.contains("Retryable: false"));
        }

        @Test
        void existingConstructorsStillCompileAndCarryNoV2Fields() {
            // Backwards compatibility: nothing that used the old constructors
            // acquires invented reason/retryable values.
            final var legacy = new SunraException("boom", "req_1");
            assertNull(legacy.getReason());
            assertNull(legacy.getRetryable());
            assertNull(legacy.getPredictionError());
        }
    }
}
