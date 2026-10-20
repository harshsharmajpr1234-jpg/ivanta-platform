package com.ivanta.security;

import com.ivanta.common.exception.BusinessException;
import com.ivanta.common.util.XssSanitizer;
import com.ivanta.storage.FileSecurityValidator;
import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class SecurityHardeningTest {

    private final FileSecurityValidator fileValidator = new FileSecurityValidator();

    @Test
    void xssSanitizer_stripsScriptsAndDangerousTags() {
        String dirty = "<script>alert('xss')</script>Hello <b>World</b><iframe src='bad.com'></iframe><img src='x' onerror='alert(1)'>";
        String clean = XssSanitizer.sanitize(dirty);

        assertThat(clean).doesNotContain("<script>");
        assertThat(clean).doesNotContain("</script>");
        assertThat(clean).doesNotContain("<iframe");
        assertThat(clean).doesNotContain("onerror=");
        assertThat(clean).contains("&lt;b&gt;World&lt;/b&gt;");
    }

    @Test
    void fileValidator_acceptsValidJpeg() {
        // JPEG magic bytes: FF D8 FF E0 ...
        byte[] validJpeg = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10, 0x4A, 0x46, 0x49, 0x46, 0x00, 0x01};
        MockMultipartFile file = new MockMultipartFile("file", "iphone17.jpg", "image/jpeg", validJpeg);

        fileValidator.validateImage(file); // should pass without exception
    }

    @Test
    void fileValidator_acceptsValidPng() {
        // PNG magic bytes: 89 50 4E 47 0D 0A 1A 0A ...
        byte[] validPng = new byte[]{(byte) 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, 0x00, 0x00, 0x00, 0x0D};
        MockMultipartFile file = new MockMultipartFile("file", "iphone17.png", "image/png", validPng);

        fileValidator.validateImage(file); // should pass without exception
    }

    @Test
    void fileValidator_rejectsDirectoryTraversal() {
        byte[] content = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
        MockMultipartFile file = new MockMultipartFile("file", "../../evil.jpg", "image/jpeg", content);

        assertThatThrownBy(() -> fileValidator.validateImage(file))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Dangerous filename");
    }

    @Test
    void fileValidator_rejectsDisallowedExtension() {
        byte[] content = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00};
        MockMultipartFile file = new MockMultipartFile("file", "evil.php", "image/jpeg", content);

        assertThatThrownBy(() -> fileValidator.validateImage(file))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Only JPG, PNG, and WebP");
    }

    @Test
    void fileValidator_rejectsSpoofedHeader() {
        // Extension is jpg, but content is arbitrary plain text / shell
        byte[] fakeContent = "echo 'hacked';".getBytes();
        MockMultipartFile file = new MockMultipartFile("file", "shell.jpg", "image/jpeg", fakeContent);

        assertThatThrownBy(() -> fileValidator.validateImage(file))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Corrupted or spoofed");
    }

    @Test
    void fileValidator_rejectsPolyglotWithMaliciousPayload() {
        // Valid JPEG header but embedded with malicious script payload
        byte[] polyglot = new byte[]{(byte) 0xFF, (byte) 0xD8, (byte) 0xFF, (byte) 0xE0, 0x00, 0x10,
                '<', 's', 'c', 'r', 'i', 'p', 't', '>', 'a', 'l', 'e', 'r', 't', '(', ')'};
        MockMultipartFile file = new MockMultipartFile("file", "polyglot.jpg", "image/jpeg", polyglot);

        assertThatThrownBy(() -> fileValidator.validateImage(file))
                .isInstanceOf(BusinessException.class)
                .hasMessageContaining("Malicious file content");
    }
}
