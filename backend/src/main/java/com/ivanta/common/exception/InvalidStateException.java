package com.ivanta.common.exception;

import com.ivanta.common.api.ErrorCode;

/** Raised on illegal state transitions (sell request, payment, offer...). */
public class InvalidStateException extends BusinessException {
    public InvalidStateException(String message) { super(ErrorCode.INVALID_STATE, message); }
}
