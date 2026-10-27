package com.ivanta.product;

import com.ivanta.category.Brand;
import com.ivanta.category.BrandRepository;
import com.ivanta.category.Category;
import com.ivanta.category.CategoryRepository;
import com.ivanta.common.exception.ResourceNotFoundException;
import com.ivanta.dto.InventoryDtos.ProductAvailability;
import com.ivanta.dto.ProductDtos.*;
import com.ivanta.inventory.InventoryService;
import jakarta.persistence.criteria.Predicate;
import jakarta.persistence.criteria.Subquery;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

/**
 * Public catalog + search (§11/§53): server-side filtering, sorting and
 * pagination — the full database is never sent to the browser.
 */
@Service
@RequiredArgsConstructor
public class ProductService {

    private final ProductRepository products;
    private final ProductVariantRepository variants;
    private final ProductImageRepository images;
    private final ProductColorRepository colors;
    private final ProductStorageOptionRepository storages;
    private final ProductSpecificationRepository specs;
    private final CategoryRepository categories;
    private final BrandRepository brands;
    private final InventoryService inventory;

    public record SearchParams(String q, String category, String brand, BigDecimal minPrice,
                               BigDecimal maxPrice, String storage, String color, Boolean inStock,
                               BigDecimal minRating, String sort, int page, int size) { }

    /* ---------- search (§11) ---------- */

    @Transactional(readOnly = true)
    public PageResponse<ProductListItem> search(SearchParams p) {
        Sort sort = switch (p.sort() == null ? "popular" : p.sort()) {
            case "price_asc" -> Sort.by("price").ascending();
            case "price_desc" -> Sort.by("price").descending();
            case "newest" -> Sort.by("createdAt").descending();
            case "featured" -> Sort.by("featured").descending().and(Sort.by("createdAt").descending());
            default -> Sort.by("viewsCount").descending().and(Sort.by("ratingAvg").descending()); // popular
        };
        PageRequest pr = PageRequest.of(Math.max(0, p.page()), Math.min(Math.max(1, p.size()), 48), sort);
        Page<Product> result = products.findAll(spec(p), pr);
        List<ProductListItem> content = result.getContent().stream().map(this::toListItem).toList();
        return new PageResponse<>(content, result.getNumber(), result.getSize(),
                result.getTotalElements(), result.getTotalPages());
    }

    private Specification<Product> spec(SearchParams p) {
        return (root, query, cb) -> {
            List<Predicate> preds = new ArrayList<>();
            preds.add(cb.isTrue(root.get("isActive")));
            preds.add(cb.isNull(root.get("deletedAt")));
            if (p.q() != null && !p.q().isBlank() && p.q().length() >= 2) {
                String like = "%" + p.q().trim().toLowerCase() + "%";
                preds.add(cb.or(
                        cb.like(cb.lower(root.get("name")), like),
                        cb.like(cb.lower(root.get("sku")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("model"), "")), like),
                        cb.like(cb.lower(cb.coalesce(root.get("shortDescription"), "")), like)));
            }
            if (p.category() != null && !p.category().isBlank()) {
                Set<String> ids = categorySubtree(p.category());
                if (!ids.isEmpty()) preds.add(root.get("categoryId").in(ids));
            }
            if (p.brand() != null && !p.brand().isBlank()) {
                brands.findAll().stream()
                        .filter(b -> b.getSlug().equalsIgnoreCase(p.brand()) || b.getId().equals(p.brand()))
                        .findFirst()
                        .ifPresent(b -> preds.add(cb.equal(root.get("brandId"), b.getId())));
            }
            if (p.minPrice() != null) preds.add(cb.greaterThanOrEqualTo(root.get("price"), p.minPrice()));
            if (p.maxPrice() != null) preds.add(cb.lessThanOrEqualTo(root.get("price"), p.maxPrice()));
            if (Boolean.TRUE.equals(p.inStock())) preds.add(root.get("stockStatus").in(List.of("IN_STOCK", "LOW_STOCK")));
            if (p.minRating() != null) preds.add(cb.greaterThanOrEqualTo(root.get("ratingAvg"), p.minRating()));
            if (p.storage() != null && !p.storage().isBlank()) {
                Subquery<String> sq = query.subquery(String.class);
                var v = sq.from(ProductVariant.class);
                sq.select(v.get("id")).where(cb.and(
                        cb.equal(v.get("productId"), root.get("id")),
                        cb.isTrue(v.get("isActive")),
                        cb.equal(cb.lower(v.get("storage")), p.storage().toLowerCase())));
                preds.add(cb.exists(sq));
            }
            if (p.color() != null && !p.color().isBlank()) {
                String like = "%" + p.color().trim().toLowerCase() + "%";
                Subquery<String> sq = query.subquery(String.class);
                var c = sq.from(ProductColor.class);
                sq.select(c.get("id")).where(cb.and(
                        cb.equal(c.get("productId"), root.get("id")),
                        cb.isTrue(c.get("isActive")),
                        cb.like(cb.lower(c.get("name")), like)));
                Subquery<String> sq2 = query.subquery(String.class);
                var v2 = sq2.from(ProductVariant.class);
                sq2.select(v2.get("id")).where(cb.and(
                        cb.equal(v2.get("productId"), root.get("id")),
                        cb.isTrue(v2.get("isActive")),
                        cb.like(cb.lower(cb.coalesce(v2.get("color"), "")), like)));
                preds.add(cb.or(cb.exists(sq), cb.exists(sq2)));
            }
            return cb.and(preds.toArray(new Predicate[0]));
        };
    }

    private Set<String> categorySubtree(String slugOrId) {
        if (slugOrId == null || slugOrId.isBlank()) return Set.of();
        String normalized = slugOrId.toLowerCase().trim();
        if ("apple-watch".equals(normalized) || "watches".equals(normalized)) normalized = "watch";
        else if ("iphones".equals(normalized)) normalized = "iphone";
        else if ("macs".equals(normalized) || "macbook".equals(normalized) || "macbooks".equals(normalized)) normalized = "mac";
        else if ("ipads".equals(normalized)) normalized = "ipad";

        String finalSlug = normalized;
        Optional<Category> cat = categories.findBySlugAndIsActiveTrue(finalSlug)
                .or(() -> categories.findBySlugAndIsActiveTrue(slugOrId))
                .or(() -> categories.findById(slugOrId));
        if (cat.isEmpty()) return Set.of();
        Set<String> ids = new LinkedHashSet<>();
        collect(cat.get().getId(), ids);
        return ids;
    }

    private void collect(String categoryId, Set<String> acc) {
        acc.add(categoryId);
        categories.findByParentIdAndIsActiveTrueOrderBySortOrderAsc(categoryId)
                .forEach(c -> collect(c.getId(), acc));
    }

    /* ---------- detail (§12) ---------- */

    @Transactional
    public ProductDetail detail(String idOrSlug) {
        Product p = products.findByIdAndDeletedAtIsNull(idOrSlug)
                .or(() -> products.findBySlugAndDeletedAtIsNullAndIsActiveTrue(idOrSlug))
                .orElseThrow(() -> new ResourceNotFoundException("Product " + idOrSlug));
        p.setViewsCount(p.getViewsCount() + 1);   // popularity signal for sorting
        products.save(p);
        return toDetail(p);
    }

    @Transactional(readOnly = true)
    public List<ProductListItem> featured() {
        return products.findByFeaturedTrueAndIsActiveTrueAndDeletedAtIsNullOrderByCreatedAtDesc().stream()
                .limit(12).map(this::toListItem).toList();
    }

    @Transactional(readOnly = true)
    public List<ProductListItem> related(String productId) {
        Product p = products.findByIdAndDeletedAtIsNull(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product " + productId));
        return products.findByCategoryIdAndIsActiveTrueAndDeletedAtIsNullOrderByNameAsc(p.getCategoryId())
                .stream().filter(x -> !x.getId().equals(productId)).limit(8).map(this::toListItem).toList();
    }

    @Transactional(readOnly = true)
    public ProductAvailability availability(String productId) {
        return inventory.availabilityForProduct(productId);
    }

    /* ---------- category tree ---------- */

    @Transactional(readOnly = true)
    public List<CategoryNode> categoryTree() {
        List<Category> all = categories.findByIsActiveTrueOrderBySortOrderAsc();
        Map<String, List<Category>> byParent = new LinkedHashMap<>();
        all.forEach(c -> byParent.computeIfAbsent(c.getParentId() == null ? "" : c.getParentId(),
                k -> new ArrayList<>()).add(c));
        return buildTree("", byParent);
    }

    private List<CategoryNode> buildTree(String parentId, Map<String, List<Category>> byParent) {
        return byParent.getOrDefault(parentId, List.of()).stream()
                .map(c -> {
                    List<CategoryNode> children = buildTree(c.getId(), byParent);
                    long directCount = products.findByCategoryIdAndIsActiveTrueAndDeletedAtIsNullOrderByNameAsc(c.getId()).size();
                    long totalCount = directCount + children.stream().mapToLong(CategoryNode::productCount).sum();
                    return new CategoryNode(c.getId(), c.getName(), c.getSlug(), c.getDescription(),
                            c.getImageKey(),
                            totalCount,
                            children);
                })
                .toList();
    }

    /* ---------- mappers ---------- */

    public ProductListItem toListItem(Product p) {
        String image = images.findByProductIdAndIsActiveTrueOrderBySortOrderAsc(p.getId()).stream()
                .filter(i -> Boolean.TRUE.equals(i.getIsMain())).findFirst()
                .or(() -> images.findByProductIdAndIsActiveTrueOrderBySortOrderAsc(p.getId()).stream().findFirst())
                .map(ProductImage::getStorageKey).orElse(null);
        return new ProductListItem(p.getId(), p.getName(), p.getSlug(), brandName(p.getBrandId()),
                categoryName(p.getCategoryId()), p.getPrice(), p.getMrp(), discountPct(p.getPrice(), p.getMrp()),
                p.getRatingAvg(), p.getRatingCount(), image, p.getStockStatus(),
                Boolean.TRUE.equals(p.getFeatured()), p.getReleaseYear(), p.getShortDescription());
    }

    public ProductDetail toDetail(Product p) {
        List<VariantView> vv = new ArrayList<>();
        for (ProductVariant v : variants.findByProductIdAndIsActiveTrue(p.getId())) {
            long avail = inventory.totalAvailable(v.getId());
            vv.add(new VariantView(v.getId(), v.getSku(), v.getName(), v.getStorage(), v.getColor(),
                    v.getConnectivity(), v.getSize(), v.getPrice(), v.getMrp(), avail,
                    avail > 0 ? "IN_STOCK" : "OUT_OF_STOCK"));
        }
        return new ProductDetail(p.getId(), p.getSku(), p.getName(), p.getSlug(), brandName(p.getBrandId()),
                categoryName(p.getCategoryId()), p.getModel(), p.getShortDescription(), p.getDescription(),
                p.getPrice(), p.getMrp(), discountPct(p.getPrice(), p.getMrp()), p.getTaxRate(),
                p.getStockStatus(), p.getReleaseYear(),
                p.getWarrantyMonths() == null ? 12 : p.getWarrantyMonths(),
                Boolean.TRUE.equals(p.getFeatured()), p.getRatingAvg(), p.getRatingCount(),
                vv,
                colors.findByProductIdAndIsActiveTrueOrderBySortOrderAsc(p.getId()).stream()
                        .map(c -> new ColorView(c.getId(), c.getName(), c.getHex())).toList(),
                storages.findByProductIdAndIsActiveTrueOrderBySortOrderAsc(p.getId()).stream()
                        .map(s -> new StorageView(s.getId(), s.getStorage())).toList(),
                specs.findByProductIdOrderBySortOrderAsc(p.getId()).stream()
                        .map(s -> new SpecView(s.getSpecKey(), s.getSpecValue())).toList(),
                images.findByProductIdAndIsActiveTrueOrderBySortOrderAsc(p.getId()).stream()
                        .map(i -> new ImageView(i.getId(), i.getStorageKey(), i.getAlt(),
                                Boolean.TRUE.equals(i.getIsMain()), Boolean.TRUE.equals(i.getIsThumbnail()))).toList());
    }

    public static int discountPct(BigDecimal price, BigDecimal mrp) {
        if (mrp == null || price == null || mrp.compareTo(BigDecimal.ZERO) <= 0 || mrp.compareTo(price) <= 0) return 0;
        return mrp.subtract(price).multiply(BigDecimal.valueOf(100))
                .divide(mrp, 0, RoundingMode.HALF_UP).intValue();
    }

    private String brandName(String brandId) {
        return brands.findById(brandId).map(Brand::getName).orElse(null);
    }

    private String categoryName(String categoryId) {
        return categories.findById(categoryId).map(Category::getName).orElse(null);
    }
}
