package com.ivanta.common.api;

/** Standardized error codes (§50). */
public enum ErrorCode {
    VALIDATION_ERROR(400),
    UNAUTHORIZED(401),
    FORBIDDEN(403),
    NOT_FOUND(404),
    CONFLICT(409),
    INVALID_STATE(409),
    OUT_OF_STOCK(409),
    INVALID_COUPON(422),
    PAYMENT_FAILED(402),
    PAYMENT_VERIFICATION_FAILED(402),
    NOT_SERVICEABLE(422),
    ORDER_CANCELLED(409),
    RETURN_NOT_ALLOWED(422),
    RATE_LIMITED(423),
    SERVICE_UNAVAILABLE(503),
    INTERNAL_ERROR(500);

    private final int httpStatus;
    ErrorCode(int httpStatus) { this.httpStatus = httpStatus; }
    public int httpStatus() { return httpStatus; }
}
