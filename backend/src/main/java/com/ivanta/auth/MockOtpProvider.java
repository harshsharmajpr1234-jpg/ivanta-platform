package com.ivanta.auth;

import com.ivanta.config.IvantaProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

/**
 * Development OTP provider (§9): fixed code from DEV_OTP_CODE (default 123456),
 * delivery simulated via log line. Never enabled when a real provider is configured.
 */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ivanta.otp.provider", havingValue = "mock", matchIfMissing = true)
public class MockOtpProvider implements OtpProvider {

    private final IvantaProperties props;

    @Override
    public String generateCode(String identifier) {
        return props.getOtp().getMockFixedCode();
    }

    @Override
    public void send(String identifier, OtpCode.Channel channel, String code) {
        log.info("[MOCK OTP] {} -> {} : {} (not sent anywhere)", channel, identifier, code);
    }

    @Override
    public String providerName() { return "mock"; }
}
