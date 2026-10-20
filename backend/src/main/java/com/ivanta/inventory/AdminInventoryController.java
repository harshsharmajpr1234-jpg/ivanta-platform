package com.ivanta.inventory;

import com.ivanta.common.api.ApiResponse;
import com.ivanta.dto.InventoryDtos.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/** Inventory administration (§39). Every mutation is audited inside the service. */
@RestController
@RequestMapping("/api/v1/admin/inventory")
@RequiredArgsConstructor
public class AdminInventoryController {

    private final InventoryService service;
    private final WarehouseRepository warehouses;

    @GetMapping
    @PreAuthorize("hasAuthority('INVENTORY_VIEW')")
    public ApiResponse<List<InventoryRow>> list(@RequestParam(required = false) String productId,
                                                @RequestParam(required = false) String warehouseId,
                                                @RequestParam(required = false) String status) {
        return ApiResponse.ok(service.list(productId, warehouseId, status));
    }

    @GetMapping("/warehouses")
    @PreAuthorize("hasAuthority('INVENTORY_VIEW')")
    public ApiResponse<List<Warehouse>> warehouses() {
        return ApiResponse.ok(warehouses.findByIsActiveTrueOrderByNameAsc());
    }

    @PostMapping("/stock")
    @PreAuthorize("hasAuthority('INVENTORY_UPDATE')")
    public ApiResponse<InventoryRow> addStock(@Valid @RequestBody AddStockRequest req) {
        return ApiResponse.ok(service.addStock(req));
    }

    @PostMapping("/{id}/adjust")
    @PreAuthorize("hasAuthority('INVENTORY_UPDATE')")
    public ApiResponse<InventoryRow> adjust(@PathVariable String id, @Valid @RequestBody AdjustRequest req) {
        if (id.startsWith("VAR-")) {
            return ApiResponse.ok(service.adjustByVariant(id, req.delta(), null, req.note()));
        }
        return ApiResponse.ok(service.adjust(id, req));
    }

    @PatchMapping("/{variantId}")
    @PreAuthorize("hasAuthority('INVENTORY_UPDATE')")
    public ApiResponse<InventoryRow> setStockForVariant(@PathVariable String variantId,
                                                        @RequestParam int stock,
                                                        @RequestParam(required = false) String warehouseId,
                                                        @RequestParam(required = false) String note) {
        return ApiResponse.ok(service.updateStockForVariant(variantId, stock, warehouseId, note));
    }

    @PostMapping("/{id}/transfer")
    @PreAuthorize("hasAuthority('INVENTORY_UPDATE')")
    public ApiResponse<Void> transfer(@PathVariable String id, @Valid @RequestBody TransferRequest req) {
        service.transfer(id, req);
        return ApiResponse.ok();
    }

    @GetMapping("/{id}/movements")
    @PreAuthorize("hasAuthority('INVENTORY_VIEW')")
    public ApiResponse<List<MovementView>> movements(@PathVariable String id) {
        return ApiResponse.ok(service.movementsFor(id));
    }

    @GetMapping("/availability/{productId}")
    @PreAuthorize("hasAuthority('INVENTORY_VIEW')")
    public ApiResponse<ProductAvailability> availability(@PathVariable String productId) {
        return ApiResponse.ok(service.availabilityForProduct(productId));
    }
}
