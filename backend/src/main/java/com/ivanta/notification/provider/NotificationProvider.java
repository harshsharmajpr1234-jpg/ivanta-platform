package com.ivanta.notification.provider;

/**
 * Channel provider abstraction (§42): Email/SMS/WhatsApp/Push implementations
 * (SES, MSG91, Twilio, FCM...) plug in here. Dev providers only log —
 * no hardcoding of a single vendor in business logic.
 */
public interface NotificationProvider {

    String channel();   // EMAIL | SMS | WHATSAPP | PUSH

    void send(String recipient, String title, String body);
}
