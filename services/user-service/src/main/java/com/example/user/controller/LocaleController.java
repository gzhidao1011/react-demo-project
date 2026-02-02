package com.example.user.controller;

import com.example.api.common.Result;
import com.example.api.common.ResultCode;
import com.example.api.exception.BusinessException;
import com.example.api.model.LocaleUpdateRequest;
import jakarta.servlet.http.Cookie;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.Arrays;
import java.util.List;
import java.util.Map;

/**
 * 用户 Locale 控制器
 * 已登录用户的 locale 持久化，通过 Cookie 存储
 *
 * @see .cursor/plans/多语言功能计划/locale-cookie-backend.md
 */
@RestController
@RequestMapping("/api/user")
public class LocaleController {

    private static final String COOKIE_NAME = "locale";
    private static final String DEFAULT_LOCALE = "zh";
    private static final int COOKIE_MAX_AGE = 31536000; // 1 年

    /** 支持的 locale 白名单 */
    private static final List<String> LOCALE_WHITELIST = Arrays.asList("zh", "en", "ja", "ko");

    @PatchMapping("/locale")
    public ResponseEntity<Result<Map<String, String>>> updateLocale(
            @Valid @RequestBody LocaleUpdateRequest request,
            HttpServletResponse response,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }

        String locale = request.getLocale().toLowerCase();
        if (locale.contains("-")) {
            locale = locale.split("-")[0];
        }
        if (!LOCALE_WHITELIST.contains(locale)) {
            throw new BusinessException(ResultCode.INVALID_LOCALE);
        }

        Cookie cookie = new Cookie(COOKIE_NAME, locale);
        cookie.setPath("/");
        cookie.setMaxAge(COOKIE_MAX_AGE);
        cookie.setHttpOnly(false);
        cookie.setSecure(false); // 生产环境应设为 true
        cookie.setAttribute("SameSite", "Lax");
        response.addCookie(cookie);

        return ResponseEntity.ok()
                .body(Result.success(Map.of("locale", locale)));
    }

    @GetMapping("/locale")
    public ResponseEntity<Result<Map<String, String>>> getLocale(
            HttpServletRequest request,
            Authentication authentication) {
        if (authentication == null || !authentication.isAuthenticated()) {
            throw new BusinessException(ResultCode.UNAUTHORIZED);
        }

        String locale = DEFAULT_LOCALE;
        Cookie[] cookies = request.getCookies();
        if (cookies != null) {
            for (Cookie cookie : cookies) {
                if (COOKIE_NAME.equals(cookie.getName())) {
                    String value = cookie.getValue();
                    if (value != null && LOCALE_WHITELIST.contains(value.toLowerCase())) {
                        locale = value.toLowerCase();
                    }
                    break;
                }
            }
        }

        return ResponseEntity.ok()
                .body(Result.success(Map.of("locale", locale)));
    }
}
