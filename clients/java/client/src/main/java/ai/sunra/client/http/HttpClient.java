package ai.sunra.client.http;

import ai.sunra.client.ApiOptions;
import ai.sunra.client.ClientConfig;
import ai.sunra.client.Output;
import ai.sunra.client.exception.PredictionError;
import ai.sunra.client.exception.SunraException;
import ai.sunra.client.util.Version;
import com.google.gson.Gson;
import com.google.gson.JsonElement;
import jakarta.annotation.Nonnull;
import java.io.IOException;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.CompletableFuture;
import okhttp3.Call;
import okhttp3.Callback;
import okhttp3.HttpUrl;
import okhttp3.MediaType;
import okhttp3.OkHttpClient;
import okhttp3.Request;
import okhttp3.RequestBody;
import okhttp3.Response;

public class HttpClient {

    private static final String APPLICATION_JSON = "application/json";

    private static final String HEADER_REQUEST_ID = "x-request-id";

    /**
     * Error code the queue result endpoint returns when the prediction it was
     * asked for ended in {@code status: "failed"} (SUNRA-819 Phase 4). The only
     * marker that says "{@code details} is a prediction error object, not an
     * opaque bag".
     */
    public static final String PREDICTION_FAILED_CODE = "PREDICTION_FAILED";

    private static final String USER_AGENT = "sunra-client/" + Version.get() + " (java)";

    private final ClientConfig config;
    private final OkHttpClient client;
    private final Gson gson;

    public HttpClient(@Nonnull ClientConfig config, @Nonnull OkHttpClient client) {
        this.config = config;
        this.client = client;
        this.gson = new Gson();
    }

    @Nonnull
    public Request prepareRequest(@Nonnull String url, @Nonnull ApiOptions options) {
        return prepareRequest(url, options, Collections.EMPTY_MAP);
    }

    @Nonnull
    public Request prepareRequest(
            @Nonnull String url, @Nonnull ApiOptions options, @Nonnull Map<String, Object> queryParams) {
        var body = options.getInput() != null ? gson.toJson(options.getInput()) : null;
        if ("null".equals(body)) {
            body = "{}";
        }
        var urlBuilder = HttpUrl.parse(url).newBuilder();
        if (!queryParams.isEmpty()) {
            queryParams.forEach((key, value) -> urlBuilder.addQueryParameter(key, value.toString()));
        }
        final var httpMethod = Optional.ofNullable(options.getHttpMethod()).orElse("POST");
        return new Request.Builder()
                .addHeader("content-type", "application/json")
                .addHeader("accept", "application/json")
                .addHeader("user-agent", USER_AGENT)
                .method(
                        httpMethod,
                        !httpMethod.equalsIgnoreCase("GET") && body != null
                                ? RequestBody.create(body, MediaType.parse(APPLICATION_JSON))
                                : null)
                .url(urlBuilder.build().url())
                .build();
    }

    public Response executeRequest(Request request) {
        try {
            return client.newCall(request).execute();
        } catch (IOException ex) {
            throw new SunraException(ex);
        }
    }

    public CompletableFuture<Response> executeRequestAsync(Request request) {
        var future = new CompletableFuture<Response>();
        client.newCall(request).enqueue(new Callback() {
            @Override
            public void onResponse(Call call, Response response) {
                future.complete(response);
            }

            @Override
            public void onFailure(Call call, IOException e) {
                future.completeExceptionally(e);
            }
        });
        return future;
    }

    public <T> T handleResponse(Response response, Class<T> resultType) {
        final var requestId = response.header(HEADER_REQUEST_ID);
        if (!response.isSuccessful()) {
            throw responseToException(response);
        }
        final var body = response.body();
        if (body == null) {
            throw new SunraException("Response has empty body", requestId);
        }
        return gson.fromJson(body.charStream(), resultType);
    }

    private SunraException.RateLimitInfo extractRateLimitFromHeaders(Response response) {
        try {
            String limit = response.header("x-ratelimit-limit");
            String remaining = response.header("x-ratelimit-remaining");
            String reset = response.header("x-ratelimit-reset");

            if (limit != null && remaining != null && reset != null) {
                return new SunraException.RateLimitInfo(
                    Integer.parseInt(limit),
                    Integer.parseInt(remaining),
                    Integer.parseInt(reset)
                );
            }
        } catch (NumberFormatException e) {
            // Ignore parsing errors
        }

        return null;
    }

    public SunraException responseToException(Response response) {
        final var requestId = response.header(HEADER_REQUEST_ID);
        final var rateLimit = extractRateLimitFromHeaders(response);
        final var contentType = response.header("content-type");

        String message = "Request failed with code: " + response.code();
        String code = String.valueOf(response.code());
        String type = null;
        Object details = null;
        String timestamp = null;
        PredictionError predictionError = null;

        if (contentType != null && contentType.contains("application/json")) {
            final var body = response.body();
            if (body != null) {
                try {
                    final var json = gson.fromJson(body.charStream(), JsonElement.class);
                    if (json != null && json.isJsonObject() && !json.isJsonNull()) {
                        final var jsonObject = json.getAsJsonObject();

                        // Check if there's a nested error object (common API pattern)
                        if (jsonObject.has("error")) {
                            final var errorElement = jsonObject.get("error");
                            if (errorElement != null && !errorElement.isJsonNull() && errorElement.isJsonObject()) {
                                final var errorObject = errorElement.getAsJsonObject();

                                if (errorObject.has("message")) {
                                    message = errorObject.get("message").getAsString();
                                }
                                if (errorObject.has("code")) {
                                    code = errorObject.get("code").getAsString();
                                }
                                if (errorObject.has("type")) {
                                    type = errorObject.get("type").getAsString();
                                }
                                if (errorObject.has("details")) {
                                    details = gson.fromJson(errorObject.get("details"), Object.class);
                                }

                                // SUNRA-819 Phase 4: GET /queue/requests/:id on a
                                // FAILED prediction answers with code
                                // PREDICTION_FAILED and the v2 prediction error in
                                // `details`. Without this, `details` arrives as an
                                // opaque Object and the caller gets
                                // code=PREDICTION_FAILED — technically correct and
                                // useless: they would have to cast and dig to learn
                                // WHY, and result() would throw a different shape
                                // than subscribeToStatus() does for the very same
                                // failure. Promote it, and keep the whole object
                                // too (r4-B2/r4-B3): both envelopes carry a
                                // timestamp and they are not the same instant.
                                if (PREDICTION_FAILED_CODE.equals(code)) {
                                    predictionError = PredictionError.fromJson(errorObject.get("details"));
                                }
                            }
                        } else {
                            // Fallback to top-level fields for legacy responses
                            if (jsonObject.has("detail")) {
                                message = jsonObject.get("detail").getAsString();
                            }
                            if (jsonObject.has("code")) {
                                code = jsonObject.get("code").getAsString();
                            }
                            if (jsonObject.has("type")) {
                                type = jsonObject.get("type").getAsString();
                            }
                            if (jsonObject.has("details")) {
                                details = gson.fromJson(jsonObject.get("details"), Object.class);
                            }
                        }

                        // Extract top-level fields
                        if (jsonObject.has("timestamp")) {
                            timestamp = jsonObject.get("timestamp").getAsString();
                        }

                        // If details is still null for network errors, use the full JSON as details
                        if (details == null && type == null) {
                            details = gson.fromJson(json, Object.class);
                            type = "network_error";
                        }
                    }
                } catch (Exception e) {
                    // If JSON parsing fails, use the raw response text
                    try {
                        Map<String, Object> errorDetails = new HashMap<>();
                        errorDetails.put("raw_response", body.string());
                        errorDetails.put("status_code", response.code());
                        details = errorDetails;
                        type = "network_error";
                    } catch (Exception ignored) {
                        // Use default values
                    }
                }
            }
        }

        if (predictionError != null) {
            // `timestamp` stays the OUTER envelope's — when the API answered.
            // The failure time is inside the prediction error.
            return SunraException.fromPredictionError(predictionError, requestId, timestamp, rateLimit);
        }

        return new SunraException(message, code, type, details, timestamp, requestId, rateLimit);
    }

    public <T> Output<T> wrapInResult(Response response, Class<T> resultType) {
        final String requestId = response.header(HEADER_REQUEST_ID);
        return new Output<>(handleResponse(response, resultType), requestId);
    }

    public <T> T fromJson(JsonElement json, Class<T> type) {
        return gson.fromJson(json, type);
    }

    public <T> T fromJson(String json, Class<T> type) {
        return gson.fromJson(json, type);
    }

    public OkHttpClient getUnderlyingClient() {
        return client;
    }
}
