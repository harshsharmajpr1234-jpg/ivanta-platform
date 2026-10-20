package com.ivanta.common.api;

import java.util.Map;

/** Standardized error envelope (§31): {"success":false,"code":...,"message":...,"fieldErrors":{}} */
public record ApiErrorBody(boolean success, String code, String message, Map<String, String> fieldErrors) {
    public static ApiErrorBody of(ErrorCode code, String message) {
        return new ApiErrorBody(false, code.name(), message, null);
    }
    public static ApiErrorBody of(ErrorCode code, String message, Map<String, String> fieldErrors) {
        return new ApiErrorBody(false, code.name(), message, fieldErrors);
    }
}
