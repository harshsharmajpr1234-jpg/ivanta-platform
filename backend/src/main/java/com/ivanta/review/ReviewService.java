package com.ivanta.review;

import com.ivanta.audit.AuditService;
import com.ivanta.auth.UserRepository;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.exception.ResourceNotFoundException;
import com.ivanta.common.util.IdService;
import com.ivanta.dto.ReviewDtos.*;
import com.ivanta.product.Product;
import com.ivanta.product.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Set;

/**
 * Reviews (§33): verified_purchase is COMPUTED from delivered order history —
 * the frontend can never claim it. Unverified reviews go to moderation.
 */
@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ProductReviewRepository reviews;
    private final ProductRepository products;
    private final UserRepository users;
    private final IdService ids;
    private final AuditService audit;

    @Transactional
    public ReviewView create(String userId, ReviewCreateRequest req) {
        Product p = products.findByIdAndDeletedAtIsNull(req.productId())
                .orElseThrow(() -> new ResourceNotFoundException("Product " + req.productId()));
        if (reviews.existsByProductIdAndUserId(p.getId(), userId))
            throw new BusinessException(ErrorCode.CONFLICT, "You have already reviewed this product");

        List<String> eligible = reviews.eligibleOrders(userId, p.getId());
        boolean verified = !eligible.isEmpty();

        ProductReview r = new ProductReview();
        r.setId(ids.next("product_reviews", "REV", 5));
        r.setProductId(p.getId());
        r.setUserId(userId);
        r.setOrderId(verified ? eligible.get(0) : null);
        r.setRating(req.rating());
        r.setTitle(com.ivanta.common.util.XssSanitizer.sanitize(req.title()));
        r.setBody(com.ivanta.common.util.XssSanitizer.sanitize(req.body()));
        r.setVerifiedPurchase(verified);
        r.setStatus(verified ? "APPROVED" : "PENDING");   // unverified -> moderation queue
        reviews.save(r);
        recalcRating(p.getId());
        audit.record("REVIEW_CREATED", "product_review", r.getId(), null,
                "product=" + p.getId() + " rating=" + req.rating() + " verified=" + verified);
        return toView(r);
    }

    @Transactional(readOnly = true)
    public ReviewListResponse forProduct(String productId, int page, int size) {
        Page<ProductReview> p = reviews.findByProductIdAndStatusOrderByIdDesc(productId, "APPROVED",
                PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 50)));
        List<Object[]> stats = reviews.ratingStats(productId);
        double avg = stats.isEmpty() || stats.get(0)[0] == null ? 0 : ((Number) stats.get(0)[0]).doubleValue();
        long count = stats.isEmpty() || stats.get(0)[1] == null ? 0 : ((Number) stats.get(0)[1]).longValue();
        return new ReviewListResponse(p.getContent().stream().map(this::toView).toList(),
                p.getNumber(), p.getSize(), p.getTotalElements(), p.getTotalPages(),
                BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP).doubleValue(), count);
    }

    @Transactional(readOnly = true)
    public List<ReviewView> forUser(String userId) {
        return reviews.findByUserIdOrderByIdDesc(userId).stream().map(this::toView).toList();
    }

    @Transactional
    public ReviewView moderate(String reviewId, ModerateRequest req, String adminId) {
        ProductReview r = reviews.findById(reviewId)
                .orElseThrow(() -> new ResourceNotFoundException("Review " + reviewId));
        if (!Set.of("APPROVED", "REJECTED", "PENDING").contains(req.status()))
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "status must be APPROVED|REJECTED|PENDING");
        String before = r.getStatus();
        r.setStatus(req.status());
        r.setAdminNote(req.adminNote());
        reviews.save(r);
        recalcRating(r.getProductId());
        audit.record("REVIEW_MODERATED", "product_review", reviewId, before, req.status());
        return toView(r);
    }

    @Transactional(readOnly = true)
    public Page<ProductReview> adminList(String status, int page, int size) {
        PageRequest pr = PageRequest.of(Math.max(0, page), Math.min(Math.max(1, size), 100));
        return (status == null || status.isBlank())
                ? reviews.findAllByOrderByIdDesc(pr)
                : reviews.findByStatusOrderByIdDesc(status, pr);
    }

    @Transactional
    public void recalcRating(String productId) {
        products.findById(productId).ifPresent(p -> {
            List<Object[]> stats = reviews.ratingStats(productId);
            double avg = stats.isEmpty() || stats.get(0)[0] == null ? 0 : ((Number) stats.get(0)[0]).doubleValue();
            long count = stats.isEmpty() || stats.get(0)[1] == null ? 0 : ((Number) stats.get(0)[1]).longValue();
            p.setRatingAvg(BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP));
            p.setRatingCount((int) count);
            products.save(p);
        });
    }

    public ReviewView toView(ProductReview r) {
        String name = users.findById(r.getUserId()).map(u -> {
            String n = u.getName();
            return n == null || n.isBlank() ? "iVanta Customer" : n;
        }).orElse("iVanta Customer");
        return new ReviewView(r.getId(), r.getProductId(), name, r.getRating(), r.getTitle(), r.getBody(),
                Boolean.TRUE.equals(r.getVerifiedPurchase()), r.getStatus(),
                r.getCreatedAt() == null ? null : r.getCreatedAt().toString());
    }
}
