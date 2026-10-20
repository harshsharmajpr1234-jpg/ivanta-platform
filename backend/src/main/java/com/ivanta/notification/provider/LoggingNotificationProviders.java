package com.ivanta.notification.provider;

import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/** Development channel providers (§42): every send is logged, nothing leaves the box. */
@Slf4j
@Configuration
public class LoggingNotificationProviders {

    @Bean
    public NotificationProvider emailProvider() {
        return logging("EMAIL");
    }

    @Bean
    public NotificationProvider smsProvider() {
        return logging("SMS");
    }

    @Bean
    public NotificationProvider whatsappProvider() {
        return logging("WHATSAPP");
    }

    @Bean
    public NotificationProvider pushProvider() {
        return logging("PUSH");
    }

    private NotificationProvider logging(String channel) {
        return new NotificationProvider() {
            @Override
            public String channel() { return channel; }

            @Override
            public void send(String recipient, String title, String body) {
                log.info("[MOCK {}] to={} | {} | {}", channel, recipient, title, body);
            }
        };
    }
}
