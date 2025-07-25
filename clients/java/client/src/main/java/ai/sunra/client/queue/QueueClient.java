package ai.sunra.client.queue;

import ai.sunra.client.Output;
import jakarta.annotation.Nonnull;

/** A client for interacting with the queue endpoints. */
public interface QueueClient {

    /**
     * Submit a payload to an endpoint's queue.
     *
     * @param endpointId the endpoint to submit to (e.g. `sunra/lcm`)
     * @param options the submit options
     * @return the status of the submission with the `requestId` for tracking the submission.
     */
    @Nonnull
    QueueStatus.InQueue submit(String endpointId, QueueSubmitOptions options);

    /**
     * Check the status of a submission.
     *
     * @param options the status check options
     * @return the status of the submission
     */
    @Nonnull
    QueueStatus.StatusUpdate status(@Nonnull QueueStatusOptions options);

    /**
     * Subscribe to the status of a submission.
     *
     * @param options the subscribe options
     * @return the status of the submission
     */
    @Nonnull
    QueueStatus.Completed subscribeToStatus(@Nonnull QueueSubscribeOptions options);

    /**
     * Get the result of a submission.
     *
     * @param <O> the type of the output payload
     * @param options the response options
     * @return the result of the submission
     */
    @Nonnull
    <O> Output<O> result(@Nonnull QueueResultOptions<O> options);

    /**
     * Cancel a submission.
     *
     * @param options the cancel options
     * @return the cancel of the submission
     */
    @Nonnull
    Object cancel(@Nonnull QueueCancelOptions options);
}
