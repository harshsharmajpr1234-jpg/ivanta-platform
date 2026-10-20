package com.ivanta.inventory;

import com.ivanta.audit.AuditService;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.util.IdService;
import com.ivanta.product.ProductRepository;
import com.ivanta.product.ProductVariantRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** §59: checkout cannot oversell; expired reservations are released. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class InventoryServiceTest {

    @Mock InventoryItemRepository items;
    @Mock InventoryMovementRepository movements;
    @Mock StockReservationRepository reservations;
    @Mock WarehouseRepository warehouses;
    @Mock ProductRepository products;
    @Mock ProductVariantRepository variants;
    @Mock IdService ids;
    @Mock AuditService audit;

    InventoryService service;

    @BeforeEach
    void setUp() {
        service = new InventoryService(items, movements, reservations, warehouses,
                products, variants, ids, audit);
        when(ids.next(anyString(), anyString(), anyInt())).thenReturn("X-1");
        when(items.save(any(InventoryItem.class))).thenAnswer(i -> i.getArgument(0));
        when(reservations.save(any(StockReservation.class))).thenAnswer(i -> i.getArgument(0));
    }

    private InventoryItem item(String id, int qty, int reserved, int reorder) {
        InventoryItem i = new InventoryItem();
        i.setId(id);
        i.setProductId("P1");
        i.setVariantId("V1");
        i.setWarehouseId("WH-1");
        i.setSku("SKU-1");
        i.setQuantity(qty);
        i.setReservedQuantity(reserved);
        i.setReorderLevel(reorder);
        i.setStatus(qty == 0 ? "OUT_OF_STOCK" : qty <= reorder ? "LOW_STOCK" : "IN_STOCK");
        return i;
    }

    @Test
    void reservationFailsWhenStockInsufficient() {
        when(items.findByVariantId("V1")).thenReturn(List.of(item("INV-1", 3, 0, 5)));
        assertThatThrownBy(() -> service.reserveForOrder("ORD-1",
                List.of(new InventoryService.ReserveLine("P1", "V1", 5, "iPhone 17")), 15))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.OUT_OF_STOCK);
        verify(reservations, never()).save(any());
    }

    @Test
    void reservationSplitsAcrossWarehouses() {
        InventoryItem a = item("INV-1", 4, 0, 5);
        InventoryItem b = item("INV-2", 6, 0, 5);
        b.setWarehouseId("WH-2");
        when(items.findByVariantId("V1")).thenReturn(List.of(a, b));

        service.reserveForOrder("ORD-1",
                List.of(new InventoryService.ReserveLine("P1", "V1", 7, "iPhone 17")), 15);

        // sorted by availability desc: b(6) takes 6, a(4) takes 1
        assertThat(b.getReservedQuantity()).isEqualTo(6);
        assertThat(a.getReservedQuantity()).isEqualTo(1);
        verify(reservations, times(2)).save(any(StockReservation.class));
        verify(movements, times(2)).save(any(InventoryMovement.class));
    }

    @Test
    void consumeTurnsReservationIntoSale() {
        InventoryItem i = item("INV-1", 10, 2, 5);
        StockReservation r = new StockReservation();
        r.setId("RSV-1");
        r.setOrderId("ORD-1");
        r.setInventoryId("INV-1");
        r.setQuantity(2);
        r.setStatus(StockReservation.Status.RESERVED);
        when(reservations.findByOrderIdAndStatus("ORD-1", StockReservation.Status.RESERVED)).thenReturn(List.of(r));
        when(items.findById("INV-1")).thenReturn(Optional.of(i));

        service.consumeForOrder("ORD-1");

        assertThat(i.getQuantity()).isEqualTo(8);
        assertThat(i.getReservedQuantity()).isZero();
        assertThat(r.getStatus()).isEqualTo(StockReservation.Status.CONSUMED);
    }

    @Test
    void releaseGivesStockBack() {
        InventoryItem i = item("INV-1", 10, 2, 5);
        StockReservation r = new StockReservation();
        r.setId("RSV-1");
        r.setOrderId("ORD-1");
        r.setInventoryId("INV-1");
        r.setQuantity(2);
        r.setStatus(StockReservation.Status.RESERVED);
        when(reservations.findByOrderIdAndStatus("ORD-1", StockReservation.Status.RESERVED)).thenReturn(List.of(r));
        when(items.findById("INV-1")).thenReturn(Optional.of(i));

        service.releaseForOrder("ORD-1", false);

        assertThat(i.getQuantity()).isEqualTo(10);          // untouched
        assertThat(i.getReservedQuantity()).isZero();       // hold removed
        assertThat(r.getStatus()).isEqualTo(StockReservation.Status.RELEASED);
    }

    @Test
    void expirySweepReleasesAndReturnsAffectedOrders() {
        InventoryItem i = item("INV-1", 10, 3, 5);
        StockReservation r = new StockReservation();
        r.setId("RSV-1");
        r.setOrderId("ORD-9");
        r.setInventoryId("INV-1");
        r.setQuantity(3);
        r.setStatus(StockReservation.Status.RESERVED);
        r.setExpiresAt(Instant.now().minusSeconds(60));
        when(reservations.findByStatusAndExpiresAtBefore(eq(StockReservation.Status.RESERVED), any()))
                .thenReturn(List.of(r));
        when(items.findById("INV-1")).thenReturn(Optional.of(i));

        Set<String> affected = service.expireDueReservations();

        assertThat(affected).containsExactly("ORD-9");
        assertThat(r.getStatus()).isEqualTo(StockReservation.Status.EXPIRED);
        assertThat(i.getReservedQuantity()).isZero();
    }

    @Test
    void adjustCannotDropBelowReserved() {
        InventoryItem i = item("INV-1", 10, 8, 5);
        when(items.findById("INV-1")).thenReturn(Optional.of(i));
        assertThatThrownBy(() -> service.adjust("INV-1",
                new com.ivanta.dto.InventoryDtos.AdjustRequest(-5, "cycle count")))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("reserved");
    }

    @Test
    void statusRecalculatesLowAndOut() {
        InventoryItem i = item("INV-1", 10, 0, 5);
        i.setQuantity(3);
        service.recalcStatus(i);
        assertThat(i.getStatus()).isEqualTo("LOW_STOCK");
        i.setQuantity(0);
        service.recalcStatus(i);
        assertThat(i.getStatus()).isEqualTo("OUT_OF_STOCK");
    }
}
