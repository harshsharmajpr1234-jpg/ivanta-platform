package com.ivanta.order;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;

@Entity
@Table(name = "orders")
@Getter @Setter
public class Order {
    @Id
    @Column(length = 20)
    private String id;                       // ORD-YYYY-NNNNNN

    @Column(name = "order_number", nullable = false, length = 24, unique = true)
    private String orderNumber;              // IVN-YYYYMMDD-NNNNNN (customer-facing)

    @Column(name = "user_id", nullable = false, length = 16)
    private String userId;

    @Column(nullable = false, length = 28)
    private String status = "PLACED";

    @Column(nullable = false)
    private BigDecimal subtotal;

    @Column(name = "discount_total", nullable = false)
    private BigDecimal discountTotal = BigDecimal.ZERO;

    @Column(name = "coupon_code", length = 40)
    private String couponCode;

    @Column(name = "coupon_discount", nullable = false)
    private BigDecimal couponDiscount = BigDecimal.ZERO;

    @Column(name = "tax_total", nullable = false)
    private BigDecimal taxTotal = BigDecimal.ZERO;

    @Column(name = "shipping_fee", nullable = false)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(name = "grand_total", nullable = false)
    private BigDecimal grandTotal;

    @Column(nullable = false, length = 3)
    private String currency = "INR";

    @Column(name = "payment_method", length = 16)
    private String paymentMethod;

    @Column(name = "payment_status", length = 24)
    private String paymentStatus;            // denormalised mirror: PENDING|PROCESSING|SUCCESS|FAILED|REFUNDED|PARTIALLY_REFUNDED

    @Column(name = "shipping_status", length = 24)
    private String shippingStatus = "PENDING"; // PENDING|PACKED|SHIPPED|IN_TRANSIT|OUT_FOR_DELIVERY|DELIVERED|CANCELLED

    @Column(name = "shipping_method_id", length = 16)
    private String shippingMethodId;

    @Column(name = "shipping_address_id", length = 16)
    private String shippingAddressId;

    @Column(name = "contact_email", length = 190)
    private String contactEmail;

    @Column(name = "contact_phone", length = 20)
    private String contactPhone;

    @Column(name = "customer_note", length = 400)
    private String customerNote;

    @Column(name = "cancellation_reason", length = 300)
    private String cancellationReason;

    @Column(name = "cancelled_by_type", length = 10)
    private String cancelledByType;          // CUSTOMER|ADMIN|SYSTEM

    @Column(name = "cancelled_by", length = 16)
    private String cancelledBy;

    @Column(name = "cancelled_at")
    private Instant cancelledAt;

    @Column(name = "placed_at", nullable = false)
    private Instant placedAt;

    @Column(name = "confirmed_at")
    private Instant confirmedAt;

    @Column(name = "shipped_at")
    private Instant shippedAt;

    @Column(name = "delivered_at")
    private Instant deliveredAt;

    @Column(name = "expected_delivery")
    private LocalDate expectedDelivery;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @Column(name = "updated_at", nullable = false, insertable = false, updatable = false)
    private Instant updatedAt;

    @Version
    @Column(nullable = false)
    private Integer version;
}
