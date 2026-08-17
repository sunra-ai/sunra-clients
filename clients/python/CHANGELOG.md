# sunra_client

## 0.6.0

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

## 0.3.0

### Minor Changes

- 6e45fc1: Add automatic input transformation functionality to Python SDK

  The Python client now automatically transforms various input types when calling `submit()` or `subscribe()` methods:

  - **PIL Image objects**: Automatically uploaded and replaced with URLs
  - **Base64 data URIs**: Decoded and uploaded with proper content type detection
  - **File paths**: Local files uploaded to CDN and replaced with URLs
  - **File-like objects**: Objects with `read()` method (e.g., BytesIO, file handles) uploaded automatically
  - **Recursive processing**: Works on nested dictionaries and lists

  This feature eliminates the need for manual file uploads and streamlines the developer experience when working with multimedia inputs. The transformation is performed automatically in both sync and async clients, with comprehensive error handling and support for various file formats.

  New methods added:

  - `transform_input()` - Available on both `AsyncClient` and `SyncClient` for manual transformation
  - Automatic integration with existing `submit()` and `subscribe()` methods

  The feature includes extensive test coverage and documentation with practical examples.

## 0.2.2

### Patch Changes

- eec3dad: Change the default image_format to "png" in the upload_image and encode_image function

## 0.2.1

### Patch Changes

- 7ef151c: Update the error handling
