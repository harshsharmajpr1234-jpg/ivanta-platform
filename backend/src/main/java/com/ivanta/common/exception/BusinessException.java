package com.ivanta.common.exception;

import com.ivanta.common.api.ErrorCode;
import lombok.Getter;

/** Base for all domain errors; carries the standardized ErrorCode (§31). */
@Getter
public class BusinessException extends RuntimeException {
    private final ErrorCode code;

    public BusinessException(ErrorCode code, String message) {
        super(message);
        this.code = code;
    }
}
