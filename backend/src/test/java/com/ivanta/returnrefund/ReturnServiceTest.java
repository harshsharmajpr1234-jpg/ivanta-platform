package com.ivanta.returnrefund;

import com.ivanta.audit.AuditService;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.util.IdService;
import com.ivanta.config.IvantaProperties;
import com.ivanta.delivery.ShipmentRepository;
import com.ivanta.dto.ReturnDtos.ReturnCreateRequest;
import com.ivanta.dto.ReturnDtos.ReturnStatusUpdate;
import com.ivanta.dto.ReturnDtos.ReturnView;
import com.ivanta.inventory.InventoryService;
import com.ivanta.notification.NotificationService;
import com.ivanta.order.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** §59: returns respect the window, one open return per order, state machine enforced. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ReturnServiceTest {

    @Mock ReturnRequestRepository returns;
    @Mock ReturnItemRepository returnItems;
    @Mock RefundRepository refunds;
    @Mock OrderRepository orders;
    @Mock OrderItemRepository orderItems;
    @Mock OrderStateMachine stateMachine;
    @Mock ShipmentRepository shipments;
    @Mock InventoryService inventory;
    @Mock RefundService refundService;
    @Mock NotificationService notifications;
    @Mock com.ivanta.product.ProductRepository products;
    @Mock IdService ids;
    @Mock AuditService audit;

    IvantaProperties props = new IvantaProperties();
    ReturnService service;

    @BeforeEach
    void setUp() {
        service = new ReturnService(returns, returnItems, refunds, orders, orderItems,
                stateMachine, shipments, inventory, refundService, notifications, products,
                props, ids, audit);
        when(ids.next(anyString(), anyString(), anyInt())).thenReturn("RET-1");
        when(returns.save(any(ReturnRequest.class))).thenAnswer(i -> i.getArgument(0));
        when(returnItems.save(any(ReturnItem.class))).thenAnswer(i -> i.getArgument(0));
        when(stateMachine.apply(any(), anyString(), anyString(), any(), any())).thenAnswer(i -> i.getArgument(0));
    }

    private Order deliveredOrder(Instant placedAt) {
        Order o = new Order();
        o.setId("ORD-1");
        o.setUserId("U1");
        o.setStatus("DELIVERED");
        o.setPlacedAt(placedAt);
        o.setGrandTotal(new BigDecimal("95000.00"));
        return o;
    }

    private OrderItem item() {
        OrderItem oi = new OrderItem();
        oi.setId("OIT-1");
        oi.setOrderId("ORD-1");
        oi.setProductId("P1");
        oi.setProductName("iPhone 17");
        oi.setQuantity(1);
        oi.setFinalPrice(new BigDecimal("95000.00"));
        return oi;
    }

    @Test
    void rejectsReturnOnUndeliveredOrder() {
        Order o = deliveredOrder(Instant.now());
        o.setStatus("PLACED");
        when(orders.findByIdAndUserId("ORD-1", "U1")).thenReturn(Optional.of(o));
        assertThatThrownBy(() -> service.request("U1", new ReturnCreateRequest("ORD-1", "defect", null, null)))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.RETURN_NOT_ALLOWED);
    }

    @Test
    void rejectsReturnOutsideWindow() {
        Order o = deliveredOrder(Instant.now().minus(30, ChronoUnit.DAYS));
        when(orders.findByIdAndUserId("ORD-1", "U1")).thenReturn(Optional.of(o));
        when(shipments.findFirstByOrderIdOrderByIdDesc("ORD-1")).thenReturn(Optional.empty());
        assertThatThrownBy(() -> service.request("U1", new ReturnCreateRequest("ORD-1", "defect", null, null)))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.RETURN_NOT_ALLOWED);
    }

    @Test
    void rejectsSecondOpenReturnForSameOrder() {
        Order o = deliveredOrder(Instant.now().minus(1, ChronoUnit.DAYS));
        when(orders.findByIdAndUserId("ORD-1", "U1")).thenReturn(Optional.of(o));
        when(shipments.findFirstByOrderIdOrderByIdDesc("ORD-1")).thenReturn(Optional.empty());
        ReturnRequest open = new ReturnRequest();
        open.setId("RET-0");
        open.setStatus("INSPECTION");
        when(returns.findByOrderId("ORD-1")).thenReturn(List.of(open));
        assertThatThrownBy(() -> service.request("U1", new ReturnCreateRequest("ORD-1", "defect", null, null)))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.CONFLICT);
    }

    @Test
    void createsReturnAndMovesOrderToReturnRequested() {
        Order o = deliveredOrder(Instant.now().minus(1, ChronoUnit.DAYS));
        when(orders.findByIdAndUserId("ORD-1", "U1")).thenReturn(Optional.of(o));
        when(shipments.findFirstByOrderIdOrderByIdDesc("ORD-1")).thenReturn(Optional.empty());
        when(returns.findByOrderId("ORD-1")).thenReturn(List.of());
        when(orderItems.findByOrderId("ORD-1")).thenReturn(List.of(item()));
        when(refunds.findByOrderId("ORD-1")).thenReturn(List.of());
        ReturnItem created = new ReturnItem();
        created.setId("RIT-1");
        created.setReturnId("RET-1");
        created.setOrderItemId("OIT-1");
        created.setQuantity(1);
        when(returnItems.findByReturnId("RET-1")).thenReturn(List.of(created));

        ReturnView view = service.request("U1", new ReturnCreateRequest("ORD-1", "screen defect", null, null));

        assertThat(view.status()).isEqualTo("REQUESTED");
        assertThat(view.items()).hasSize(1);
        verify(stateMachine).apply(o, "RETURN_REQUESTED", "CUSTOMER", "U1", "screen defect");
    }

    @Test
    void rejectsIllegalReturnTransition() {
        ReturnRequest r = new ReturnRequest();
        r.setId("RET-1");
        r.setOrderId("ORD-1");
        r.setUserId("U1");
        r.setStatus("REQUESTED");
        r.setRequestedAt(Instant.now());
        when(returns.findById("RET-1")).thenReturn(Optional.of(r));
        assertThatThrownBy(() -> service.updateStatus("RET-1", new ReturnStatusUpdate("REFUNDED", null), "ADM-1"))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.INVALID_STATE);
    }

    @Test
    void receivedRestocksInventory() {
        ReturnRequest r = new ReturnRequest();
        r.setId("RET-1");
        r.setOrderId("ORD-1");
        r.setUserId("U1");
        r.setStatus("PICKUP_SCHEDULED");
        r.setRequestedAt(Instant.now());
        when(returns.findById("RET-1")).thenReturn(Optional.of(r));
        when(orders.findById("ORD-1")).thenReturn(Optional.of(deliveredOrder(Instant.now())));
        ReturnItem ri = new ReturnItem();
        ri.setId("RIT-1");
        ri.setReturnId("RET-1");
        ri.setOrderItemId("OIT-1");
        ri.setQuantity(1);
        when(returnItems.findByReturnId("RET-1")).thenReturn(List.of(ri));
        when(orderItems.findById("OIT-1")).thenReturn(Optional.of(item()));
        when(refunds.findByOrderId("ORD-1")).thenReturn(List.of());

        service.updateStatus("RET-1", new ReturnStatusUpdate("RECEIVED", null), "ADM-1");

        verify(inventory).receiveReturn(eq("ORD-1"), isNull(), eq("P1"), eq(1), contains("Return RET-1"));
    }
}
