package com.ivanta.delivery.provider;

import com.fasterxml.jackson.annotation.JsonProperty;
import com.ivanta.config.IvantaProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class ShiprocketCourierProvider implements CourierProvider {

    private final IvantaProperties props;
    private final RestTemplate restTemplate = new RestTemplate();

    private String cachedToken = null;
    private Instant tokenExpiry = Instant.EPOCH;

    @Override
    public String getName() {
        return "shiprocket";
    }

    private synchronized String getAuthToken() {
        if (cachedToken != null && Instant.now().isBefore(tokenExpiry)) {
            return cachedToken;
        }

        IvantaProperties.Delivery.Shiprocket cfg = props.getDelivery().getShiprocket();
        if (cfg.getEmail().isBlank() || cfg.getPassword().isBlank()) {
            throw new IllegalStateException("Shiprocket credentials (SHIPROCKET_EMAIL, SHIPROCKET_PASSWORD) are not configured");
        }

        try {
            Map<String, String> body = Map.of("email", cfg.getEmail(), "password", cfg.getPassword());
            HttpHeaders headers = new HttpHeaders();
            headers.setContentType(MediaType.APPLICATION_JSON);
            HttpEntity<Map<String, String>> request = new HttpEntity<>(body, headers);

            String url = cfg.getApiBaseUrl() + "/auth/login";
            ResponseEntity<Map> response = restTemplate.postForEntity(url, request, Map.class);
            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                cachedToken = (String) response.getBody().get("token");
                tokenExpiry = Instant.now().plusSeconds(9 * 86400); // 9 days TTL
                log.info("[SHIPROCKET] Successfully authenticated with Shiprocket API");
                return cachedToken;
            }
        } catch (Exception e) {
            log.error("[SHIPROCKET] Authentication failed: {}", e.getMessage());
            throw new IllegalStateException("Shiprocket authentication failed: " + e.getMessage(), e);
        }
        throw new IllegalStateException("Shiprocket authentication returned null token");
    }

    private HttpHeaders createAuthHeaders() {
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(getAuthToken());
        return headers;
    }

    @Override
    public ServiceabilityResult checkServiceability(String pickupPincode, String deliveryPincode, double weightKg, boolean cod) {
        try {
            IvantaProperties.Delivery.Shiprocket cfg = props.getDelivery().getShiprocket();
            String url = String.format("%s/courier/serviceability/?pickup_postcode=%s&delivery_postcode=%s&weight=%.2f&cod=%d",
                cfg.getApiBaseUrl(), pickupPincode, deliveryPincode, weightKg, cod ? 1 : 0);

            HttpEntity<Void> request = new HttpEntity<>(createAuthHeaders());
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map body = response.getBody();
                Integer status = (Integer) body.get("status");
                if (status != null && status == 200) {
                    Map data = (Map) body.get("data");
                    List<Map> availableCouriers = (List<Map>) data.get("available_courier_companies");
                    if (availableCouriers != null && !availableCouriers.isEmpty()) {
                        Map best = availableCouriers.get(0);
                        String courierName = (String) best.get("courier_name");
                        Double rate = ((Number) best.get("rate")).doubleValue();
                        String etd = (String) best.get("etd");
                        return new ServiceabilityResult(true, courierName, BigDecimal.valueOf(rate), 2, 5, "Serviceable via " + courierName + " (ETD: " + etd + ")");
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[SHIPROCKET] Serviceability check failed: {}", e.getMessage());
        }
        return new ServiceabilityResult(false, null, null, null, null, "Pincode is not serviceable via Shiprocket");
    }

    @Override
    public List<RateOption> calculateRates(String pickupPincode, String deliveryPincode, double weightKg, BigDecimal declaredValue, boolean cod) {
        List<RateOption> options = new ArrayList<>();
        try {
            IvantaProperties.Delivery.Shiprocket cfg = props.getDelivery().getShiprocket();
            String url = String.format("%s/courier/serviceability/?pickup_postcode=%s&delivery_postcode=%s&weight=%.2f&cod=%d&declared_value=%.2f",
                cfg.getApiBaseUrl(), pickupPincode, deliveryPincode, weightKg, cod ? 1 : 0, declaredValue.doubleValue());

            HttpEntity<Void> request = new HttpEntity<>(createAuthHeaders());
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map data = (Map) response.getBody().get("data");
                List<Map> couriers = (List<Map>) data.get("available_courier_companies");
                if (couriers != null) {
                    for (Map c : couriers) {
                        Number cid = (Number) c.get("courier_company_id");
                        String cname = (String) c.get("courier_name");
                        Number rate = (Number) c.get("rate");
                        options.add(new RateOption(
                            String.valueOf(cid),
                            cname,
                            BigDecimal.valueOf(rate.doubleValue()),
                            BigDecimal.valueOf(rate.doubleValue()),
                            2, 5
                        ));
                    }
                }
            }
        } catch (Exception e) {
            log.error("[SHIPROCKET] Calculate rates error: {}", e.getMessage());
        }
        return options;
    }

    @Override
    public ShipmentResult createShipment(ShipmentRequest req) {
        try {
            IvantaProperties.Delivery.Shiprocket cfg = props.getDelivery().getShiprocket();
            Map<String, Object> body = new HashMap<>();
            body.put("order_id", req.orderNumber());
            body.put("order_date", LocalDate.now().toString() + " 10:00");
            body.put("pickup_location", cfg.getPickupLocation());
            body.put("billing_customer_name", req.deliveryAddress().name());
            body.put("billing_last_name", "");
            body.put("billing_address", req.deliveryAddress().addressLine1());
            body.put("billing_address_2", req.deliveryAddress().addressLine2() == null ? "" : req.deliveryAddress().addressLine2());
            body.put("billing_city", req.deliveryAddress().city());
            body.put("billing_pincode", req.deliveryAddress().pincode());
            body.put("billing_state", req.deliveryAddress().state());
            body.put("billing_country", "India");
            body.put("billing_email", req.deliveryAddress().email() == null ? "customer@ivanta.in" : req.deliveryAddress().email());
            body.put("billing_phone", req.deliveryAddress().phone());
            body.put("shipping_is_billing", true);
            body.put("payment_method", req.isCod() ? "COD" : "Prepaid");

            List<Map<String, Object>> orderItems = new ArrayList<>();
            for (OrderItemSpec item : req.items()) {
                Map<String, Object> it = new HashMap<>();
                it.put("name", item.name());
                it.put("sku", item.sku());
                it.put("units", item.quantity());
                it.put("selling_price", item.price().doubleValue());
                orderItems.add(it);
            }
            body.put("order_items", orderItems);
            body.put("sub_total", req.orderTotal().doubleValue());
            body.put("length", 10);
            body.put("breadth", 10);
            body.put("height", 10);
            body.put("weight", req.weightKg());

            String createOrderUrl = cfg.getApiBaseUrl() + "/orders/create/adhoc";
            HttpEntity<Map<String, Object>> request = new HttpEntity<>(body, createAuthHeaders());
            ResponseEntity<Map> response = restTemplate.postForEntity(createOrderUrl, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map respBody = response.getBody();
                Number shiprocketOrderId = (Number) respBody.get("order_id");
                Number shiprocketShipmentId = (Number) respBody.get("shipment_id");
                String awb = (String) respBody.get("awb_code");

                // If AWB code not automatically assigned, request AWB assignment
                if (awb == null && shiprocketShipmentId != null) {
                    awb = assignAwb(shiprocketShipmentId.longValue());
                }

                String labelUrl = generateLabel(shiprocketShipmentId != null ? shiprocketShipmentId.longValue() : 0);

                return new ShipmentResult(
                    true,
                    String.valueOf(shiprocketOrderId),
                    String.valueOf(shiprocketShipmentId),
                    awb != null ? awb : "SR-" + shiprocketShipmentId,
                    "Shiprocket Logistics",
                    labelUrl,
                    "SR-PKP-" + shiprocketOrderId,
                    Instant.now().plusSeconds(86400),
                    LocalDate.now().plusDays(4),
                    "Shiprocket order created successfully"
                );
            }
        } catch (Exception e) {
            log.error("[SHIPROCKET] Create shipment error: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create Shiprocket shipment: " + e.getMessage(), e);
        }
        throw new RuntimeException("Failed to create Shiprocket shipment: API call returned unsuccessful response");
    }

    private String assignAwb(long shipmentId) {
        try {
            IvantaProperties.Delivery.Shiprocket cfg = props.getDelivery().getShiprocket();
            String url = cfg.getApiBaseUrl() + "/courier/assign/awb";
            Map<String, Object> body = Map.of("shipment_id", shipmentId);
            HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, createAuthHeaders());
            ResponseEntity<Map> resp = restTemplate.postForEntity(url, req, Map.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                Map data = (Map) resp.getBody().get("response");
                if (data != null && data.get("data") != null) {
                    Map innerData = (Map) data.get("data");
                    return (String) innerData.get("awb_code");
                }
            }
        } catch (Exception e) {
            log.warn("[SHIPROCKET] Assign AWB failed for shipment {}: {}", shipmentId, e.getMessage());
        }
        return null;
    }

    private String generateLabel(long shipmentId) {
        try {
            IvantaProperties.Delivery.Shiprocket cfg = props.getDelivery().getShiprocket();
            String url = cfg.getApiBaseUrl() + "/courier/generate/label";
            Map<String, Object> body = Map.of("shipment_id", List.of(shipmentId));
            HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, createAuthHeaders());
            ResponseEntity<Map> resp = restTemplate.postForEntity(url, req, Map.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                return (String) resp.getBody().get("label_url");
            }
        } catch (Exception e) {
            log.warn("[SHIPROCKET] Generate label failed for shipment {}: {}", shipmentId, e.getMessage());
        }
        return null;
    }

    @Override
    public boolean cancelShipment(String providerOrderId, String awbNumber) {
        try {
            IvantaProperties.Delivery.Shiprocket cfg = props.getDelivery().getShiprocket();
            String url = cfg.getApiBaseUrl() + "/orders/cancel";
            Map<String, Object> body = Map.of("ids", List.of(Long.parseLong(providerOrderId)));
            HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, createAuthHeaders());
            ResponseEntity<Map> resp = restTemplate.postForEntity(url, req, Map.class);
            return resp.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.error("[SHIPROCKET] Cancel shipment error: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public TrackingResult fetchTracking(String providerOrderId, String awbNumber) {
        try {
            IvantaProperties.Delivery.Shiprocket cfg = props.getDelivery().getShiprocket();
            String url = cfg.getApiBaseUrl() + "/courier/track/awb/" + awbNumber;
            HttpEntity<Void> req = new HttpEntity<>(createAuthHeaders());
            ResponseEntity<Map> resp = restTemplate.exchange(url, HttpMethod.GET, req, Map.class);

            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                Map trackingData = (Map) resp.getBody().get("tracking_data");
                if (trackingData != null) {
                    Map trackStatus = (Map) trackingData.get("shipment_track");
                    String currentStatus = trackStatus != null ? (String) trackStatus.get("current_status") : "UNKNOWN";
                    List<Map> activities = trackStatus != null ? (List<Map>) trackStatus.get("shipment_track_activities") : List.of();

                    List<TrackingEventSpec> events = new ArrayList<>();
                    if (activities != null) {
                        for (Map act : activities) {
                            String activity = (String) act.get("activity");
                            String location = (String) act.get("location");
                            String dateStr = (String) act.get("date");
                            events.add(new TrackingEventSpec(
                                mapStatus(activity),
                                activity,
                                location,
                                Instant.now()
                            ));
                        }
                    }
                    return new TrackingResult(
                        true,
                        mapStatus(currentStatus),
                        events.isEmpty() ? null : events.get(0).location(),
                        LocalDate.now().plusDays(2),
                        events,
                        resp.getBody().toString()
                    );
                }
            }
        } catch (Exception e) {
            log.error("[SHIPROCKET] Fetch tracking error for AWB {}: {}", awbNumber, e.getMessage());
        }
        return new TrackingResult(false, "UNKNOWN", null, null, List.of(), null);
    }

    @Override
    public ReversePickupResult createReversePickup(ReversePickupRequest req) {
        try {
            IvantaProperties.Delivery.Shiprocket cfg = props.getDelivery().getShiprocket();
            String url = cfg.getApiBaseUrl() + "/orders/create/return";

            Map<String, Object> body = new HashMap<>();
            body.put("order_id", "RET-" + req.returnId());
            body.put("order_date", LocalDate.now().toString() + " 10:00");
            body.put("pickup_customer_name", req.customerAddress().name());
            body.put("pickup_address", req.customerAddress().addressLine1());
            body.put("pickup_city", req.customerAddress().city());
            body.put("pickup_state", req.customerAddress().state());
            body.put("pickup_pincode", req.customerAddress().pincode());
            body.put("pickup_phone", req.customerAddress().phone());

            List<Map<String, Object>> items = new ArrayList<>();
            for (OrderItemSpec item : req.items()) {
                items.add(Map.of(
                    "name", item.name(),
                    "sku", item.sku(),
                    "units", item.quantity(),
                    "selling_price", item.price().doubleValue()
                ));
            }
            body.put("order_items", items);

            HttpEntity<Map<String, Object>> httpReq = new HttpEntity<>(body, createAuthHeaders());
            ResponseEntity<Map> resp = restTemplate.postForEntity(url, httpReq, Map.class);

            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                Map res = resp.getBody();
                Number retOrderId = (Number) res.get("order_id");
                String reverseAwb = (String) res.get("awb_code");
                return new ReversePickupResult(
                    true,
                    String.valueOf(retOrderId),
                    reverseAwb != null ? reverseAwb : "SR-REV-" + retOrderId,
                    "Shiprocket Reverse Logistics",
                    LocalDate.now().plusDays(1).toString(),
                    "Shiprocket return pickup requested"
                );
            }
        } catch (Exception e) {
            log.error("[SHIPROCKET] Create reverse pickup error: {}", e.getMessage());
        }
        return new ReversePickupResult(false, null, null, null, null, "Failed to schedule reverse pickup with Shiprocket");
    }

    private String mapStatus(String raw) {
        if (raw == null) return "LABEL_CREATED";
        String s = raw.toUpperCase();
        if (s.contains("DELIVERED")) return "DELIVERED";
        if (s.contains("OUT FOR DELIVERY")) return "OUT_FOR_DELIVERY";
        if (s.contains("TRANSIT") || s.contains("SHIPPED") || s.contains("DISPATCHED")) return "IN_TRANSIT";
        if (s.contains("PICKED UP") || s.contains("PICKED_UP")) return "PICKED_UP";
        if (s.contains("RTO") || s.contains("RETURN")) return "RETURN_TO_ORIGIN";
        if (s.contains("CANCEL")) return "FAILED";
        return "IN_TRANSIT";
    }
}
