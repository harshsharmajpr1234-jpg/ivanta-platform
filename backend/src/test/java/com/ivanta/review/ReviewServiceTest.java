package com.ivanta.review;

import com.ivanta.audit.AuditService;
import com.ivanta.auth.User;
import com.ivanta.auth.UserRepository;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.util.IdService;
import com.ivanta.dto.ReviewDtos.ReviewCreateRequest;
import com.ivanta.dto.ReviewDtos.ReviewView;
import com.ivanta.product.Product;
import com.ivanta.product.ProductRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/** §59: verified_purchase is computed server-side; duplicates blocked. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ReviewServiceTest {

    @Mock ProductReviewRepository reviews;
    @Mock ProductRepository products;
    @Mock UserRepository users;
    @Mock IdService ids;
    @Mock AuditService audit;

    ReviewService service;

    @BeforeEach
    void setUp() {
        service = new ReviewService(reviews, products, users, ids, audit);
        when(ids.next(anyString(), anyString(), anyInt())).thenReturn("REV-1");
        when(reviews.save(any(ProductReview.class))).thenAnswer(i -> i.getArgument(0));

        Product p = new Product();
        p.setId("P1");
        p.setName("iPhone 17");
        when(products.findByIdAndDeletedAtIsNull("P1")).thenReturn(Optional.of(p));
        when(products.findById("P1")).thenReturn(Optional.of(p));
        when(reviews.ratingStats("P1")).thenReturn(List.<Object[]>of(new Object[]{new BigDecimal("4.50"), 2L}));
        User u = new User();
        u.setId("U1");
        u.setName("Asha");
        when(users.findById("U1")).thenReturn(Optional.of(u));
    }

    @Test
    void verifiedPurchaseComputedFromOrderHistory() {
        when(reviews.existsByProductIdAndUserId("P1", "U1")).thenReturn(false);
        when(reviews.eligibleOrders("U1", "P1")).thenReturn(List.of("ORD-2026-000001"));

        ReviewView v = service.create("U1", new ReviewCreateRequest("P1", (short) 5, "Great", "Loved it"));

        assertThat(v.verifiedPurchase()).isTrue();
        assertThat(v.status()).isEqualTo("APPROVED");
    }

    @Test
    void unverifiedReviewGoesToModeration() {
        when(reviews.existsByProductIdAndUserId("P1", "U1")).thenReturn(false);
        when(reviews.eligibleOrders("U1", "P1")).thenReturn(List.of());

        ReviewView v = service.create("U1", new ReviewCreateRequest("P1", (short) 4, "ok", "fine"));

        assertThat(v.verifiedPurchase()).isFalse();
        assertThat(v.status()).isEqualTo("PENDING");
    }

    @Test
    void duplicateReviewRejected() {
        when(reviews.existsByProductIdAndUserId("P1", "U1")).thenReturn(true);
        assertThatThrownBy(() -> service.create("U1", new ReviewCreateRequest("P1", (short) 5, "x", "y")))
                .isInstanceOf(BusinessException.class)
                .extracting(e -> ((BusinessException) e).getCode())
                .isEqualTo(ErrorCode.CONFLICT);
    }

    @Test
    void ratingRollupUpdatedAfterCreate() {
        when(reviews.existsByProductIdAndUserId("P1", "U1")).thenReturn(false);
        when(reviews.eligibleOrders("U1", "P1")).thenReturn(List.of("ORD-1"));
        service.create("U1", new ReviewCreateRequest("P1", (short) 5, "t", "b"));
        verify(products).save(argThat(p ->
                p.getRatingAvg().compareTo(new BigDecimal("4.50")) == 0 && p.getRatingCount() == 2));
    }
}
