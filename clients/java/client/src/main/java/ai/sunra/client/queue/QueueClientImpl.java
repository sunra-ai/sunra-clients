package ai.sunra.client.queue;

import ai.sunra.client.Output;
import ai.sunra.client.exception.SunraException;
import ai.sunra.client.http.HttpClient;
import ai.sunra.client.queue.QueueStatus.Completed;
import com.google.gson.JsonObject;
import jakarta.annotation.Nonnull;
import jakarta.annotation.Nullable;
import java.util.HashMap;
import java.util.concurrent.CompletableFuture;
import okhttp3.Response;
import okhttp3.sse.EventSource;
import okhttp3.sse.EventSourceListener;
import okhttp3.sse.EventSources;

public class QueueClientImpl implements QueueClient {

    private final HttpClient httpClient;

    public QueueClientImpl(@Nonnull HttpClient httpClient) {
        this.httpClient = httpClient;
    }

    @Nonnull
    @Override
    public QueueStatus.InQueue submit(@Nonnull String endpointId, @Nonnull QueueSubmitOptions options) {
        final var url = "https://api.sunra.ai/v1/queue/" + endpointId;
        final var queryParams = new HashMap<String, Object>();
        if (options.getWebhookUrl() != null) {
            queryParams.put("sunra_webhook", options.getWebhookUrl());
        }
        final var request = httpClient.prepareRequest(url, options, queryParams);
        final var response = httpClient.executeRequest(request);
        return httpClient.handleResponse(response, QueueStatus.InQueue.class);
    }

    @Nonnull
    @Override
    public QueueStatus.StatusUpdate status(@Nonnull QueueStatusOptions options) {
        final var url = String.format("https://api.sunra.ai/v1/queue/requests/%s/status", options.getRequestId());

        final var queryParams = new HashMap<String, Object>();
        if (options.getLogs() != null && options.getLogs()) {
            queryParams.put("logs", "1");
        }

        final var request = httpClient.prepareRequest(url, options, queryParams);
        final var response = httpClient.executeRequest(request);
        final var result = httpClient.handleResponse(response, JsonObject.class);
        return httpClient.fromJson(result, QueueStatus.resolveType(result));
    }

    @Override
    @Nonnull
    public Completed subscribeToStatus(@Nonnull QueueSubscribeOptions options) {
        final var url =
                String.format("https://api.sunra.ai/v1/queue/requests/%s/status/stream", options.getRequestId());

        final var queryParams = new HashMap<String, Object>();
        if (options.getLogs() != null && options.getLogs()) {
            queryParams.put("logs", "1");
        }
        final var request = httpClient
                .prepareRequest(url, options, queryParams)
                .newBuilder()
                .addHeader("Accept", "text/event-stream")
                .build();

        final var future = new CompletableFuture<Completed>();

        final var factory = EventSources.createFactory(httpClient.getUnderlyingClient());
        final var listener = new EventSourceListener() {
            private QueueStatus.StatusUpdate currentStatus;

            @Override
            public void onEvent(
                    @Nonnull EventSource eventSource,
                    @Nullable String id,
                    @Nullable String type,
                    @Nonnull String data) {
                final var json = httpClient.fromJson(data, JsonObject.class);
                final var status = httpClient.fromJson(json, QueueStatus.resolveType(json));
                final var onUpdate = options.getOnQueueUpdate();
                if (onUpdate != null) {
                    onUpdate.accept(status);
                }
                this.currentStatus = status;
                if (currentStatus != null && currentStatus instanceof Completed) {
                    final var completed = (Completed) currentStatus;
                    if (!completed.isSuccess()) {
                        String errorMessage = "Request failed";
                        String code = null;
                        String errorType = null;
                        Object details = null;
                        String timestamp = null;

                        if (completed.getError() != null && !completed.getError().isJsonNull() && completed.getError().isJsonObject()) {
                            final var errorObject = completed.getError().getAsJsonObject();
                            if (errorObject.has("message")) {
                                errorMessage = errorObject.get("message").getAsString();
                            }
                            if (errorObject.has("code")) {
                                code = errorObject.get("code").getAsString();
                            }
                            if (errorObject.has("type")) {
                                errorType = errorObject.get("type").getAsString();
                            }
                            if (errorObject.has("details")) {
                                details = httpClient.fromJson(errorObject.get("details"), Object.class);
                            }
                            if (errorObject.has("timestamp")) {
                                timestamp = errorObject.get("timestamp").getAsString();
                            }
                        }

                        future.completeExceptionally(new SunraException(
                            errorMessage, code, errorType, details, timestamp, options.getRequestId(), null));
                        eventSource.cancel();
                        return;
                    }
                    future.complete(completed);
                    eventSource.cancel();
                }
            }

            @Override
            public void onClosed(@Nonnull EventSource eventSource) {
                if (currentStatus != null && currentStatus instanceof Completed) {
                    final var completed = (Completed) currentStatus;
                    if (!completed.isSuccess()) {
                        String errorMessage = "Request failed";
                        String code = null;
                        String errorType = null;
                        Object details = null;
                        String timestamp = null;

                        if (completed.getError() != null && !completed.getError().isJsonNull() && completed.getError().isJsonObject()) {
                            final var errorObject = completed.getError().getAsJsonObject();
                            if (errorObject.has("message")) {
                                errorMessage = errorObject.get("message").getAsString();
                            }
                            if (errorObject.has("code")) {
                                code = errorObject.get("code").getAsString();
                            }
                            if (errorObject.has("type")) {
                                errorType = errorObject.get("type").getAsString();
                            }
                            if (errorObject.has("details")) {
                                details = httpClient.fromJson(errorObject.get("details"), Object.class);
                            }
                            if (errorObject.has("timestamp")) {
                                timestamp = errorObject.get("timestamp").getAsString();
                            }
                        }

                        future.completeExceptionally(new SunraException(
                            errorMessage, code, errorType, details, timestamp, options.getRequestId(), null));
                        return;
                    }
                    future.complete(completed);
                    return;
                }
                future.completeExceptionally(new SunraException(
                        "Streaming closed with invalid state: " + currentStatus, options.getRequestId()));
            }

            @Override
            public void onFailure(
                    @Nonnull EventSource eventSource, @Nullable Throwable t, @Nullable Response response) {
                future.completeExceptionally(t);
            }
        };
        factory.newEventSource(request, listener);
        try {
            return future.get();
        } catch (Exception ex) {
            throw new SunraException(ex.getMessage(), ex, options.getRequestId());
        }
    }

    @Nonnull
    @Override
    public <O> Output<O> result(@Nonnull QueueResultOptions<O> options) {
        final var url = String.format("https://api.sunra.ai/v1/queue/requests/%s", options.getRequestId());
        final var request = httpClient.prepareRequest(url, options);

        final var response = httpClient.executeRequest(request);
        return httpClient.wrapInResult(response, options.getResultType());
    }

    @Override
    @Nonnull
    public Object cancel(@Nonnull QueueCancelOptions options) {
        final var url = String.format("https://api.sunra.ai/v1/queue/requests/%s/cancel", options.getRequestId());
        final var request = httpClient.prepareRequest(url, options);

        final var response = httpClient.executeRequest(request);
        final var result = httpClient.handleResponse(response, JsonObject.class);
        return result;
    }
}
