"""SUNRA-819 Phase 4 — the prediction error contract v2 in the Python SDK.

`reason` / `retryable` carried through, and the `PREDICTION_FAILED` body of
`GET /queue/requests/:id` unpacked instead of arriving as an opaque `details`
dict (plan §5 Phase 4, r4-B2/r4-B3).

Every fixture is a verbatim prod row (`sunra-prod.predictions`, 2026-08-17
sweep). The two reasons here are the only two with live producers in prod.
"""

from __future__ import annotations

import httpx
import pytest

from sunra_client.client import (
    PREDICTION_FAILED_CODE,
    Completed,
    SunraClientError,
    SyncRequestHandle,
    _as_prediction_error,
    _raise_for_status,
)

# pd_VEwnjvrLmVq5hzjpY5gUsNq4 (2026-08-14) — the SUNRA-841 input-fetch class.
PROD_INPUT_FETCH_FAILED = {
    "code": "invalid_input",
    "message": (
        "Failed to fetch an input file (https://eae11ef1ce149104a83288cc3847b6fb"
        ".r2.cloudflarestorage.com/clawly-conductor-lab-artifacts/inbound/"
        "imsg_smoke_eng8643_20260803T042129Z_4...): HTTP 403."
    ),
    "reason": "input_fetch_failed",
    "retryable": False,
    "timestamp": "2026-08-14T18:22:33.179Z",
}

# pd_a839exsaLNmVZzWvDaxAuapS (2026-08-14) — the moderation class.
PROD_MODERATION_BLOCKED = {
    "code": "unsafe_content",
    "message": (
        "The prediction may contain sensitive or restricted content and has "
        "been suppressed. Please revise your input."
    ),
    "reason": "moderation_blocked",
    "retryable": False,
    "timestamp": "2026-08-14T17:51:47.206Z",
}

# pd_Gf4L83a52tmeQBeqm2w4GdnQ — a pre-v2 row, still the bulk of the table.
PROD_PRE_V2 = {
    "code": "service_provider_error",
    "message": "Predict failed. Please try again.",
}

# When the API answered, as opposed to when the prediction failed.
RESPONSE_TIMESTAMP = "2026-08-17T09:00:00.000Z"


def prediction_failed_body(error: dict) -> dict:
    """The wire body `GET /queue/requests/:id` returns for a failed prediction."""
    return {
        "error": {
            "type": "invalid_request_error",
            "code": PREDICTION_FAILED_CODE,
            "message": error["message"],
            "details": dict(error),
        },
        "request_id": "req_01JXQ2",
        "timestamp": RESPONSE_TIMESTAMP,
        "path": "/v1/queue/requests/pd_VEwnjvrLmVq5hzjpY5gUsNq4",
    }


def response_with(body: dict, status_code: int = 400) -> httpx.Response:
    return httpx.Response(
        status_code=status_code,
        json=body,
        headers={"x-request-id": "req_01JXQ2"},
        request=httpx.Request("GET", "https://api.sunra.ai/v1/queue/requests/pd_x"),
    )


def raised_by(body: dict, status_code: int = 400) -> SunraClientError:
    with pytest.raises(SunraClientError) as excinfo:
        _raise_for_status(response_with(body, status_code))
    return excinfo.value


class TestAsPredictionError:
    """A guard, not a cast."""

    def test_recognises_the_prod_v2_object(self):
        assert _as_prediction_error(dict(PROD_INPUT_FETCH_FAILED)) == PROD_INPUT_FETCH_FAILED

    def test_invents_nothing_for_a_pre_v2_object(self):
        parsed = _as_prediction_error(dict(PROD_PRE_V2))
        assert parsed == PROD_PRE_V2
        assert "reason" not in parsed
        assert "retryable" not in parsed

    @pytest.mark.parametrize(
        "details",
        [
            None,
            "boom",
            [{"code": "a", "message": "b"}],
            {"message": "b"},
            {"code": "a"},
            {"code": 42, "message": "b"},
            {"code": "a", "message": ["b"]},
        ],
        ids=["none", "string", "list", "no-code", "no-message", "int-code", "list-message"],
    )
    def test_falls_back_for_anything_that_is_not_a_v2_object(self, details):
        assert _as_prediction_error(details) is None

    def test_drops_wrongly_typed_optionals_rather_than_coercing(self):
        assert _as_prediction_error(
            {"code": "invalid_input", "message": "x", "reason": 42, "retryable": "false"}
        ) == {"code": "invalid_input", "message": "x"}

    def test_a_bool_retryable_true_survives(self):
        parsed = _as_prediction_error(
            {"code": "internal_server_error", "message": "x", "retryable": True}
        )
        assert parsed["retryable"] is True


class TestRaiseForStatusPromotesPredictionFailed:
    def test_promotes_the_v2_object_to_first_class_fields(self):
        error = raised_by(prediction_failed_body(PROD_INPUT_FETCH_FAILED))

        # Not PREDICTION_FAILED: the caller wants to know WHY, and this is the
        # same code `get()` surfaces for the same failure.
        assert error.code == "invalid_input"
        assert error.reason == "input_fetch_failed"
        assert error.retryable is False
        assert error.type == "prediction_failed"
        assert error.message == PROD_INPUT_FETCH_FAILED["message"]
        assert error.request_id == "req_01JXQ2"

    def test_keeps_the_prediction_error_as_its_own_envelope(self):
        error = raised_by(prediction_failed_body(PROD_MODERATION_BLOCKED))
        assert error.prediction_error == PROD_MODERATION_BLOCKED

    def test_models_the_two_timestamps_separately(self):
        # r4-B3: the outer envelope's timestamp is when the API answered; the
        # prediction failed days earlier. Collapsing them into one field would
        # silently lie about one of the two.
        error = raised_by(prediction_failed_body(PROD_INPUT_FETCH_FAILED))

        assert error.timestamp == RESPONSE_TIMESTAMP
        assert error.prediction_error["timestamp"] == "2026-08-14T18:22:33.179Z"
        assert error.timestamp != error.prediction_error["timestamp"]

    def test_synthesizes_nothing_for_a_pre_v2_failure(self):
        error = raised_by(prediction_failed_body(PROD_PRE_V2))

        assert error.code == "service_provider_error"
        assert error.reason is None
        assert error.retryable is None
        assert "reason" not in error.to_dict()["error"]
        assert "retryable" not in error.to_dict()["error"]

    def test_leaves_a_non_prediction_api_error_untouched(self):
        error = raised_by(
            {
                "error": {
                    "type": "authorization_error",
                    "code": "MODEL_ACCESS_DENIED",
                    "message": "Access to the requested model is not allowed",
                    "details": {"model": "black-forest-labs/flux-1.1-pro"},
                },
                "timestamp": RESPONSE_TIMESTAMP,
            },
            status_code=403,
        )

        assert error.code == "MODEL_ACCESS_DENIED"
        assert error.type == "authorization_error"
        assert error.prediction_error is None
        assert error.reason is None
        assert error.details == {"model": "black-forest-labs/flux-1.1-pro"}

    def test_malformed_details_fall_back_instead_of_crashing(self):
        error = raised_by(
            {
                "error": {
                    "type": "invalid_request_error",
                    "code": PREDICTION_FAILED_CODE,
                    "message": "Something failed",
                    "details": "not an object",
                }
            }
        )

        assert error.code == PREDICTION_FAILED_CODE
        assert error.prediction_error is None
        assert error.message == "Something failed"

    def test_a_non_json_body_still_raises_without_v2_fields(self):
        response = httpx.Response(
            status_code=502,
            text="<html>bad gateway</html>",
            request=httpx.Request("GET", "https://api.sunra.ai/v1/queue/requests/pd_x"),
        )
        with pytest.raises(SunraClientError) as excinfo:
            _raise_for_status(response)

        assert excinfo.value.reason is None
        assert excinfo.value.retryable is None
        assert excinfo.value.prediction_error is None


class TestSerialization:
    def test_reason_and_retryable_ride_inside_the_error_envelope(self):
        error = SunraClientError(
            message=PROD_INPUT_FETCH_FAILED["message"],
            code="invalid_input",
            reason="input_fetch_failed",
            retryable=False,
        )
        assert error.to_dict()["error"]["reason"] == "input_fetch_failed"
        # `False` is an answer, not an absence — truthiness would drop it.
        assert error.to_dict()["error"]["retryable"] is False

    def test_retryable_true_serializes_too(self):
        error = SunraClientError(
            message="The prediction stalled and was terminated. Please retry.",
            code="internal_server_error",
            reason="reaped_stalled",
            retryable=True,
        )
        assert error.to_dict()["error"]["retryable"] is True

    def test_str_names_the_reason_and_the_retry_verdict(self):
        rendered = str(
            SunraClientError(
                message="boom", code="invalid_input", reason="input_fetch_failed",
                retryable=False,
            )
        )
        assert "(input_fetch_failed)" in rendered
        assert "not retryable" in rendered

    def test_an_error_without_a_timestamp_constructs(self):
        error = SunraClientError(message="Predict failed.", code="service_provider_error")
        assert error.timestamp is None
        assert "timestamp" not in error.to_dict()


class TestHandleGetRaisesTheV2Error:
    """`result()` / `get()` on a failed prediction (r4-B2).

    Python's `result()` delegates to `handle.get()`, which polls status and
    raises before it ever reaches the result endpoint — so this is the path a
    user hits, and it must carry the same fields the result endpoint would.
    """

    @staticmethod
    def handle_returning(status: Completed) -> SyncRequestHandle:
        handle = SyncRequestHandle(
            request_id="pd_VEwnjvrLmVq5hzjpY5gUsNq4",
            response_url="https://api.sunra.ai/v1/queue/requests/pd_x",
            status_url="https://api.sunra.ai/v1/queue/requests/pd_x/status",
            cancel_url="https://api.sunra.ai/v1/queue/requests/pd_x/cancel",
            client=None,  # never used: iter_events is stubbed out below
        )
        object.__setattr__(handle, "iter_events", lambda **_: iter([status]))
        return handle

    def test_raises_with_reason_and_retryable(self):
        handle = self.handle_returning(
            Completed(success=False, error=dict(PROD_INPUT_FETCH_FAILED))
        )

        with pytest.raises(SunraClientError) as excinfo:
            handle.get()

        assert excinfo.value.code == "invalid_input"
        assert excinfo.value.reason == "input_fetch_failed"
        assert excinfo.value.retryable is False
        assert excinfo.value.prediction_error == PROD_INPUT_FETCH_FAILED

    def test_raises_without_inventing_them_for_a_pre_v2_row(self):
        handle = self.handle_returning(Completed(success=False, error=dict(PROD_PRE_V2)))

        with pytest.raises(SunraClientError) as excinfo:
            handle.get()

        assert excinfo.value.code == "service_provider_error"
        assert excinfo.value.reason is None
        assert excinfo.value.retryable is None

    def test_agrees_with_what_the_result_endpoint_would_have_said(self):
        # The point of the exercise: two ways of learning a prediction failed
        # must not disagree about what the failure was.
        handle = self.handle_returning(
            Completed(success=False, error=dict(PROD_MODERATION_BLOCKED))
        )
        with pytest.raises(SunraClientError) as excinfo:
            handle.get()
        from_status = excinfo.value

        from_result = raised_by(prediction_failed_body(PROD_MODERATION_BLOCKED))

        assert from_status.code == from_result.code
        assert from_status.reason == from_result.reason
        assert from_status.retryable == from_result.retryable
        assert from_status.message == from_result.message
        assert from_status.prediction_error == from_result.prediction_error
        # `type` was the one field this comparison originally omitted, and it
        # was the one field that had actually drifted (the status path left it
        # None). Asserted explicitly so the gap cannot reopen.
        assert from_status.type == from_result.type == "prediction_failed"

    def test_a_pre_v2_status_failure_gets_no_invented_type(self):
        # No v2 object means nothing to classify: the type stays None rather
        # than being asserted on a failure we could not parse.
        handle = self.handle_returning(Completed(success=False, error=None))

        with pytest.raises(SunraClientError) as excinfo:
            handle.get()

        assert excinfo.value.type is None
        assert excinfo.value.prediction_error is None
