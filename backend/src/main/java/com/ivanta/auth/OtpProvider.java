package com.ivanta.auth;

/**
 * OTP delivery abstraction (§9): mock for development; production providers
 * (MSG91/Twilio/SES) implement the same interface and keep secrets server-side.
 */
public interface OtpProvider {

    /** Generates a fresh code for the identifier (email or phone). */
    String generateCode(String identifier);

    /** Delivers the code. Must never log the code in production providers. */
    void send(String identifier, OtpCode.Channel channel, String code);

    String providerName();
}
