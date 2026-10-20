package com.ivanta.common.util;

import java.util.regex.Pattern;

/**
 * XSS & HTML Injection Sanitizer:
 * Cleans user-submitted strings before storing or reflecting them.
 * Neutralizes <script>, <iframe>, event attributes (onload, onerror, etc.), and javascript: schemes.
 */
public final class XssSanitizer {

    private static final Pattern SCRIPT_PATTERN = Pattern.compile("(?i)<script.*?>.*?</script.*?>", Pattern.DOTALL);
    private static final Pattern SCRIPT_START = Pattern.compile("(?i)<script.*?>", Pattern.DOTALL);
    private static final Pattern SCRIPT_END = Pattern.compile("(?i)</script.*?>", Pattern.DOTALL);
    private static final Pattern JAVASCRIPT_SCHEME = Pattern.compile("(?i)javascript:", Pattern.DOTALL);
    private static final Pattern VBSCRIPT_SCHEME = Pattern.compile("(?i)vbscript:", Pattern.DOTALL);
    private static final Pattern ON_EVENTS = Pattern.compile("(?i)\\bon\\w+\\s*=", Pattern.DOTALL);
    private static final Pattern IFRAME_PATTERN = Pattern.compile("(?i)<iframe.*?>.*?</iframe.*?>", Pattern.DOTALL);
    private static final Pattern OBJECT_PATTERN = Pattern.compile("(?i)<(object|embed|applet).*?>.*?</(object|embed|applet).*?>", Pattern.DOTALL);

    private XssSanitizer() {}

    public static String sanitize(String input) {
        if (input == null || input.isBlank()) {
            return input;
        }

        String cleaned = input;
        cleaned = SCRIPT_PATTERN.matcher(cleaned).replaceAll("");
        cleaned = SCRIPT_START.matcher(cleaned).replaceAll("");
        cleaned = SCRIPT_END.matcher(cleaned).replaceAll("");
        cleaned = IFRAME_PATTERN.matcher(cleaned).replaceAll("");
        cleaned = OBJECT_PATTERN.matcher(cleaned).replaceAll("");
        cleaned = JAVASCRIPT_SCHEME.matcher(cleaned).replaceAll("");
        cleaned = VBSCRIPT_SCHEME.matcher(cleaned).replaceAll("");
        cleaned = ON_EVENTS.matcher(cleaned).replaceAll("");

        // Escape dangerous raw characters '<' and '>' to prevent HTML tag injection in plain text
        cleaned = cleaned.replace("<", "&lt;").replace(">", "&gt;");

        return cleaned.trim();
    }
}
