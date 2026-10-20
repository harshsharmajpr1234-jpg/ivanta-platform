package com.ivanta.inventory;

import com.ivanta.audit.AuditService;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.util.IdService;
import com.ivanta.dto.InventoryDtos.*;
import com.ivanta.product.Product;
import com.ivanta.product.ProductRepository;
import com.ivanta.product.ProductVariant;
import com.ivanta.product.ProductVariantRepository;
import com.ivanta.security.AdminPrincipal;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;

/**
 * Stock management (§14/§27/§39). All mutations write the append-only movement
 * ledger and recompute statuses. Reservations prevent overselling: they hold
 * `reserved_quantity` until payment consumes or failure/expiry releases them.
 *
 * Movement semantics (quantity_change tracks AVAILABLE stock delta):
 *  RESERVATION −q (reserved+=q)   RELEASE/EXPIRED +q (reserved−=q)
 *  SALE 0 (quantity−=q, reserved−=q)   PURCHASE/RESTOCK/RETURN +q (quantity+=q)
 *  ADJUSTMENT ±q (quantity+=q)   TRANSFER −q/+q across warehouses
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class InventoryService {

    private final InventoryItemRepository items;
    private final InventoryMovementRepository movements;
    private final StockReservationRepository reservations;
    private final WarehouseRepository warehouses;
    private final ProductRepository products;
    private final ProductVariantRepository variants;
    private final IdService ids;
    private final AuditService audit;

    public record ReserveLine(String productId, String variantId, int quantity, String productName) { }

    /* ---------- reservation lifecycle (§14) ---------- */

    @Transactional
    public void reserveForOrder(String orderId, List<ReserveLine> lines, int ttlMinutes) {
        Instant expiry = Instant.now().plusSeconds(ttlMinutes * 60L);
        for (ReserveLine line : lines) {
            String key = line.variantId() != null ? line.variantId() : line.productId();
            List<InventoryItem> candidates = (line.variantId() != null
                    ? items.findByVariantId(line.variantId())
                    : items.findByProductId(line.productId())).stream()
                    .filter(i -> !"DISCONTINUED".equals(i.getStatus()))
                    .sorted(Comparator.comparingInt(InventoryItem::available).reversed())
                    .toList();
            // pre-check: never create partial holds — fail before mutating (§14)
            long totalAvailable = candidates.stream().mapToLong(InventoryItem::available).sum();
            if (totalAvailable < line.quantity())
                throw new BusinessException(ErrorCode.OUT_OF_STOCK,
                        "Insufficient stock for " + line.productName() + " (short by "
                                + (line.quantity() - totalAvailable) + ")");
            int remaining = line.quantity();
            for (InventoryItem item : candidates) {
                if (remaining <= 0) break;
                int take = Math.min(remaining, item.available());
                if (take <= 0) continue;
                item.setReservedQuantity(item.getReservedQuantity() + take);
                items.save(item);
                recordMovement(item, InventoryMovement.Type.RESERVATION, -take, "order", orderId, "Reserved at checkout");
                StockReservation r = new StockReservation();
                r.setId(ids.next("stock_reservations", "RSV", 6));
                r.setOrderId(orderId);
                r.setInventoryId(item.getId());
                r.setVariantId(line.variantId());
                r.setQuantity(take);
                r.setStatus(StockReservation.Status.RESERVED);
                r.setExpiresAt(expiry);
                reservations.save(r);
                remaining -= take;
            }
            if (remaining > 0)
                throw new BusinessException(ErrorCode.OUT_OF_STOCK,
                        "Insufficient stock for " + line.productName() + " (short by " + remaining + ")");
            recalcRollup(line.productId());
        }
    }

    /** Payment succeeded: turn reservations into real sales (quantity−, reserved−). */
    @Transactional
    public void consumeForOrder(String orderId) {
        for (StockReservation r : reservations.findByOrderIdAndStatus(orderId, StockReservation.Status.RESERVED)) {
            InventoryItem item = items.findById(r.getInventoryId()).orElseThrow();
            int q = r.getQuantity();
            item.setQuantity(Math.max(0, item.getQuantity() - q));
            item.setReservedQuantity(Math.max(0, item.getReservedQuantity() - q));
            items.save(item);
            r.setStatus(StockReservation.Status.CONSUMED);
            r.setResolvedAt(Instant.now());
            reservations.save(r);
            recordMovement(item, InventoryMovement.Type.SALE, 0, "order", orderId, "Payment confirmed — stock sold");
            recalcStatus(item);
            recalcRollup(item.getProductId());
        }
    }

    /** Payment failed / order cancelled / reservation expired: give stock back. */
    @Transactional
    public void releaseForOrder(String orderId, boolean markExpired) {
        for (StockReservation r : reservations.findByOrderIdAndStatus(orderId, StockReservation.Status.RESERVED)) {
            InventoryItem item = items.findById(r.getInventoryId()).orElseThrow();
            item.setReservedQuantity(Math.max(0, item.getReservedQuantity() - r.getQuantity()));
            items.save(item);
            r.setStatus(markExpired ? StockReservation.Status.EXPIRED : StockReservation.Status.RELEASED);
            r.setResolvedAt(Instant.now());
            reservations.save(r);
            recordMovement(item, InventoryMovement.Type.RELEASE, r.getQuantity(), "order", orderId,
                    markExpired ? "Reservation expired" : "Reservation released");
            recalcStatus(item);
            recalcRollup(item.getProductId());
        }
    }

    @Transactional(readOnly = true)
    public boolean hasOpenReservation(String orderId) {
        return !reservations.findByOrderIdAndStatus(orderId, StockReservation.Status.RESERVED).isEmpty();
    }

    /** Scheduler hook: release expired reservations, return affected order ids. */
    @Transactional
    public Set<String> expireDueReservations() {
        List<StockReservation> due = reservations.findByStatusAndExpiresAtBefore(
                StockReservation.Status.RESERVED, Instant.now());
        Set<String> orders = new HashSet<>();
        for (StockReservation r : due) {
            InventoryItem item = items.findById(r.getInventoryId()).orElse(null);
            if (item != null) {
                item.setReservedQuantity(Math.max(0, item.getReservedQuantity() - r.getQuantity()));
                items.save(item);
                recordMovement(item, InventoryMovement.Type.RELEASE, r.getQuantity(), "order", r.getOrderId(),
                        "Reservation expired");
                recalcStatus(item);
                recalcRollup(item.getProductId());
            }
            r.setStatus(StockReservation.Status.EXPIRED);
            r.setResolvedAt(Instant.now());
            reservations.save(r);
            if (r.getOrderId() != null) orders.add(r.getOrderId());
        }
        return orders;
    }

    /* ---------- admin operations (§39) ---------- */

    @Transactional
    public InventoryRow addStock(AddStockRequest req) {
        Product p = products.findByIdAndDeletedAtIsNull(req.productId())
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Product not found"));
        String sku = req.sku();
        if (req.variantId() != null) {
            ProductVariant v = variants.findById(req.variantId())
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Variant not found"));
            sku = v.getSku();
        } else if (sku == null) sku = p.getSku();
        final String skuFinal = sku;

        InventoryItem item = (req.variantId() != null
                ? items.findByVariantIdAndWarehouseId(req.variantId(), req.warehouseId())
                : items.findByProductId(req.productId()).stream()
                    .filter(i -> i.getWarehouseId().equals(req.warehouseId())).findFirst())
                .orElseGet(() -> {
                    InventoryItem n = new InventoryItem();
                    n.setId(ids.next("inventory", "INV", 5));
                    n.setProductId(req.productId());
                    n.setVariantId(req.variantId());
                    n.setWarehouseId(req.warehouseId());
                    n.setSku(skuFinal);
                    n.setQuantity(0);
                    n.setReservedQuantity(0);
                    return n;
                });
        if (req.reorderLevel() != null) item.setReorderLevel(req.reorderLevel());
        item.setQuantity(item.getQuantity() + req.quantity());
        items.save(item);
        recordMovement(item, InventoryMovement.Type.PURCHASE, req.quantity(), "manual", item.getId(),
                "Stock added by admin");
        recalcStatus(item);
        recalcRollup(item.getProductId());
        audit.record("INVENTORY_UPDATED", "inventory", item.getId(), null, "+" + req.quantity() + " " + sku);
        return toRow(item, p.getName(), variantName(req.variantId()));
    }

    @Transactional
    public InventoryRow adjust(String inventoryId, AdjustRequest req) {
        InventoryItem item = items.findById(inventoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Inventory row not found"));
        int before = item.getQuantity();
        int after = before + req.delta();
        if (after < item.getReservedQuantity())
            throw new BusinessException(ErrorCode.INVALID_STATE,
                    "Cannot reduce below reserved quantity (" + item.getReservedQuantity() + ")");
        item.setQuantity(after);
        items.save(item);
        recordMovement(item, InventoryMovement.Type.ADJUSTMENT, req.delta(), "manual", item.getId(),
                req.note() == null ? "Manual adjustment" : req.note());
        recalcStatus(item);
        recalcRollup(item.getProductId());
        audit.record("INVENTORY_UPDATED", "inventory", inventoryId, "qty=" + before, "qty=" + after);
        return toRow(item, productName(item.getProductId()), variantName(item.getVariantId()));
    }

    @Transactional
    public InventoryRow updateStockForVariant(String variantId, int newQuantity, String warehouseId, String note) {
        ProductVariant v = variants.findById(variantId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Variant not found"));
        String whId = (warehouseId != null && !warehouseId.isBlank()) ? warehouseId : "WH-0001";
        InventoryItem item = items.findByVariantIdAndWarehouseId(variantId, whId)
                .orElseGet(() -> {
                    InventoryItem n = new InventoryItem();
                    n.setId(ids.next("inventory", "INV", 5));
                    n.setProductId(v.getProductId());
                    n.setVariantId(variantId);
                    n.setWarehouseId(whId);
                    n.setSku(v.getSku());
                    n.setQuantity(0);
                    n.setReservedQuantity(0);
                    return n;
                });
        int before = item.getQuantity();
        int delta = newQuantity - before;
        if (newQuantity < item.getReservedQuantity())
            throw new BusinessException(ErrorCode.INVALID_STATE,
                    "Cannot set quantity below reserved quantity (" + item.getReservedQuantity() + ")");
        item.setQuantity(newQuantity);
        items.save(item);
        recordMovement(item, InventoryMovement.Type.ADJUSTMENT, delta, "manual", item.getId(),
                note == null ? "Stock set by admin" : note);
        recalcStatus(item);
        recalcRollup(item.getProductId());
        audit.record("INVENTORY_UPDATED", "inventory", item.getId(), "qty=" + before, "qty=" + newQuantity);
        return toRow(item, productName(item.getProductId()), variantName(variantId));
    }

    @Transactional
    public InventoryRow adjustByVariant(String variantId, int delta, String warehouseId, String note) {
        String whId = (warehouseId != null && !warehouseId.isBlank()) ? warehouseId : "WH-0001";
        Optional<InventoryItem> opt = items.findByVariantIdAndWarehouseId(variantId, whId);
        if (opt.isPresent()) {
            return adjust(opt.get().getId(), new AdjustRequest(delta, note));
        } else {
            ProductVariant v = variants.findById(variantId)
                    .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Variant not found"));
            return addStock(new AddStockRequest(v.getProductId(), variantId, whId, v.getSku(), Math.max(0, delta), 5));
        }
    }

    @Transactional
    public void transfer(String inventoryId, TransferRequest req) {
        InventoryItem from = items.findById(inventoryId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Inventory row not found"));
        if (from.available() < req.quantity())
            throw new BusinessException(ErrorCode.INVALID_STATE, "Only " + from.available() + " units available");
        InventoryItem to = items.findByVariantIdAndWarehouseId(
                        from.getVariantId() == null ? "" : from.getVariantId(), req.toWarehouseId())
                .orElseGet(() -> {
                    InventoryItem n = new InventoryItem();
                    n.setId(ids.next("inventory", "INV", 5));
                    n.setProductId(from.getProductId());
                    n.setVariantId(from.getVariantId());
                    n.setWarehouseId(req.toWarehouseId());
                    n.setSku(from.getSku());
                    n.setQuantity(0);
                    n.setReservedQuantity(0);
                    n.setReorderLevel(from.getReorderLevel());
                    return items.save(n);
                });
        from.setQuantity(from.getQuantity() - req.quantity());
        to.setQuantity(to.getQuantity() + req.quantity());
        items.save(from);
        items.save(to);
        recordMovement(from, InventoryMovement.Type.TRANSFER, -req.quantity(), "manual", to.getId(),
                "Transfer to " + req.toWarehouseId() + (req.note() == null ? "" : ": " + req.note()));
        recordMovement(to, InventoryMovement.Type.TRANSFER, req.quantity(), "manual", from.getId(),
                "Transfer from " + from.getWarehouseId() + (req.note() == null ? "" : ": " + req.note()));
        recalcStatus(from);
        recalcStatus(to);
        recalcRollup(from.getProductId());
        audit.record("INVENTORY_UPDATED", "inventory", inventoryId,
                "qty=" + (from.getQuantity() + req.quantity()), "transferred " + req.quantity() + " -> " + req.toWarehouseId());
    }

    /** Returned unit goes back to sellable stock (§30 RECEIVED step). */
    @Transactional
    public void receiveReturn(String orderId, String variantId, String productId, int quantity, String note) {
        List<InventoryItem> candidates = variantId != null ? items.findByVariantId(variantId) : items.findByProductId(productId);
        InventoryItem item = candidates.stream()
                .filter(i -> !"DISCONTINUED".equals(i.getStatus()))
                .max(Comparator.comparingInt(InventoryItem::getQuantity))
                .orElse(null);
        if (item == null) {
            log.warn("Return {} for variant {} — no inventory row to restock", orderId, variantId);
            return;
        }
        item.setQuantity(item.getQuantity() + quantity);
        items.save(item);
        recordMovement(item, InventoryMovement.Type.RETURN, quantity, "return", orderId, note);
        recalcStatus(item);
        recalcRollup(item.getProductId());
    }

    /* ---------- status maintenance ---------- */

    public void recalcStatus(InventoryItem item) {
        if ("DISCONTINUED".equals(item.getStatus())) return;   // manual state, never auto-changed
        String s = item.getQuantity() == 0 ? "OUT_OF_STOCK"
                : item.getQuantity() <= item.getReorderLevel() ? "LOW_STOCK" : "IN_STOCK";
        if (!s.equals(item.getStatus())) {
            item.setStatus(s);
            items.save(item);
        }
    }

    @Transactional
    public void recalcRollup(String productId) {
        products.findByIdAndDeletedAtIsNull(productId).ifPresent(p -> {
            List<InventoryItem> rows = items.findByProductId(productId);
            String rollup = rows.stream().anyMatch(i -> "IN_STOCK".equals(i.getStatus())) ? "IN_STOCK"
                    : rows.stream().anyMatch(i -> "LOW_STOCK".equals(i.getStatus())) ? "LOW_STOCK"
                    : "OUT_OF_STOCK";
            if (!rollup.equals(p.getStockStatus())) {
                p.setStockStatus(rollup);
                products.save(p);
            }
        });
    }

    /* ---------- queries ---------- */

    @Transactional(readOnly = true)
    public long totalAvailable(String variantId) {
        return items.totalAvailableForVariant(variantId);
    }

    @Transactional(readOnly = true)
    public long totalAvailableForProductStock(String productId) {
        return items.totalAvailableForProduct(productId);
    }

    @Transactional(readOnly = true)
    public List<InventoryRow> list(String productId, String warehouseId, String status) {
        return items.findAll().stream()
                .filter(i -> productId == null || productId.isBlank() || i.getProductId().equals(productId))
                .filter(i -> warehouseId == null || warehouseId.isBlank() || i.getWarehouseId().equals(warehouseId))
                .filter(i -> status == null || status.isBlank() || i.getStatus().equals(status))
                .map(i -> toRow(i, productName(i.getProductId()), variantName(i.getVariantId())))
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MovementView> movementsFor(String inventoryId) {
        return movements.findByInventoryIdOrderByIdDesc(inventoryId,
                        org.springframework.data.domain.PageRequest.of(0, 100)).stream()
                .map(m -> new MovementView(m.getId(), m.getMovementType().name(), m.getQuantityChange(),
                        m.getQuantityAfter(), m.getReferenceType(), m.getReferenceId(), m.getNote(),
                        m.getCreatedBy(), m.getCreatedAt().toString()))
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductAvailability availabilityForProduct(String productId) {
        Product p = products.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new BusinessException(ErrorCode.NOT_FOUND, "Product not found"));
        List<VariantAvailability> va = new ArrayList<>();
        for (ProductVariant v : variants.findByProductIdAndIsActiveTrue(productId)) {
            Map<String, Long> byWh = new LinkedHashMap<>();
            long total = 0;
            String worst = "OUT_OF_STOCK";
            for (InventoryItem i : items.findByVariantId(v.getId())) {
                long av = i.available();
                byWh.put(warehouseName(i.getWarehouseId()), av);
                total += av;
                if ("IN_STOCK".equals(i.getStatus())) worst = "IN_STOCK";
                else if ("LOW_STOCK".equals(i.getStatus()) && !"IN_STOCK".equals(worst)) worst = "LOW_STOCK";
            }
            if (byWh.isEmpty()) worst = "OUT_OF_STOCK";
            va.add(new VariantAvailability(v.getId(), v.getName(), v.getSku(), total, byWh, worst));
        }
        return new ProductAvailability(productId, p.getStockStatus(), va);
    }

    /* ---------- helpers ---------- */

    private void recordMovement(InventoryItem item, InventoryMovement.Type type, int change,
                                String refType, String refId, String note) {
        InventoryMovement m = new InventoryMovement();
        m.setId(ids.next("inventory_movements", "MOV", 6));
        m.setInventoryId(item.getId());
        m.setProductId(item.getProductId());
        m.setVariantId(item.getVariantId());
        m.setMovementType(type);
        m.setQuantityChange(change);
        m.setQuantityAfter(item.getQuantity());
        m.setReferenceType(refType);
        m.setReferenceId(refId);
        m.setNote(note);
        m.setCreatedBy(currentAdminId());
        movements.save(m);
    }

    private InventoryRow toRow(InventoryItem i, String productName, String variantName) {
        return new InventoryRow(i.getId(), i.getProductId(), productName, i.getVariantId(), variantName,
                i.getSku(), i.getWarehouseId(), warehouseName(i.getWarehouseId()), i.getQuantity(),
                i.getReservedQuantity(), i.available(), i.getReorderLevel(), i.getStatus());
    }

    private String productName(String productId) {
        return products.findById(productId).map(Product::getName).orElse(null);
    }

    private String variantName(String variantId) {
        return variantId == null ? null : variants.findById(variantId).map(ProductVariant::getName).orElse(null);
    }

    private String warehouseName(String warehouseId) {
        return warehouses.findById(warehouseId).map(Warehouse::getName).orElse(warehouseId);
    }

    private String currentAdminId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object p = auth == null ? null : auth.getPrincipal();
        return p instanceof AdminPrincipal a ? a.adminId() : null;
    }
}
