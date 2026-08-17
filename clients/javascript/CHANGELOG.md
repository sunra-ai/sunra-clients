# @sunra/client

## 0.5.0

### Minor Changes

- 912e991: Carry the prediction error contract v2 (`reason`, `retryable`) through all three SDKs, and unpack the `PREDICTION_FAILED` body the queue result endpoint now returns for a failed prediction (SUNRA-849 Phase 4a).

  **Additive on every path.** Existing fields, constructors and behaviour are unchanged; code that never reads the new fields sees no difference.

  - **`reason` / `retryable`** are surfaced as first-class fields on `SunraError` (JS), `SunraClientError` (Python) and `SunraException` (Java). Both are optional and both are **forwarded, never derived** — an absent `retryable` means the API published no authoritative verdict, and guessing one from `code` would dress a guess up as the API's word. Fall back to the per-code default documented at https://platform.sunra.ai/platform/errors.
  - **`result()` on a failed prediction** now rejects/raises with the actual failure instead of an opaque `details` bag. The v2 object is promoted to first-class fields, so `result()` and `subscribe()` produce the same shape for the same failure.
  - **Two timestamps, modelled separately.** The response envelope's `timestamp` (when the API answered) and the prediction's own failure time are different instants — for a prediction fetched days later, days apart. The failure time lives on `predictionError` / `prediction_error` / `getPredictionError()`.
  - **JS**: `timestamp` on the completed-queue-status error is now optional, matching what the API has always sent. New exported type `SunraPredictionError`.
  - **Java**: new `PredictionError` type, and the four hand-rolled copies of the failed-status parser across the sync and async queue clients are replaced by one shared `QueueStatus.toException`. Two live defects go with them: the async copies read `details` with `getAsString()`, which threw on the object-valued details the API actually sends, and dropped `type`. Separately, the synchronous `subscribeToStatus` re-wrapped its own structured exception in a bare one, discarding code, type, details and timestamp before the caller ever saw them; it now unwraps and rethrows.

## 0.4.0

### Minor Changes

- Add onError callback

## 0.3.9

### Patch Changes

- 7ef151c: Update the error handling

## 0.3.8

### Patch Changes

- Fix error handling in transformInput function to properly throw exceptions when captured

## 0.3.7

### Patch Changes

- 40c8307: Added file upload size limit documentation

  - Documented 100MB file upload limit for all SDK file upload operations
  - Clarified file upload behavior and constraints for developers
