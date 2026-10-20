package com.ivanta.delivery;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.ivanta.common.api.ApiResponse;
import com.ivanta.dto.DeliveryDtos.EventRequest;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;
import java.util.Map;

@Slf4j
@RestController
@RequestMapping("/api/v1/webhooks/courier")
@RequiredArgsConstructor
public class CourierWebhookController {

    private final CourierWebhookRepository webhooks;
    private final DeliveryService delivery;
    private final ShipmentRepository shipments;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @PostMapping("/{provider}")
    public ResponseEntity<ApiResponse<String>> handleWebhook(
            @PathVariable String provider,
            @RequestBody String rawPayload,
            @RequestHeader Map<String, String> headers) {

        log.info("[COURIER WEBHOOK] Received webhook from provider '{}'", provider);

        try {
            String hash = sha256(provider + ":" + rawPayload);
            if (webhooks.existsByEventHash(hash)) {
                log.info("[COURIER WEBHOOK] Duplicate webhook event hash {}, skipping processing", hash);
                return ResponseEntity.ok(ApiResponse.ok("Duplicate event processed idempotently"));
            }

            CourierWebhook wh = new CourierWebhook();
            wh.setProvider(provider);
            wh.setEventType("TRACKING_UPDATE");
            wh.setEventHash(hash);
            wh.setPayload(rawPayload);
            wh.setProcessed(false);
            webhooks.save(wh);

            Map payloadMap = objectMapper.readValue(rawPayload, Map.class);
            String trackingNumber = extractTrackingNumber(provider, payloadMap);
            String status = extractStatus(provider, payloadMap);
            String location = extractLocation(provider, payloadMap);
            String description = extractDescription(provider, payloadMap);

            if (trackingNumber != null && status != null) {
                wh.setTrackingNumber(trackingNumber);
                shipments.findByTrackingNumber(trackingNumber).ifPresent(s -> {
                    delivery.addEvent(s.getId(), new EventRequest(status, description != null ? description : "Courier tracking update", location), "WEBHOOK:" + provider);
                    log.info("[COURIER WEBHOOK] Successfully processed update for shipment {} (AWB {}): status={}", s.getId(), trackingNumber, status);
                });
            }

            wh.setProcessed(true);
            webhooks.save(wh);

            return ResponseEntity.ok(ApiResponse.ok("Webhook processed successfully"));

        } catch (Exception e) {
            log.error("[COURIER WEBHOOK] Error processing webhook for provider '{}': {}", provider, e.getMessage(), e);
            return ResponseEntity.ok(ApiResponse.ok("Webhook received with processing note: " + e.getMessage()));
        }
    }

    private String extractTrackingNumber(String provider, Map map) {
        if (map == null) return null;
        if (map.containsKey("awb")) return (String) map.get("awb");
        if (map.containsKey("awb_code")) return (String) map.get("awb_code");
        if (map.containsKey("waybill")) return (String) map.get("waybill");
        if (map.containsKey("tracking_number")) return (String) map.get("tracking_number");

        if (map.containsKey("current_status")) {
            Map data = (Map) map.get("data");
            if (data != null && data.containsKey("awb")) return (String) data.get("awb");
        }
        return null;
    }

    private String extractStatus(String provider, Map map) {
        if (map == null) return "IN_TRANSIT";
        String raw = null;
        if (map.containsKey("current_status")) raw = String.valueOf(map.get("current_status"));
        else if (map.containsKey("status")) raw = String.valueOf(map.get("status"));
        else if (map.containsKey("event_type")) raw = String.valueOf(map.get("event_type"));

        if (raw == null) return "IN_TRANSIT";
        String s = raw.toUpperCase();
        if (s.contains("DELIVERED")) return "DELIVERED";
        if (s.contains("OUT FOR DELIVERY") || s.contains("DISPATCH")) return "OUT_FOR_DELIVERY";
        if (s.contains("TRANSIT") || s.contains("SHIPPED") || s.contains("MANIFEST")) return "IN_TRANSIT";
        if (s.contains("PICKED UP") || s.contains("PICKUP")) return "PICKED_UP";
        if (s.contains("RTO") || s.contains("RETURN")) return "RETURN_TO_ORIGIN";
        if (s.contains("CANCEL") || s.contains("FAIL")) return "FAILED";
        return "IN_TRANSIT";
    }

    private String extractLocation(String provider, Map map) {
        if (map == null) return null;
        if (map.containsKey("location")) return String.valueOf(map.get("location"));
        if (map.containsKey("current_location")) return String.valueOf(map.get("current_location"));
        if (map.containsKey("scanned_location")) return String.valueOf(map.get("scanned_location"));
        return null;
    }

    private String extractDescription(String provider, Map map) {
        if (map == null) return "Tracking status updated";
        if (map.containsKey("scans_comment")) return String.valueOf(map.get("scans_comment"));
        if (map.containsKey("remarks")) return String.valueOf(map.get("remarks"));
        if (map.containsKey("instructions")) return String.valueOf(map.get("instructions"));
        if (map.containsKey("activity")) return String.valueOf(map.get("activity"));
        return "Tracking status updated via courier webhook";
    }

    private String sha256(String data) throws Exception {
        MessageDigest md = MessageDigest.getInstance("SHA-256");
        byte[] hash = md.digest(data.getBytes(StandardCharsets.UTF_8));
        return HexFormat.of().formatHex(hash);
    }
}
