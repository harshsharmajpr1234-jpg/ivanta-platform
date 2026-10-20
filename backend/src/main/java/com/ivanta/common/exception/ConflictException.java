package com.ivanta.common.exception;

import com.ivanta.common.api.ErrorCode;

public class ConflictException extends BusinessException {
    public ConflictException(String message) { super(ErrorCode.CONFLICT, message); }
}
