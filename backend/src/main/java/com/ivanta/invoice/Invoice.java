package com.ivanta.invoice;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

/**
 * Invoice header. One invoice per order (unique). The PDF is rendered by
 * InvoiceService and stored through the StorageProvider abstraction; totals
 * are snapshotted from the order at issue time and never recomputed.
 */
@Entity
@Table(name = "invoices")
@Getter @Setter
public class Invoice {
    @Id
    @Column(length = 20)
    private String id;                       // INV-YYYY-NNNNNN == invoice number

    @Column(name = "order_id", nullable = false, length = 20, unique = true)
    private String orderId;

    @Column(name = "pdf_key", nullable = false)
    private String pdfKey;

    @Column(nullable = false)
    private BigDecimal subtotal;

    @Column(name = "discount_total", nullable = false)
    private BigDecimal discountTotal = BigDecimal.ZERO;

    @Column(name = "tax_total", nullable = false)
    private BigDecimal taxTotal = BigDecimal.ZERO;

    @Column(name = "shipping_fee", nullable = false)
    private BigDecimal shippingFee = BigDecimal.ZERO;

    @Column(name = "grand_total", nullable = false)
    private BigDecimal grandTotal;

    @Column(name = "payment_method", length = 16)
    private String paymentMethod;

    @Column(name = "issued_at", nullable = false, updatable = false)
    private Instant issuedAt = Instant.now();

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (issuedAt == null) issuedAt = now;
        createdAt = now;
    }
}
