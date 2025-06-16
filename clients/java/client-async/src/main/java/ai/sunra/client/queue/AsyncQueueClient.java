package ai.sunra.client.queue;

import ai.sunra.client.Output;
import jakarta.annotation.Nonnull;
import java.util.concurrent.CompletableFuture;

public interface AsyncQueueClient {

    @Nonnull
    CompletableFuture<QueueStatus.InQueue> submit(String endpointId, QueueSubmitOptions options);

    @Nonnull
    CompletableFuture<QueueStatus.StatusUpdate> status(@Nonnull QueueStatusOptions options);

    @Nonnull
    CompletableFuture<QueueStatus.Completed> subscribeToStatus(@Nonnull QueueSubscribeOptions options);

    @Nonnull
    <O> CompletableFuture<Output<O>> result(@Nonnull QueueResultOptions<O> options);

    @Nonnull
    CompletableFuture<Object> cancel(@Nonnull QueueCancelOptions options);
}
