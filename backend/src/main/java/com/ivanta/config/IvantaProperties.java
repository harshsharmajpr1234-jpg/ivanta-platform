package com.ivanta.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;

import java.util.List;

/** Typed binding for the `ivanta.*` configuration block (no secrets hardcoded). */
@Getter
@Setter
@ConfigurationProperties(prefix = "ivanta")
public class IvantaProperties {

    private final Cors cors = new Cors();
    private final Security security = new Security();
    private final Otp otp = new Otp();
    private final Storage storage = new Storage();
    private final Checkout checkout = new Checkout();
    private final Returns returns = new Returns();
    private final Payment payment = new Payment();
    private final Geo geo = new Geo();
    private final Delivery delivery = new Delivery();

    @Getter @Setter
    public static class Cors {
        private List<String> allowedOrigins = List.of("http://localhost:3000");
    }

    @Getter @Setter
    public static class Security {
        private int adminSessionTtlMinutes = 30;
        private int userSessionTtlHours = 8;
        private int maxLoginFailures = 5;
        private int lockoutMinutes = 15;
        private String bootstrapAdminEmail = "";
        private String bootstrapAdminPassword = "";
        private String bootstrapAdminName = "iVanta Root Admin";
        private boolean devSeedDemoAdmins = false;
    }

    @Getter @Setter
    public static class Otp {
        private String provider = "mock";
        private String mockFixedCode = "123456";
        private int ttlSeconds = 300;
    }

    @Getter @Setter
    public static class Storage {
        private String provider = "local";
        private String localDir = "./uploads";
    }

    @Getter @Setter
    public static class Checkout {
        private int reservationTtlMinutes = 15;
        private boolean codEnabled = true;
        private long minOrderValue = 999;
    }

    @Getter @Setter
    public static class Returns {
        private int windowDays = 7;
    }

    @Getter @Setter
    public static class Payment {
        /** mock | razorpay — resolves the PaymentProvider bean (§25). */
        private String provider = "mock";
        /** Server-side secret for the mock provider's verification signature. */
        private String mockSecret = "dev-only-mock-secret-change-me";
        private final Razorpay razorpay = new Razorpay();

        @Getter @Setter
        public static class Razorpay {
            private String keyId = "";
            private String keySecret = "";
            private String webhookSecret = "";
        }
    }

    @Getter @Setter
    public static class Geo {
        /** dataset | google | mapbox | osm (§20). */
        private String provider = "dataset";
    }

    @Getter @Setter
    public static class Delivery {
        /** mock | shiprocket | delhivery — resolves the CourierProvider bean. */
        private String provider = "mock";
        private boolean autoShipOnPacked = true;
        private final Shiprocket shiprocket = new Shiprocket();
        private final Delhivery delhivery = new Delhivery();

        @Getter @Setter
        public static class Shiprocket {
            private String email = "";
            private String password = "";
            private String pickupLocation = "Primary Warehouse";
            private String apiBaseUrl = "https://apiv2.shiprocket.in/v1";
        }

        @Getter @Setter
        public static class Delhivery {
            private String apiToken = "";
            private String clientName = "";
            private String pickupLocation = "Primary Warehouse";
            private String apiBaseUrl = "https://track.delhivery.com";
        }
    }
}
