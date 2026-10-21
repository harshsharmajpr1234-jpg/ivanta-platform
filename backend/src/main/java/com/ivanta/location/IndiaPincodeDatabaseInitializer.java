package com.ivanta.location;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.core.JsonToken;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.core.io.ClassPathResource;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.sql.PreparedStatement;
import java.sql.Timestamp;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.zip.GZIPInputStream;

/**
 * Initializes and seeds the complete All-India Postal Pincode Directory
 * (all 19,300+ PIN codes and 157,000+ Post Offices) directly into the database.
 * Sourced from the official Government of India / Department of Posts directory.
 */
@Slf4j
@Component
@Order(10)
@RequiredArgsConstructor
public class IndiaPincodeDatabaseInitializer implements ApplicationRunner {

    private final PincodeLookupCacheRepository cacheRepo;
    private final JdbcTemplate jdbcTemplate;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private record PincodeSeedItem(
            String pincode,
            String district,
            String state,
            String responseJson
    ) {}

    @Override
    public void run(ApplicationArguments args) {
        try {
            long existingCount = cacheRepo.count();
            if (existingCount >= 19000) {
                log.info("[PINCODE-INIT] All-India PIN code database already seeded ({} entries in DB).", existingCount);
                return;
            }

            log.info("[PINCODE-INIT] Found {} existing entries. Seeding all 19,300 India Post PIN codes into database...", existingCount);
            long startTime = System.currentTimeMillis();

            ClassPathResource resource = new ClassPathResource("data/india_pincodes.json.gz");
            if (!resource.exists()) {
                log.warn("[PINCODE-INIT] Dataset resource data/india_pincodes.json.gz not found on classpath!");
                return;
            }

            List<PincodeSeedItem> batch = new ArrayList<>(1000);
            int totalInserted = 0;

            String sql = "INSERT INTO pincode_lookup_cache (pincode, district, state, response_json, cached_at, expires_at) " +
                    "VALUES (?, ?, ?, ?, ?, ?) " +
                    "ON DUPLICATE KEY UPDATE response_json = VALUES(response_json), district = VALUES(district), state = VALUES(state), expires_at = VALUES(expires_at)";

            Timestamp cachedAt = Timestamp.from(Instant.now());
            Timestamp expiresAt = Timestamp.valueOf("2099-12-31 23:59:59");

            try (InputStream fileStream = resource.getInputStream();
                 GZIPInputStream gzipStream = new GZIPInputStream(fileStream);
                 JsonParser parser = objectMapper.getFactory().createParser(gzipStream)) {

                if (parser.nextToken() != JsonToken.START_ARRAY) {
                    log.error("[PINCODE-INIT] Invalid JSON structure: expected START_ARRAY");
                    return;
                }

                while (parser.nextToken() == JsonToken.START_OBJECT) {
                    String pincode = null;
                    String district = null;
                    String state = null;
                    String responseJson = null;

                    while (parser.nextToken() != JsonToken.END_OBJECT) {
                        String fieldName = parser.getCurrentName();
                        parser.nextToken();
                        if ("pincode".equals(fieldName)) {
                            pincode = parser.getText();
                        } else if ("district".equals(fieldName)) {
                            district = parser.getText();
                        } else if ("state".equals(fieldName)) {
                            state = parser.getText();
                        } else if ("response_json".equals(fieldName)) {
                            responseJson = parser.getText();
                        }
                    }

                    if (pincode != null && responseJson != null) {
                        batch.add(new PincodeSeedItem(pincode, district, state, responseJson));
                    }

                    if (batch.size() >= 1000) {
                        executeBatch(sql, batch, cachedAt, expiresAt);
                        totalInserted += batch.size();
                        batch.clear();
                    }
                }

                if (!batch.isEmpty()) {
                    executeBatch(sql, batch, cachedAt, expiresAt);
                    totalInserted += batch.size();
                    batch.clear();
                }
            }

            long duration = System.currentTimeMillis() - startTime;
            log.info("[PINCODE-INIT] Successfully seeded {} All-India PIN codes into database in {} ms! (Total in DB: {})",
                    totalInserted, duration, cacheRepo.count());

        } catch (Exception e) {
            log.error("[PINCODE-INIT] Error seeding All-India PIN codes: {}", e.getMessage(), e);
        }
    }

    private void executeBatch(String sql, List<PincodeSeedItem> batch, Timestamp cachedAt, Timestamp expiresAt) {
        jdbcTemplate.batchUpdate(sql, batch, batch.size(), (PreparedStatement ps, PincodeSeedItem item) -> {
            ps.setString(1, item.pincode());
            ps.setString(2, item.district());
            ps.setString(3, item.state());
            ps.setString(4, item.responseJson());
            ps.setTimestamp(5, cachedAt);
            ps.setTimestamp(6, expiresAt);
        });
    }
}
