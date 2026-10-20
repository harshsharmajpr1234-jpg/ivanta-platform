package com.ivanta.order;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.Setter;

import java.time.Instant;

/** Generated/stored documents attached to an order (invoice PDFs, packing slips...). */
@Entity
@Table(name = "order_documents")
@Getter @Setter
public class OrderDocument {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "order_id", nullable = false, length = 20)
    private String orderId;

    @Column(name = "doc_type", nullable = false, length = 20)
    private String docType;                  // INVOICE|PACKING_SLIP|OTHER

    @Column(name = "storage_key", nullable = false)
    private String storageKey;

    @Column(name = "file_name", nullable = false, length = 200)
    private String fileName;

    @Column(name = "mime_type", nullable = false, length = 80)
    private String mimeType = "application/pdf";

    @Column(name = "created_by", length = 16)
    private String createdBy;

    @Column(name = "created_at", updatable = false)
    private Instant createdAt = Instant.now();

    @PrePersist
    void prePersist() { createdAt = Instant.now(); }
}
