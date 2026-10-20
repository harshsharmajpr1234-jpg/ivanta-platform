package com.ivanta.delivery;

import com.ivanta.audit.AuditService;
import com.ivanta.common.util.IdService;
import com.ivanta.dto.DeliveryDtos.EventRequest;
import com.ivanta.dto.DeliveryDtos.ShipmentView;
import com.ivanta.notification.NotificationService;
import com.ivanta.order.Order;
import com.ivanta.order.OrderRepository;
import com.ivanta.order.OrderStateMachine;
import com.ivanta.replacement.ReplacementRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InOrder;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.transaction.annotation.Transactional;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * Regression tests for the tracking-event pipeline (§10/§14/§32).
 *
 * History: inserting the PATCH /admin/orders/{id}/tracking alias accidentally moved
 * @Transactional off addEvent — the DELIVERED auto-advance chain then committed each hop
 * separately and the second orders.save() hit StaleObjectStateException (@Version), leaving
 * orders stranded at IN_TRANSIT/OUT_FOR_DELIVERY with a 500. These tests pin the annotation
 * and the full multi-hop chain behaviour.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DeliveryServiceEventTest {

    @Mock ShipmentRepository shipments;
    @Mock ShipmentTrackingEventRepository events;
    @Mock DeliveryAddressRepository addresses;
    @Mock ShippingMethodRepository methods;
    @Mock OrderRepository orders;
    @Mock com.ivanta.order.OrderItemRepository orderItems;
    @Mock OrderStateMachine stateMachine;
    @Mock ReplacementRepository replacements;
    @Mock NotificationService notifications;
    @Mock IdService ids;
    @Mock AuditService audit;
    @Mock com.ivanta.admin.SystemSettingRepository systemSettings;
    @Mock com.ivanta.delivery.provider.CourierProviderFactory courierFactory;
    @Mock com.ivanta.config.IvantaProperties props;

    DeliveryService service;

    @BeforeEach
    void setUp() {
        service = new DeliveryService(shipments, events, addresses, methods, orders,
                orderItems, stateMachine, replacements, notifications, ids, audit,
                systemSettings, courierFactory, props);
        // mirror the real state machine: apply() advances the in-memory status
        when(stateMachine.apply(any(Order.class), anyString(), anyString(), any(), any()))
                .thenAnswer(inv -> {
                    Order o = inv.getArgument(0);
                    o.setStatus(inv.getArgument(1));
                    return o;
                });
    }

    @Test
    void eventEntryPointsAreTransactional() {
        for (String name : new String[]{"addEvent", "addEventForOrder", "shipOrder"}) {
            Method m = Arrays.stream(DeliveryService.class.getMethods())
                    .filter(x -> x.getName().equals(name))
                    .findFirst().orElseThrow(() -> new AssertionError(name + " missing"));
            assertNotNull(m.getAnnotation(Transactional.class),
                    name + " must be @Transactional so multi-hop status chains commit atomically");
        }
    }

    @Test
    void deliveredEventFromShippedAutoAdvancesWholeChain() {
        Order order = new Order();
        order.setId("ORD-2026-000099");
        order.setOrderNumber("IVN-20261003-000099");
        order.setUserId("USR-0001");
        order.setStatus("SHIPPED");

        Shipment s = new Shipment();
        s.setId("SHP-000099");
        s.setOrderId(order.getId());
        s.setStatus("LABEL_CREATED");

        when(shipments.findById("SHP-000099")).thenReturn(Optional.of(s));
        when(orders.findById("ORD-2026-000099")).thenReturn(Optional.of(order));

        ShipmentView view = service.addEvent("SHP-000099",
                new EventRequest("DELIVERED", "done", "Jaipur"), "ADM-0001");

        InOrder chain = inOrder(stateMachine);
        chain.verify(stateMachine).apply(order, "IN_TRANSIT", "SYSTEM", null, "Auto-advanced on delivery");
        chain.verify(stateMachine).apply(order, "OUT_FOR_DELIVERY", "SYSTEM", null, "Auto-advanced on delivery");
        chain.verify(stateMachine).apply(order, "DELIVERED", "ADMIN", "ADM-0001", "Delivered");

        assertEquals("DELIVERED", order.getStatus());
        assertEquals("DELIVERED", s.getStatus());
        assertNotNull(s.getDeliveredAt());
        assertEquals("DELIVERED", view.status());
        verify(notifications).notifyUser(eq("USR-0001"), eq("ORDER_DELIVERED"), anyMap(),
                eq("shipment"), eq("SHP-000099"));
        verify(shipments).save(s);
    }

    @Test
    void deliveredEventFromInTransitAdvancesRemainingLegs() {
        Order order = new Order();
        order.setId("ORD-2026-000098");
        order.setOrderNumber("IVN-20261003-000098");
        order.setUserId("USR-0001");
        order.setStatus("IN_TRANSIT");

        Shipment s = new Shipment();
        s.setId("SHP-000098");
        s.setOrderId(order.getId());
        s.setStatus("IN_TRANSIT");

        when(shipments.findById("SHP-000098")).thenReturn(Optional.of(s));
        when(orders.findById("ORD-2026-000098")).thenReturn(Optional.of(order));

        service.addEvent("SHP-000098", new EventRequest("DELIVERED", "done", null), "ADM-0001");

        InOrder chain = inOrder(stateMachine);
        chain.verify(stateMachine, never()).apply(order, "IN_TRANSIT", "SYSTEM", null, "Auto-advanced on delivery");
        chain.verify(stateMachine).apply(order, "OUT_FOR_DELIVERY", "SYSTEM", null, "Auto-advanced on delivery");
        chain.verify(stateMachine).apply(order, "DELIVERED", "ADMIN", "ADM-0001", "Delivered");
        assertEquals("DELIVERED", order.getStatus());
    }
}
