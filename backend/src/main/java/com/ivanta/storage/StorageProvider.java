package com.ivanta.storage;

/**
 * Storage abstraction (§20/§43): business logic stores/retrieves by opaque key.
 * Implementations: local disk (dev), S3, Cloudinary (future) — swap via
 * `ivanta.storage.provider` without touching services.
 */
public interface StorageProvider {

    /** Stores bytes and returns the provider-agnostic key persisted in the DB. */
    String store(String folder, String filename, byte[] content, String contentType);

    byte[] load(String storageKey);

    void delete(String storageKey);

    String providerName();
}
