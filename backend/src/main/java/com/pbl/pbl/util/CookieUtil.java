package com.pbl.pbl.util;

import org.springframework.http.ResponseCookie;

public final class CookieUtil {
    private CookieUtil() {
    }

    public static ResponseCookie createRefreshCookie(String name, String value, long maxAgeSeconds, boolean secure) {
        return baseBuilder(name, value, secure)
                .maxAge(maxAgeSeconds)
                .build();
    }

    public static ResponseCookie deleteCookie(String name, boolean secure) {
        return baseBuilder(name, "", secure)
                .maxAge(0)
                .build();
    }

    private static ResponseCookie.ResponseCookieBuilder baseBuilder(String name, String value, boolean secure) {
        // SameSite=Lax keeps cookie on top-level navigations while mitigating CSRF; adjust if needed.
        return ResponseCookie.from(name, value)
                .httpOnly(true)
                .secure(secure)
                .path("/")
                .sameSite("Lax");
    }
}
