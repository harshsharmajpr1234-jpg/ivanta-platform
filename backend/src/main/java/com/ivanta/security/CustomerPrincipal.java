package com.ivanta.security;

/** Authenticated customer (seller) identity resolved from the HTTP-only session cookie. */
public record CustomerPrincipal(String userId, String name, String email) { }
