package com.ivanta;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;
import org.springframework.scheduling.annotation.EnableScheduling;
import org.springframework.transaction.annotation.EnableTransactionManagement;

/**
 * iVanta — used Apple device acquisition platform.
 * Modular monolith: Controller -> Service -> Repository -> MySQL (Flyway-managed schema).
 */
@SpringBootApplication
@ConfigurationPropertiesScan
@EnableTransactionManagement
@EnableScheduling
public class IvantaBackendApplication {
    public static void main(String[] args) {
        SpringApplication.run(IvantaBackendApplication.class, args);
    }
}
