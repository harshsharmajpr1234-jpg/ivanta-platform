package com.ivanta.storage;

import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.api.ErrorCode;
import com.ivanta.config.IvantaProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

/** Development provider: writes under ivanta.storage.local-dir (default ./uploads). */
@Slf4j
@Component
@RequiredArgsConstructor
@ConditionalOnProperty(name = "ivanta.storage.provider", havingValue = "local", matchIfMissing = true)
public class LocalStorageProvider implements StorageProvider {

    private final IvantaProperties props;

    @Override
    public String store(String folder, String filename, byte[] content, String contentType) {
        try {
            Path dir = Path.of(props.getStorage().getLocalDir(), folder);
            Files.createDirectories(dir);
            String safe = UUID.randomUUID() + "-" + filename.replaceAll("[^a-zA-Z0-9._-]", "_");
            Files.write(dir.resolve(safe), content);
            return folder + "/" + safe;
        } catch (IOException e) {
            log.error("Local storage write failed", e);
            throw new BusinessException(ErrorCode.INTERNAL_ERROR, "Could not store file");
        }
    }

    @Override
    public byte[] load(String storageKey) {
        try {
            return Files.readAllBytes(Path.of(props.getStorage().getLocalDir()).resolve(storageKey));
        } catch (IOException e) {
            throw new BusinessException(ErrorCode.NOT_FOUND, "File not found");
        }
    }

    @Override
    public void delete(String storageKey) {
        try {
            Files.deleteIfExists(Path.of(props.getStorage().getLocalDir()).resolve(storageKey));
        } catch (IOException e) {
            log.warn("Could not delete {}", storageKey);
        }
    }

    @Override
    public String providerName() { return "local"; }
}
