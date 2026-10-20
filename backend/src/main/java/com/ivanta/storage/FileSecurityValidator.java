package com.ivanta.storage;

import com.ivanta.common.api.ErrorCode;
import com.ivanta.common.exception.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.Locale;
import java.util.Set;

/**
 * Enterprise File Upload Security Validator:
 * - Anti-path traversal (no "..", no null bytes, no path separators)
 * - Strict extension allowlisting (.jpg, .jpeg, .png, .webp)
 * - Real binary Magic Bytes (file header signature) validation
 * - Anti-web shell & malicious script payload detection in binary
 * - Strict 5MB file size limit
 */
@Slf4j
@Component
public class FileSecurityValidator {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of("jpg", "jpeg", "png", "webp");

    // Magic bytes signatures
    private static final byte[] JPEG_MAGIC = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF};
    private static final byte[] PNG_MAGIC = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A};
    private static final byte[] RIFF_MAGIC = new byte[]{0x52, 0x49, 0x46, 0x46}; // 'R', 'I', 'F', 'F'
    private static final byte[] WEBP_MAGIC = new byte[]{0x57, 0x45, 0x42, 0x50}; // 'W', 'E', 'B', 'P'

    private static final String[] DANGEROUS_PAYLOADS = new String[]{
            "<?php", "<script", "javascript:", "eval(", "base64_decode", "<html", "<svg"
    };

    public void validateImage(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "No file provided");
        }

        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "File size exceeds maximum allowed limit of 5MB");
        }

        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Invalid filename");
        }

        // 1. Path traversal & null byte prevention
        if (originalFilename.contains("..") || originalFilename.contains("/") ||
                originalFilename.contains("\\") || originalFilename.contains("\0")) {
            log.warn("[SECURITY] Directory traversal attempt detected in upload: {}", originalFilename);
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Dangerous filename rejected");
        }

        // 2. Strict extension check
        int dotIdx = originalFilename.lastIndexOf('.');
        if (dotIdx == -1 || dotIdx == originalFilename.length() - 1) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "File must have an image extension (.jpg, .jpeg, .png, .webp)");
        }
        String ext = originalFilename.substring(dotIdx + 1).toLowerCase(Locale.ROOT);
        if (!ALLOWED_EXTENSIONS.contains(ext)) {
            log.warn("[SECURITY] Upload with disallowed extension attempted: {}", ext);
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Only JPG, PNG, and WebP images are permitted");
        }

        // 3. Read content bytes and verify Magic Bytes signature
        byte[] bytes;
        try {
            bytes = file.getBytes();
        } catch (Exception e) {
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Could not read file stream");
        }

        if (!isValidImageHeader(bytes, ext)) {
            log.warn("[SECURITY] File header magic bytes do not match declared extension {}: {}", ext, originalFilename);
            throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Corrupted or spoofed image file rejected");
        }

        // 4. Content payload scan (reject web shells / scripts hidden inside polyglot files)
        String sampleContent = new String(bytes, 0, Math.min(bytes.length, 4096), StandardCharsets.ISO_8859_1).toLowerCase(Locale.ROOT);
        for (String danger : DANGEROUS_PAYLOADS) {
            if (sampleContent.contains(danger)) {
                log.warn("[SECURITY] Malicious payload pattern '{}' detected in uploaded file {}", danger, originalFilename);
                throw new BusinessException(ErrorCode.VALIDATION_ERROR, "Malicious file content detected and blocked");
            }
        }
    }

    private boolean isValidImageHeader(byte[] bytes, String ext) {
        if (bytes == null || bytes.length < 12) return false;

        return switch (ext) {
            case "jpg", "jpeg" -> startsWith(bytes, JPEG_MAGIC);
            case "png" -> startsWith(bytes, PNG_MAGIC);
            case "webp" -> startsWith(bytes, RIFF_MAGIC) &&
                    bytes[8] == WEBP_MAGIC[0] && bytes[9] == WEBP_MAGIC[1] &&
                    bytes[10] == WEBP_MAGIC[2] && bytes[11] == WEBP_MAGIC[3];
            default -> false;
        };
    }

    private boolean startsWith(byte[] data, byte[] prefix) {
        if (data.length < prefix.length) return false;
        for (int i = 0; i < prefix.length; i++) {
            if (data[i] != prefix[i]) return false;
        }
        return true;
    }
}
