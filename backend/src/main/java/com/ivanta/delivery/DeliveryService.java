package com.ivanta.delivery;

import com.ivanta.admin.SystemSetting;
import com.ivanta.admin.SystemSettingRepository;
import com.ivanta.audit.AuditService;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.exception.ResourceNotFoundException;
import com.ivanta.common.util.IdService;
import com.ivanta.config.IvantaProperties;
import com.ivanta.delivery.provider.CourierProvider;
import com.ivanta.delivery.provider.CourierProviderFactory;
import com.ivanta.dto.DeliveryDtos.*;
import com.ivanta.notification.NotificationService;
import com.ivanta.order.Order;
import com.ivanta.order.OrderItem;
import com.ivanta.order.OrderItemRepository;
import com.ivanta.order.OrderRepository;
import com.ivanta.order.OrderStateMachine;
import com.ivanta.replacement.Replacement;
import com.ivanta.replacement.ReplacementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.LocalDate;
import java.util.*;

/**
 * Delivery (§29/§41): Owner-owned inventory + 3rd-party logistics fulfillment.
 * Shipments are created from PACKED orders via CourierProvider (Shiprocket / Delhivery / Mock).
 * Status transitions come from verified courier webhooks or scheduled API tracking sync.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DeliveryService {

    private static final Set<String> SHIPMENT_STATUSES = Set.of("LABEL_CREATED", "PICKED_UP", "IN_TRANSIT",
            "OUT_FOR_DELIVERY", "DELIVERED", "FAILED", "RETURN_TO_ORIGIN");
    private static final SecureRandom RANDOM = new SecureRandom();

    private final ShipmentRepository shipments;
    private final ShipmentTrackingEventRepository events;
    private final DeliveryAddressRepository addresses;
    private final ShippingMethodRepository methods;
    private final OrderRepository orders;
    private final OrderItemRepository orderItems;
    private final OrderStateMachine stateMachine;
    private final ReplacementRepository replacements;
    private final NotificationService notifications;
    private final IdService ids;
    private final AuditService audit;
    private final SystemSettingRepository systemSettings;
    private final CourierProviderFactory courierFactory;
    private final IvantaProperties props;

    @Transactional
    public ShipmentView shipOrder(String orderId, ShipRequest req, String adminId) {
        Order order = orders.findById(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("Order " + orderId));
        if (!"PACKED".equals(order.getStatus()) && !"PROCESSING".equals(order.getStatus()) && !"CONFIRMED".equals(order.getStatus())) {
            throw new BusinessException(ErrorCode.INVALID_STATE,
                    "Order cannot be shipped in current state: " + order.getStatus());
        }

        DeliveryAddress addr = addresses.findByOrderId(orderId)
                .orElseThrow(() -> new BusinessException(ErrorCode.INVALID_STATE, "Order has no delivery address"));
        ShippingMethod method = order.getShippingMethodId() == null ? null
                : methods.findById(order.getShippingMethodId()).orElse(null);

        List<OrderItem> items = orderItems.findByOrderId(orderId);
        double weightKg = (req != null && req.weightKg() != null && req.weightKg() > 0) ? req.weightKg() : 0.500;

        CourierProvider.AddressSpec destAddress = new CourierProvider.AddressSpec(
            addr.getName(), addr.getPhone(), null,
            addr.getAddressLine1(), addr.getAddressLine2(),
            addr.getCity(), addr.getState(), addr.getPincode()
        );

        WarehouseSettingsView wh = getWarehouseSettings();
        CourierProvider.AddressSpec origAddress = new CourierProvider.AddressSpec(
            wh.contactName(), wh.phone(), wh.email(),
            wh.addressLine1(), wh.addressLine2(),
            wh.city(), wh.state(), wh.pincode()
        );

        List<CourierProvider.OrderItemSpec> courierItems = items.stream().map(i -> new CourierProvider.OrderItemSpec(
            i.getSku() != null ? i.getSku() : i.getProductId(),
            i.getProductName(),
            i.getQuantity(),
            i.getUnitPrice(),
            i.getTaxRate()
        )).toList();

        boolean isCod = "COD".equalsIgnoreCase(order.getPaymentMethod());

        CourierProvider.ShipmentRequest shipmentReq = new CourierProvider.ShipmentRequest(
            order.getId(),
            displayNumber(order),
            destAddress,
            origAddress,
            courierItems,
            order.getGrandTotal(),
            weightKg,
            isCod,
            isCod ? order.getGrandTotal() : BigDecimal.ZERO
        );

        CourierProvider activeProvider = courierFactory.getActiveProvider();
        log.info("[DELIVERY SERVICE] Dispatching order {} via courier provider '{}'", order.getId(), activeProvider.getName());

        CourierProvider.ShipmentResult res = activeProvider.createShipment(shipmentReq);

        Shipment s = new Shipment();
        s.setId(ids.next("shipments", "SHP", 5));
        s.setOrderId(orderId);
        s.setShippingMethodId(method != null ? method.getId() : methods.findByIsActiveTrueOrderBySortOrderAsc().get(0).getId());
        s.setAddressId(addr.getId());
        s.setCarrier(req != null && req.carrier() != null ? req.carrier() : res.carrierName() != null ? res.carrierName() : "iVanta Logistics");
        s.setTrackingNumber(req != null && req.trackingNumber() != null && !req.trackingNumber().isBlank()
                ? req.trackingNumber().trim()
                : res.awbNumber() != null ? res.awbNumber() : "IVN" + (1_000_000_000L + RANDOM.nextLong(8_999_999_999L)));
        s.setStatus("LABEL_CREATED");
        s.setShippedAt(Instant.now());
        s.setEstimatedDelivery(res.estimatedDelivery() != null ? res.estimatedDelivery()
                : LocalDate.now().plusDays(method == null ? 3 : method.getEtaMaxDays()));

        s.setProviderShipmentId(res.providerShipmentId());
        s.setLabelUrl(res.labelUrl());
        s.setPickupToken(res.pickupToken());
        s.setPickupScheduledAt(res.pickupScheduledAt());
        s.setWeightKg(weightKg);

        shipments.save(s);
        appendEvent(s.getId(), "LABEL_CREATED", "Shipping label created via " + activeProvider.getName(), null);

        stateMachine.apply(order, "SHIPPED", "ADMIN", adminId, "Shipment " + s.getId() + " created via " + activeProvider.getName());
        audit.record("SHIPMENT_CREATED", "shipment", s.getId(), null,
                "order=" + orderId + " tracking=" + s.getTrackingNumber() + " provider=" + activeProvider.getName());
        notifications.notifyUser(order.getUserId(), "ORDER_SHIPPED",
                Map.of("orderNumber", displayNumber(order)), "shipment", s.getId());
        syncReplacement(orderId, "SHIPPED");
        return toView(s);
    }

    /** Auto-ships order if autoShipOnPacked property is enabled. */
    @Transactional
    public void autoShipIfPacked(String orderId) {
        if (props.getDelivery().isAutoShipOnPacked()) {
            try {
                shipOrder(orderId, null, "SYSTEM");
            } catch (Exception e) {
                log.warn("[AUTO SHIP] Failed to auto-ship packed order {}: {}", orderId, e.getMessage());
            }
        }
    }

    /** PATCH /admin/orders/{id}/tracking alias — appends an event to the order's latest shipment (§31). */
    @Transactional
    public ShipmentView addEventForOrder(String orderId, EventRequest req, String adminId) {
        Shipment s = shipments.findFirstByOrderIdOrderByIdDesc(orderId)
                .orElseThrow(() -> new ResourceNotFoundException("No shipment for order " + orderId));
        return addEvent(s.getId(), req, adminId);
    }

    @Transactional
    public ShipmentView addEvent(String shipmentId, EventRequest req, String adminId) {
        Shipment s = shipments.findById(shipmentId)
                .orElseThrow(() -> new ResourceNotFoundException("Shipment " + shipmentId));
        String status = req.status().toUpperCase();
        if (!SHIPMENT_STATUSES.contains(status))
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Unknown shipment status " + status);
        appendEvent(shipmentId, status, req.description(), req.location());
        s.setStatus(status);
        Order order = orders.findById(s.getOrderId()).orElseThrow();

        switch (status) {
            case "IN_TRANSIT" -> {
                if ("SHIPPED".equals(order.getStatus())) {
                    stateMachine.apply(order, "IN_TRANSIT", "ADMIN", adminId, "Package in transit");
                    notifications.notifyUser(order.getUserId(), "ORDER_IN_TRANSIT",
                            Map.of("orderNumber", displayNumber(order),
                                    "location", req.location() == null ? "" : " near " + req.location()),
                            "shipment", s.getId());
                }
            }
            case "OUT_FOR_DELIVERY" -> {
                if (Set.of("SHIPPED", "IN_TRANSIT").contains(order.getStatus())) {
                    stateMachine.apply(order, "OUT_FOR_DELIVERY", "ADMIN", adminId, "Out for delivery");
                    notifications.notifyUser(order.getUserId(), "OUT_FOR_DELIVERY",
                            Map.of("orderNumber", displayNumber(order)), "shipment", s.getId());
                }
            }
            case "DELIVERED" -> {
                s.setDeliveredAt(Instant.now());
                if (Set.of("SHIPPED", "IN_TRANSIT", "OUT_FOR_DELIVERY").contains(order.getStatus())) {
                    // auto-advance any skipped legs so the ledger stays a valid path
                    if ("SHIPPED".equals(order.getStatus()))
                        stateMachine.apply(order, "IN_TRANSIT", "SYSTEM", null, "Auto-advanced on delivery");
                    if ("IN_TRANSIT".equals(order.getStatus()))
                        stateMachine.apply(order, "OUT_FOR_DELIVERY", "SYSTEM", null, "Auto-advanced on delivery");
                    stateMachine.apply(order, "DELIVERED", "ADMIN", adminId, "Delivered");
                    notifications.notifyUser(order.getUserId(), "ORDER_DELIVERED",
                            Map.of("orderNumber", displayNumber(order)), "shipment", s.getId());
                    syncReplacement(order.getId(), "DELIVERED");
                }
            }
            case "FAILED", "RETURN_TO_ORIGIN" ->
                audit.record("SHIPMENT_EVENT", "shipment", s.getId(), null, status + " " + req.description());
            default -> { }
        }
        if (adminId != null && !adminId.startsWith("WEBHOOK:") && !"SYSTEM".equals(adminId) && !"SCHEDULER".equals(adminId)) {
            audit.record("MANUAL_SHIPMENT_OVERRIDE", "shipment", s.getId(), adminId, status + " " + (req.description() == null ? "" : req.description()));
        }
        shipments.save(s);
        return toView(s);
    }

    @Transactional(readOnly = true)
    public TrackingView trackingForUser(String userId, String orderId) {
        Order order = orders.findByIdAndUserId(orderId, userId)
                .orElseThrow(() -> new ResourceNotFoundException("Order " + orderId));
        Shipment s = shipments.findFirstByOrderIdOrderByIdDesc(orderId).orElse(null);
        return new TrackingView(orderId, order.getStatus(), s == null ? null : toView(s));
    }

    @Transactional(readOnly = true)
    public Page<Shipment> adminShipments(String status, String orderId, int page, int size) {
        if (orderId != null && !orderId.isBlank()) {
            List<Shipment> all = shipments.findByOrderId(orderId).stream()
                    .filter(sh -> status == null || status.isBlank() || status.equals(sh.getStatus()))
                    .toList();
            return new org.springframework.data.domain.PageImpl<>(all,
                    org.springframework.data.domain.PageRequest.of(0, Math.max(all.size(), 1)), all.size());
        }
        PageRequest pr = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100));
        return (status == null || status.isBlank())
                ? shipments.findAllByOrderByCreatedAtDesc(pr)
                : shipments.findByStatusOrderByCreatedAtDesc(status, pr);
    }

    public ShipmentView toView(Shipment s) {
        List<TrackingEventView> evs = events.findByShipmentIdOrderByIdAsc(s.getId()).stream()
                .map(e -> new TrackingEventView(e.getStatus(), e.getDescription(), e.getLocation(),
                        e.getEventAt().toString()))
                .toList();
        return new ShipmentView(s.getId(), s.getOrderId(), s.getTrackingNumber(), s.getCarrier(),
                s.getStatus(),
                s.getEstimatedDelivery() == null ? null : s.getEstimatedDelivery().toString(),
                s.getShippedAt() == null ? null : s.getShippedAt().toString(),
                s.getDeliveredAt() == null ? null : s.getDeliveredAt().toString(),
                s.getProviderShipmentId(),
                s.getLabelUrl(),
                s.getPickupToken(),
                s.getWeightKg(),
                evs);
    }

    private void appendEvent(String shipmentId, String status, String description, String location) {
        ShipmentTrackingEvent e = new ShipmentTrackingEvent();
        e.setShipmentId(shipmentId);
        e.setStatus(status);
        e.setDescription(description);
        e.setLocation(location);
        events.save(e);
    }

    private static String displayNumber(Order o) {
        return o.getOrderNumber() != null ? o.getOrderNumber() : o.getId();
    }

    private void syncReplacement(String replacementOrderId, String event) {
        Optional<Replacement> maybe = replacements.findByReplacementOrderId(replacementOrderId);
        if (maybe.isEmpty()) return;
        Replacement repl = maybe.get();
        Order original = orders.findById(repl.getOrderId()).orElse(null);
        if (original == null) return;
        String dn = displayNumber(original);
        if ("SHIPPED".equals(event) && Set.of("APPROVED", "PROCESSING").contains(repl.getStatus())) {
            repl.setStatus("SHIPPED");
            replacements.save(repl);
            if ("REPLACEMENT_PROCESSING".equals(original.getStatus())) {
                stateMachine.apply(original, "REPLACEMENT_SHIPPED", "SYSTEM", null, "Replacement order shipped");
                notifications.notifyUser(original.getUserId(), "REPLACEMENT_SHIPPED",
                        Map.of("orderNumber", dn), "order", original.getId());
            }
            audit.record("REPLACEMENT_SHIPPED", "replacement", repl.getId(), null,
                    "replacementOrder=" + replacementOrderId);
        } else if ("DELIVERED".equals(event) && Set.of("APPROVED", "PROCESSING", "SHIPPED").contains(repl.getStatus())) {
            repl.setStatus("DELIVERED");
            repl.setResolvedAt(Instant.now());
            replacements.save(repl);
            if ("REPLACEMENT_PROCESSING".equals(original.getStatus()))
                stateMachine.apply(original, "REPLACEMENT_SHIPPED", "SYSTEM", null,
                        "Auto-advanced on replacement delivery");
            if ("REPLACEMENT_SHIPPED".equals(original.getStatus())) {
                stateMachine.apply(original, "REPLACEMENT_DELIVERED", "SYSTEM", null, "Replacement delivered");
                notifications.notifyUser(original.getUserId(), "REPLACEMENT_DELIVERED",
                        Map.of("orderNumber", dn), "order", original.getId());
            }
            audit.record("REPLACEMENT_DELIVERED", "replacement", repl.getId(), null,
                    "replacementOrder=" + replacementOrderId);
        }
    }

    /* ---------- Warehouse & System Settings ---------- */

    @Transactional(readOnly = true)
    public WarehouseSettingsView getWarehouseSettings() {
        Map<String, String> map = new HashMap<>();
        systemSettings.findAll().forEach(s -> map.put(s.getSettingKey(), s.getSettingValue()));
        return new WarehouseSettingsView(
            map.getOrDefault("warehouse.name", "iVanta Main Fulfilment Centre"),
            map.getOrDefault("warehouse.contact_name", "iVanta Logistics Manager"),
            map.getOrDefault("warehouse.phone", "919876543210"),
            map.getOrDefault("warehouse.email", "logistics@ivanta.in"),
            map.getOrDefault("warehouse.address_line1", "iVanta House, Plot 42"),
            map.getOrDefault("warehouse.address_line2", "Malviya Nagar Industrial Area"),
            map.getOrDefault("warehouse.city", "Jaipur"),
            map.getOrDefault("warehouse.state", "Rajasthan"),
            map.getOrDefault("warehouse.pincode", "302017"),
            map.getOrDefault("warehouse.operating_hours", "09:00 AM - 06:00 PM (Mon-Sat)"),
            map.getOrDefault("seller.gstin", "08ABCDE1234F1Z5")
        );
    }

    @Transactional
    public WarehouseSettingsView updateWarehouseSettings(WarehouseSettingsUpsert req, String adminId) {
        saveSetting("warehouse.name", req.name(), "WAREHOUSE", "Fulfilment centre facility name", adminId);
        saveSetting("warehouse.contact_name", req.contactName(), "WAREHOUSE", "Pickup contact person name", adminId);
        saveSetting("warehouse.phone", req.phone(), "WAREHOUSE", "Pickup contact phone number", adminId);
        saveSetting("warehouse.email", req.email(), "WAREHOUSE", "Pickup contact email", adminId);
        saveSetting("warehouse.address_line1", req.addressLine1(), "WAREHOUSE", "Pickup street address line 1", adminId);
        saveSetting("warehouse.address_line2", req.addressLine2() == null ? "" : req.addressLine2(), "WAREHOUSE", "Pickup street address line 2", adminId);
        saveSetting("warehouse.city", req.city(), "WAREHOUSE", "Warehouse city", adminId);
        saveSetting("warehouse.state", req.state(), "WAREHOUSE", "Warehouse state", adminId);
        saveSetting("warehouse.pincode", req.pincode(), "WAREHOUSE", "Warehouse 6-digit PIN code", adminId);
        saveSetting("warehouse.operating_hours", req.operatingHours() == null ? "09:00 AM - 06:00 PM (Mon-Sat)" : req.operatingHours(), "WAREHOUSE", "Warehouse pickup operating hours", adminId);
        saveSetting("seller.gstin", req.sellerGstin(), "WAREHOUSE", "Seller GSTIN for tax invoice and shipping manifests", adminId);

        audit.record("SETTINGS_UPDATED", "warehouse", "primary", null, "Updated warehouse pickup address, operating hours, and seller GSTIN");
        return getWarehouseSettings();
    }

    private void saveSetting(String key, String value, String category, String description, String adminId) {
        SystemSetting s = systemSettings.findById(key).orElseGet(() -> {
            SystemSetting ns = new SystemSetting();
            ns.setSettingKey(key);
            return ns;
        });
        s.setSettingValue(value);
        s.setCategory(category);
        s.setDescription(description);
        s.setUpdatedBy(adminId);
        systemSettings.save(s);
    }

    @Transactional(readOnly = true)
    public CourierProviderStatusView getProviderStatus() {
        IvantaProperties.Delivery d = props.getDelivery();
        boolean srOk = !d.getShiprocket().getEmail().isBlank() && !d.getShiprocket().getPassword().isBlank();
        boolean dlhOk = !d.getDelhivery().getApiToken().isBlank();
        return new CourierProviderStatusView(d.getProvider(), d.isAutoShipOnPacked(), srOk, dlhOk);
    }

    /* ---------- Shipping Methods ---------- */

    @Transactional(readOnly = true)
    public List<ShippingMethod> listMethods() {
        return methods.findByIsActiveTrueOrderBySortOrderAsc();
    }

    @Transactional
    public ShippingMethod upsertMethod(String id, ShippingMethodUpsert req) {
        ShippingMethod m = (id == null)
                ? new ShippingMethod()
                : methods.findById(id).orElseThrow(() -> new ResourceNotFoundException("Shipping method " + id));
        if (id == null) m.setId(ids.next("shipping_methods", "SM", 4));
        m.setName(req.name());
        if (req.carrier() != null) m.setCarrier(req.carrier());
        if (req.baseFee() != null) m.setBaseFee(req.baseFee());
        m.setFreeAbove(req.freeAbove());
        if (req.etaMinDays() != null) m.setEtaMinDays(req.etaMinDays().shortValue());
        if (req.etaMaxDays() != null) m.setEtaMaxDays(req.etaMaxDays().shortValue());
        if (req.isActive() != null) m.setIsActive(req.isActive());
        methods.save(m);
        audit.record("SETTINGS_UPDATED", "shipping_method", m.getId(), null, m.getName());
        return m;
    }
}
