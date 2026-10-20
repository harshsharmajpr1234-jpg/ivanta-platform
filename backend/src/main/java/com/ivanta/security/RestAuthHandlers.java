package com.ivanta.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ivanta.common.api.ApiErrorBody;
import com.ivanta.common.api.ErrorCode;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.MediaType;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.web.access.AccessDeniedHandler;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

/** 401/403 responses in the standardized envelope (§13/§31). */
@Component
@RequiredArgsConstructor
public class RestAuthHandlers implements AuthenticationEntryPoint, AccessDeniedHandler {

    private final ObjectMapper mapper;

    @Override
    public void commence(jakarta.servlet.http.HttpServletRequest request, HttpServletResponse response,
                         org.springframework.security.core.AuthenticationException authException) throws IOException {
        write(response, ErrorCode.UNAUTHORIZED, "Authentication required");
    }

    @Override
    public void handle(jakarta.servlet.http.HttpServletRequest request, HttpServletResponse response,
                       AccessDeniedException accessDeniedException) throws IOException {
        write(response, ErrorCode.FORBIDDEN, "Authenticated but insufficient permission");
    }

    private void write(HttpServletResponse res, ErrorCode code, String message) throws IOException {
        res.setStatus(code.httpStatus());
        res.setContentType(MediaType.APPLICATION_JSON_VALUE);
        res.getWriter().write(mapper.writeValueAsString(ApiErrorBody.of(code, message)));
    }
}
