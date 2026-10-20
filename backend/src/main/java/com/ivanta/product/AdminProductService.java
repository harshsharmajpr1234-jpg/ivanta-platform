package com.ivanta.product;

import com.ivanta.audit.AuditService;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.exception.ResourceNotFoundException;
import com.ivanta.common.util.IdService;
import com.ivanta.dto.ProductDtos.*;
import com.ivanta.inventory.InventoryService;
import com.ivanta.order.OrderItemRepository;
import com.ivanta.security.AdminPrincipal;
import com.ivanta.storage.StorageProvider;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import jakarta.persistence.criteria.Predicate;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;

/**
 * Catalog administration (§38): create/edit/archive products, variants, images,
 * specs and prices. Products with order history are ARCHIVED, never hard-deleted.
 * Every price change writes a product_prices history row.
 */
@Service
@RequiredArgsConstructor
public class AdminProductService {

    private final ProductRepository products;
    private final ProductVariantRepository variants;
    private final ProductImageRepository images;
    private final ProductColorRepository colors;
    private final ProductStorageOptionRepository storages;
    private final ProductSpecificationRepository specs;
    private final ProductPriceRepository priceHistory;
    private final OrderItemRepository orderItems;
    private final InventoryService inventory;
    private final StorageProvider storage;
    private final IdService ids;
    private final AuditService audit;
    private final ProductService catalog;
    private final com.ivanta.storage.FileSecurityValidator fileValidator;

    @Transactional
    public String create(ProductUpsert req) {
        if (products.findByNameIgnoreCaseAndDeletedAtIsNull(req.name()).isPresent())
            throw new BusinessException(ErrorCode.CONFLICT, "A product with this name already exists");
        Product p = new Product();
        p.setId(ids.next("products", "PRD", 4));
        applyUpsert(p, req, true);
        if (p.getSku() == null) p.setSku("IVN-" + p.getId());
        p.setSlug(slugify(req.slug(), req.name()));
        products.save(p);
        audit.record("PRODUCT_CREATED", "product", p.getId(), null, p.getName());
        return p.getId();
    }

    @Transactional
    public void update(String id, ProductUpsert req) {
        Product p = get(id);
        String before = snapshot(p);
        applyUpsert(p, req, false);
        if (req.slug() != null && !req.slug().isBlank()) p.setSlug(slugify(req.slug(), p.getName()));
        products.save(p);
        audit.record("PRODUCT_UPDATED", "product", id, before, snapshot(p));
    }

    /** Archive (soft delete). Hard delete only allowed with zero order history (§38). */
    @Transactional
    public void archive(String id) {
        Product p = get(id);
        p.setDeletedAt(Instant.now());
        p.setDeletedBy(currentAdminId());
        products.save(p);
        audit.record("PRODUCT_ARCHIVED", "product", id, p.getName(), null);
    }

    @Transactional
    public void hardDelete(String id) {
        Product p = get(id);
        if (orderItems.countByProductId(id) > 0)
            throw new BusinessException(ErrorCode.CONFLICT,
                    "Product has order history — archive it instead of deleting (§38)");
        images.findByProductIdAndIsActiveTrueOrderBySortOrderAsc(id).forEach(i -> i.setIsActive(false));
        products.delete(p);
        audit.record("PRODUCT_DELETED", "product", id, p.getName(), null);
    }

    @Transactional
    public VariantView addVariant(String productId, VariantUpsert req) {
        Product p = get(productId);
        ProductVariant v = new ProductVariant();
        v.setId(ids.next("product_variants", "VAR", 4));
        v.setProductId(productId);
        applyVariant(v, req, true);
        if (v.getSku() == null) v.setSku(p.getSku() + "-" + v.getId());
        if (v.getName() == null) v.setName(p.getName() + (req.storage() != null ? " · " + req.storage() : ""));
        variants.save(v);
        audit.record("PRODUCT_UPDATED", "product_variant", v.getId(), null, v.getSku());
        return new VariantView(v.getId(), v.getSku(), v.getName(), v.getStorage(), v.getColor(),
                v.getConnectivity(), v.getSize(), v.getPrice(), v.getMrp(), 0, "OUT_OF_STOCK");
    }

    @Transactional
    public VariantView updateVariant(String variantId, VariantUpsert req) {
        ProductVariant v = variants.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant " + variantId));
        String before = v.getSku() + " price=" + v.getPrice();
        applyVariant(v, req, false);
        variants.save(v);
        audit.record("PRODUCT_UPDATED", "product_variant", variantId, before, v.getSku() + " price=" + v.getPrice());
        long avail = inventory.totalAvailable(variantId);
        return new VariantView(v.getId(), v.getSku(), v.getName(), v.getStorage(), v.getColor(),
                v.getConnectivity(), v.getSize(), v.getPrice(), v.getMrp(), avail, avail > 0 ? "IN_STOCK" : "OUT_OF_STOCK");
    }

    /**
     * Price update (§38/§44): current price changes on the product/variant AND a
     * history row is written; prior rows are closed with effective_to, never deleted.
     */
    @Transactional
    public void updatePrice(String productId, PriceUpdateRequest req) {
        Product p = get(productId);
        Instant now = Instant.now();
        String variantId = req.variantId();
        priceHistory.findByProductIdOrderByEffectiveFromDesc(productId).stream()
                .filter(h -> h.getEffectiveTo() == null)
                .filter(h -> variantId == null ? h.getVariantId() == null : variantId.equals(h.getVariantId()))
                .forEach(h -> { h.setEffectiveTo(now); priceHistory.save(h); });

        String before;
        if (variantId != null) {
            ProductVariant v = variants.findById(variantId)
                    .orElseThrow(() -> new ResourceNotFoundException("Variant " + variantId));
            before = "variant " + v.getSku() + " price=" + v.getPrice() + " mrp=" + v.getMrp();
            v.setPrice(req.price());
            v.setMrp(req.mrp());
            variants.save(v);
            // product headline price = cheapest active variant
            variants.findByProductIdAndIsActiveTrue(productId).stream()
                    .map(ProductVariant::getPrice).min(java.math.BigDecimal::compareTo)
                    .ifPresent(min -> { p.setPrice(min); });
            p.setMrp(req.mrp());
        } else {
            before = "price=" + p.getPrice() + " mrp=" + p.getMrp();
            p.setPrice(req.price());
            p.setMrp(req.mrp());
        }
        products.save(p);

        ProductPrice h = new ProductPrice();
        h.setId(ids.next("product_prices", "PHX", 5));
        h.setProductId(productId);
        h.setVariantId(variantId);
        h.setPrice(req.price());
        h.setMrp(req.mrp());
        h.setEffectiveFrom(now);
        h.setCreatedBy(currentAdminId());
        priceHistory.save(h);
        audit.record("PRICE_CHANGED", "product", productId, before,
                "price=" + req.price() + " mrp=" + req.mrp());
    }

    @Transactional(readOnly = true)
    public List<PricingHistoryRow> priceHistory(String productId) {
        return priceHistory.findByProductIdOrderByEffectiveFromDesc(productId).stream()
                .map(h -> new PricingHistoryRow(h.getId(), h.getVariantId(), h.getPrice(), h.getMrp(),
                        h.getEffectiveFrom().toString(),
                        h.getEffectiveTo() == null ? null : h.getEffectiveTo().toString()))
                .toList();
    }

    @Transactional
    public ImageView uploadImage(String productId, String variantId, MultipartFile file, boolean main) {
        fileValidator.validateImage(file);
        Product p = get(productId);
        String key = storage.store("products/" + p.getSlug(),
                file.getOriginalFilename() == null ? "image" : file.getOriginalFilename(),
                bytes(file), file.getContentType());
        ProductImage img = new ProductImage();
        img.setId(ids.next("product_images", "IMG", 4));
        img.setProductId(productId);
        img.setVariantId(variantId);
        img.setStorageKey(key);
        img.setAlt(p.getName());
        img.setIsMain(main);
        img.setIsThumbnail(main);
        img.setSortOrder(images.findByProductIdAndIsActiveTrueOrderBySortOrderAsc(productId).size());
        images.save(img);
        audit.record("PRODUCT_UPDATED", "product_image", img.getId(), null, key);
        return new ImageView(img.getId(), key, img.getAlt(), main, main);
    }

    @Transactional
    public void deactivateImage(String imageId) {
        images.findById(imageId).ifPresent(i -> { i.setIsActive(false); images.save(i); });
    }

    @Transactional
    public SpecView addSpec(String productId, SpecUpsert req) {
        get(productId);
        ProductSpecification s = new ProductSpecification();
        s.setId(ids.next("product_specifications", "SPEC", 4));
        s.setProductId(productId);
        s.setSpecKey(req.specKey().trim());
        s.setSpecValue(req.specValue().trim());
        s.setSortOrder(req.sortOrder() == null ? 0 : req.sortOrder());
        specs.save(s);
        return new SpecView(s.getSpecKey(), s.getSpecValue());
    }

    @Transactional
    public void deleteSpec(String specId) {
        specs.deleteById(specId);
    }

    @Transactional
    public ColorView addColor(String productId, ColorUpsert req) {
        get(productId);
        ProductColor c = new ProductColor();
        c.setId(ids.next("product_colors", "COL", 4));
        c.setProductId(productId);
        c.setName(req.name().trim());
        c.setHex(req.hex().trim());
        c.setSortOrder(req.sortOrder() == null ? 0 : req.sortOrder());
        colors.save(c);
        return new ColorView(c.getId(), c.getName(), c.getHex());
    }

    @Transactional
    public StorageView addStorageOption(String productId, StorageOptionUpsert req) {
        get(productId);
        ProductStorageOption s = new ProductStorageOption();
        s.setId(ids.next("product_storage_options", "STO", 4));
        s.setProductId(productId);
        s.setStorage(req.storage().trim());
        s.setSortOrder(req.sortOrder() == null ? 0 : req.sortOrder());
        storages.save(s);
        return new StorageView(s.getId(), s.getStorage());
    }

    @Transactional(readOnly = true)
    public PageResponse<ProductListItem> listAdminProducts(int page, int size, String q, String categoryId, String status, Boolean featured) {
        PageRequest pr = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100), Sort.by("createdAt").descending());
        Specification<Product> spec = (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            if ("ARCHIVED".equalsIgnoreCase(status)) {
                preds.add(cb.isNotNull(root.get("deletedAt")));
            } else {
                preds.add(cb.isNull(root.get("deletedAt")));
                if ("ACTIVE".equalsIgnoreCase(status)) {
                    preds.add(cb.isTrue(root.get("isActive")));
                } else if ("DRAFT".equalsIgnoreCase(status) || "INACTIVE".equalsIgnoreCase(status)) {
                    preds.add(cb.isFalse(root.get("isActive")));
                }
            }
            if (q != null && !q.isBlank()) {
                String like = "%" + q.trim().toLowerCase() + "%";
                preds.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("sku")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("model"), "")), like)));
            }
            if (categoryId != null && !categoryId.isBlank()) {
                preds.add(cb.equal(root.get("categoryId"), categoryId));
            }
            if (Boolean.TRUE.equals(featured)) {
                preds.add(cb.isTrue(root.get("featured")));
            }
            return cb.and(preds.toArray(new Predicate[0]));
        };
        Page<Product> pageRes = products.findAll(spec, pr);
        List<ProductListItem> content = pageRes.getContent().stream().map(catalog::toListItem).toList();
        return new PageResponse<>(content, pageRes.getNumber(), pageRes.getSize(),
                pageRes.getTotalElements(), pageRes.getTotalPages());
    }

    @Transactional
    public void deactivateVariant(String variantId) {
        ProductVariant v = variants.findById(variantId)
                .orElseThrow(() -> new ResourceNotFoundException("Variant " + variantId));
        v.setIsActive(false);
        variants.save(v);
        audit.record("PRODUCT_UPDATED", "product_variant", variantId, "active=true", "active=false");
    }

    /* ---------- helpers ---------- */

    Product get(String id) {
        return products.findByIdAndDeletedAtIsNull(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product " + id));
    }

    private void applyUpsert(Product p, ProductUpsert req, boolean create) {
        if (create) p.setSku(req.sku());
        else if (req.sku() != null && !req.sku().isBlank()) p.setSku(req.sku().trim());
        if (req.name() != null) p.setName(req.name().trim());
        if (create || req.brandId() != null) p.setBrandId(req.brandId());
        if (create || req.categoryId() != null) p.setCategoryId(req.categoryId());
        if (req.model() != null) p.setModel(req.model());
        if (req.shortDescription() != null) p.setShortDescription(req.shortDescription());
        if (req.description() != null) p.setDescription(req.description());
        if (req.price() != null) p.setPrice(req.price());
        if (req.mrp() != null) p.setMrp(req.mrp());
        if (req.taxRate() != null) p.setTaxRate(req.taxRate());
        if (req.releaseYear() != null) p.setReleaseYear(req.releaseYear());
        if (req.warrantyMonths() != null) p.setWarrantyMonths(req.warrantyMonths());
        if (req.featured() != null) p.setFeatured(req.featured());
        if (req.isActive() != null) p.setIsActive(req.isActive());
    }

    private void applyVariant(ProductVariant v, VariantUpsert req, boolean create) {
        if (create) v.setSku(req.sku());
        else if (req.sku() != null) v.setSku(req.sku().trim());
        if (req.name() != null) v.setName(req.name().trim());
        if (req.storage() != null) v.setStorage(req.storage());
        if (req.color() != null) v.setColor(req.color());
        if (req.connectivity() != null) v.setConnectivity(req.connectivity());
        if (req.size() != null) v.setSize(req.size());
        if (req.modelNumber() != null) v.setModelNumber(req.modelNumber());
        if (req.price() != null) v.setPrice(req.price());
        if (req.mrp() != null) v.setMrp(req.mrp());
        if (req.isActive() != null) v.setIsActive(req.isActive());
    }

    private String slugify(String explicit, String name) {
        String base = (explicit != null && !explicit.isBlank()) ? explicit : name;
        return base.toLowerCase().replaceAll("[^a-z0-9]+", "-")
                .replaceAll("(^-|-$)", "");
    }

    private String snapshot(Product p) {
        return "name=" + p.getName() + " price=" + p.getPrice() + " mrp=" + p.getMrp()
                + " active=" + p.getIsActive() + " featured=" + p.getFeatured();
    }

    private byte[] bytes(MultipartFile f) {
        try {
            return f.getBytes();
        } catch (java.io.IOException e) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Could not read uploaded file");
        }
    }

    private String currentAdminId() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        Object p = auth == null ? null : auth.getPrincipal();
        return p instanceof AdminPrincipal a ? a.adminId() : null;
    }
}
