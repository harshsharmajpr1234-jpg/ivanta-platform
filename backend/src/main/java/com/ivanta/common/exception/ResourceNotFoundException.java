package com.ivanta.common.exception;

import com.ivanta.common.api.ErrorCode;

public class ResourceNotFoundException extends BusinessException {
    public ResourceNotFoundException(String what) {
        super(ErrorCode.NOT_FOUND, what + " not found");
    }
}
