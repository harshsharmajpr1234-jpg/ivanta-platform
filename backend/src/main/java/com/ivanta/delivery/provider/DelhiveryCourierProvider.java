package com.ivanta.delivery.provider;

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
public class DelhiveryCourierProvider implements CourierProvider {

    private final IvantaProperties props;
    private final RestTemplate restTemplate = new RestTemplate();

    @Override
    public String getName() {
        return "delhivery";
    }

    private HttpHeaders createAuthHeaders() {
        IvantaProperties.Delivery.Delhivery cfg = props.getDelivery().getDelhivery();
        if (cfg.getApiToken().isBlank()) {
            throw new IllegalStateException("Delhivery API token (DELHIVERY_API_TOKEN) is not configured");
        }
        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.set("Authorization", "Token " + cfg.getApiToken());
        return headers;
    }

    @Override
    public ServiceabilityResult checkServiceability(String pickupPincode, String deliveryPincode, double weightKg, boolean cod) {
        try {
            IvantaProperties.Delivery.Delhivery cfg = props.getDelivery().getDelhivery();
            String url = String.format("%s/c/api/pin-codes/json/?filter_codes=%s", cfg.getApiBaseUrl(), deliveryPincode);

            HttpEntity<Void> request = new HttpEntity<>(createAuthHeaders());
            ResponseEntity<Map> response = restTemplate.exchange(url, HttpMethod.GET, request, Map.class);

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map> codes = (List<Map>) response.getBody().get("delivery_codes");
                if (codes != null && !codes.isEmpty()) {
                    Map codeInfo = (Map) codes.get(0);
                    Map postalCode = (Map) codeInfo.get("postal_code");
                    if (postalCode != null) {
                        String isServiceable = (String) postalCode.get("is_oda");
                        String codAvailable = (String) postalCode.get("cod");
                        boolean ok = "N".equalsIgnoreCase(isServiceable) || "Y".equalsIgnoreCase(isServiceable);
                        if (cod && "N".equalsIgnoreCase(codAvailable)) {
                            ok = false;
                        }
                        if (ok) {
                            return new ServiceabilityResult(true, "Delhivery Direct", BigDecimal.valueOf(80.00), 2, 4, "Serviceable via Delhivery Express");
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[DELHIVERY] Serviceability check error: {}", e.getMessage());
        }
        return new ServiceabilityResult(false, null, null, null, null, "Pincode is not serviceable via Delhivery");
    }

    @Override
    public List<RateOption> calculateRates(String pickupPincode, String deliveryPincode, double weightKg, BigDecimal declaredValue, boolean cod) {
        return List.of(
            new RateOption("DELHIVERY-SURFACE", "Delhivery Surface", BigDecimal.valueOf(60.00), BigDecimal.valueOf(60.00), 4, 6),
            new RateOption("DELHIVERY-EXPRESS", "Delhivery Express Air", BigDecimal.valueOf(110.00), BigDecimal.valueOf(110.00), 1, 3)
        );
    }

    @Override
    public ShipmentResult createShipment(ShipmentRequest req) {
        try {
            IvantaProperties.Delivery.Delhivery cfg = props.getDelivery().getDelhivery();
            String url = cfg.getApiBaseUrl() + "/api/cmu/create.json";

            Map<String, Object> shipmentData = new HashMap<>();
            shipmentData.put("name", req.deliveryAddress().name());
            shipmentData.put("add", req.deliveryAddress().addressLine1() + (req.deliveryAddress().addressLine2() == null ? "" : " " + req.deliveryAddress().addressLine2()));
            shipmentData.put("pin", req.deliveryAddress().pincode());
            shipmentData.put("city", req.deliveryAddress().city());
            shipmentData.put("state", req.deliveryAddress().state());
            shipmentData.put("country", "India");
            shipmentData.put("phone", req.deliveryAddress().phone());
            shipmentData.put("order", req.orderNumber());
            shipmentData.put("payment_mode", req.isCod() ? "COD" : "Prepaid");
            shipmentData.put("cod_amount", req.isCod() ? req.codAmount().toString() : "0");
            shipmentData.put("weight", String.valueOf((int) (req.weightKg() * 1000)));

            Map<String, Object> pickupLoc = new HashMap<>();
            pickupLoc.put("name", cfg.getPickupLocation());

            Map<String, Object> payload = new HashMap<>();
            payload.put("shipments", List.of(shipmentData));
            payload.put("pickup_location", pickupLoc);

            String requestBody = "format=json&data=" + new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payload);

            HttpHeaders headers = createAuthHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<String> httpReq = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> resp = restTemplate.postForEntity(url, httpReq, Map.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                Map body = resp.getBody();
                List<Map> packages = (List<Map>) body.get("packages");
                if (packages != null && !packages.isEmpty()) {
                    Map pkg = packages.get(0);
                    String waybill = (String) pkg.get("waybill");
                    String refnum = (String) pkg.get("refnum");
                    String labelUrl = cfg.getApiBaseUrl() + "/api/p/packing_slip?wbns=" + waybill;

                    return new ShipmentResult(
                        true,
                        refnum != null ? refnum : req.orderNumber(),
                        waybill,
                        waybill,
                        "Delhivery Logistics",
                        labelUrl,
                        "DLH-PKP-" + waybill,
                        Instant.now().plusSeconds(86400),
                        LocalDate.now().plusDays(3),
                        "Delhivery shipment created successfully"
                    );
                }
            }
        } catch (Exception e) {
            log.error("[DELHIVERY] Create shipment error: {}", e.getMessage(), e);
            throw new RuntimeException("Failed to create Delhivery shipment: " + e.getMessage(), e);
        }
        throw new RuntimeException("Failed to create Delhivery shipment: API returned invalid package format");
    }

    @Override
    public boolean cancelShipment(String providerOrderId, String awbNumber) {
        try {
            IvantaProperties.Delivery.Delhivery cfg = props.getDelivery().getDelhivery();
            String url = cfg.getApiBaseUrl() + "/api/p/edit";
            Map<String, Object> body = Map.of(
                "waybill", awbNumber,
                "cancellation", "true"
            );
            HttpEntity<Map<String, Object>> req = new HttpEntity<>(body, createAuthHeaders());
            ResponseEntity<Map> resp = restTemplate.postForEntity(url, req, Map.class);
            return resp.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            log.error("[DELHIVERY] Cancel shipment error: {}", e.getMessage());
            return false;
        }
    }

    @Override
    public TrackingResult fetchTracking(String providerOrderId, String awbNumber) {
        try {
            IvantaProperties.Delivery.Delhivery cfg = props.getDelivery().getDelhivery();
            String url = String.format("%s/api/v1/packages/json/?waybill=%s", cfg.getApiBaseUrl(), awbNumber);
            HttpEntity<Void> req = new HttpEntity<>(createAuthHeaders());
            ResponseEntity<Map> resp = restTemplate.exchange(url, HttpMethod.GET, req, Map.class);

            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                List<Map> shipmentDataList = (List<Map>) resp.getBody().get("ShipmentData");
                if (shipmentDataList != null && !shipmentDataList.isEmpty()) {
                    Map shipment = (Map) shipmentDataList.get(0);
                    Map shipmentObj = (Map) shipment.get("Shipment");
                    String status = (String) shipmentObj.get("Status");
                    List<Map> scans = (List<Map>) shipmentObj.get("Scans");

                    List<TrackingEventSpec> events = new ArrayList<>();
                    if (scans != null) {
                        for (Map scan : scans) {
                            Map detail = (Map) scan.get("ScanDetail");
                            if (detail != null) {
                                String instructions = (String) detail.get("Instructions");
                                String location = (String) detail.get("ScannedLocation");
                                events.add(new TrackingEventSpec(
                                    mapStatus(instructions),
                                    instructions,
                                    location,
                                    Instant.now()
                                ));
                            }
                        }
                    }
                    return new TrackingResult(
                        true,
                        mapStatus(status),
                        events.isEmpty() ? null : events.get(0).location(),
                        LocalDate.now().plusDays(2),
                        events,
                        resp.getBody().toString()
                    );
                }
            }
        } catch (Exception e) {
            log.error("[DELHIVERY] Fetch tracking error for AWB {}: {}", awbNumber, e.getMessage());
        }
        return new TrackingResult(false, "UNKNOWN", null, null, List.of(), null);
    }

    @Override
    public ReversePickupResult createReversePickup(ReversePickupRequest req) {
        try {
            IvantaProperties.Delivery.Delhivery cfg = props.getDelivery().getDelhivery();
            String url = cfg.getApiBaseUrl() + "/api/cmu/create.json";

            Map<String, Object> shipmentData = new HashMap<>();
            shipmentData.put("name", req.customerAddress().name());
            shipmentData.put("add", req.customerAddress().addressLine1());
            shipmentData.put("pin", req.customerAddress().pincode());
            shipmentData.put("city", req.customerAddress().city());
            shipmentData.put("state", req.customerAddress().state());
            shipmentData.put("phone", req.customerAddress().phone());
            shipmentData.put("order", "RET-" + req.returnId());
            shipmentData.put("pickup_location", cfg.getPickupLocation());
            shipmentData.put("is_return", "true");

            Map<String, Object> payload = Map.of("shipments", List.of(shipmentData));
            String requestBody = "format=json&data=" + new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payload);

            HttpHeaders headers = createAuthHeaders();
            headers.setContentType(MediaType.APPLICATION_FORM_URLENCODED);
            HttpEntity<String> httpReq = new HttpEntity<>(requestBody, headers);

            ResponseEntity<Map> resp = restTemplate.postForEntity(url, httpReq, Map.class);
            if (resp.getStatusCode().is2xxSuccessful() && resp.getBody() != null) {
                List<Map> packages = (List<Map>) resp.getBody().get("packages");
                if (packages != null && !packages.isEmpty()) {
                    String waybill = (String) packages.get(0).get("waybill");
                    return new ReversePickupResult(
                        true,
                        "DLH-RET-" + req.returnId(),
                        waybill,
                        "Delhivery Reverse Express",
                        LocalDate.now().plusDays(1).toString(),
                        "Reverse pickup created with Delhivery"
                    );
                }
            }
        } catch (Exception e) {
            log.error("[DELHIVERY] Create reverse pickup error: {}", e.getMessage());
        }
        return new ReversePickupResult(false, null, null, null, null, "Failed to schedule reverse pickup with Delhivery");
    }

    private String mapStatus(String raw) {
        if (raw == null) return "LABEL_CREATED";
        String s = raw.toUpperCase();
        if (s.contains("DELIVERED")) return "DELIVERED";
        if (s.contains("OUT FOR DELIVERY") || s.contains("DISPATCH")) return "OUT_FOR_DELIVERY";
        if (s.contains("TRANSIT") || s.contains("IN TRANSIT") || s.contains("MANIFEST")) return "IN_TRANSIT";
        if (s.contains("PICKED UP") || s.contains("PICKUP")) return "PICKED_UP";
        if (s.contains("RTO") || s.contains("RETURN")) return "RETURN_TO_ORIGIN";
        if (s.contains("CANCEL")) return "FAILED";
        return "IN_TRANSIT";
    }
}
