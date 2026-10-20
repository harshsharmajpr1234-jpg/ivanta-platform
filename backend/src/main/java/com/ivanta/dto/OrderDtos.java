package com.ivanta.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

import java.math.BigDecimal;
import java.util.List;

/** Order + checkout DTOs (§22/§23/§24). */
public final class OrderDtos {
    private OrderDtos() { }

    public record PlaceOrderRequest(@NotBlank String addressId,
                                    @NotBlank String shippingMethodId,
                                    String couponCode,
                                    @NotBlank @Pattern(regexp = "UPI|CARD|NETBANKING|WALLET|COD",
                                            message = "paymentMethod must be UPI|CARD|NETBANKING|WALLET|COD") String paymentMethod,
                                    String customerNote) { }

    public record OrderItemPreview(String productId, String name, String variantName, String imageKey,
                                   int quantity, BigDecimal unitPrice, BigDecimal lineTotal) { }

    public record CheckoutPreview(List<OrderItemPreview> items, int itemCount,
                                  BigDecimal subtotal, BigDecimal couponDiscount, String couponCode,
                                  BigDecimal taxTotal, BigDecimal shippingFee, BigDecimal grandTotal,
                                  boolean serviceable, String serviceabilityMessage,
                                  UserDtos.AddressView address,
                                  List<com.ivanta.location.dto.LocationDtos.ShippingMethodOption> shippingMethods,
                                  List<String> paymentMethods,
                                  CouponDtos.ValidationResult coupon) { }

    public record OrderItemView(String id, String productId, String productName, String productSlug,
                                String variantId, String variantName, String color, String storage,
                                String sku, String imageKey,
                                int quantity, BigDecimal unitPrice, BigDecimal discount,
                                BigDecimal taxAmount, BigDecimal finalPrice) { }

    public record OrderSummary(String id, String orderNumber, String placedAt, String status,
                               String paymentStatus, String shippingStatus, BigDecimal grandTotal,
                               String paymentMethod, int itemCount, String primaryName,
                               String primaryImage, String expectedDelivery, String customerName) { }

    public record StatusHistoryView(String previousStatus, String newStatus, String changedByType,
                                    String changedBy, String reason, String at) { }

    public record TimelineEvent(String type, String status, String description, String at) { }

    public record NoteView(Long id, String note, String addedByType, String addedBy,
                           String visibility, String createdAt) { }

    public record OrderDetail(String id, String orderNumber, String userId, String customerName,
                              String placedAt, String status,
                              BigDecimal subtotal, BigDecimal discountTotal, String couponCode,
                              BigDecimal couponDiscount, BigDecimal taxTotal, BigDecimal shippingFee,
                              BigDecimal grandTotal, String currency, String paymentMethod, String paymentStatus,
                              String shippingStatus, String shippingMethodName,
                              String expectedDelivery, String cancellationReason,
                              String contactEmail, String contactPhone, String customerNote,
                              String confirmedAt, String shippedAt, String deliveredAt, String cancelledAt,
                              Boolean returnEligible, String invoiceId,
                              List<OrderItemView> items, UserDtos.AddressView address,
                              List<StatusHistoryView> history, List<TimelineEvent> timeline,
                              List<NoteView> notes) { }

    public record StatusUpdateRequest(@NotBlank String status, String reason) { }

    public record CancelRequest(String reason) { }

    public record NoteRequest(@NotBlank @jakarta.validation.constraints.Size(max = 1000) String note) { }
}
