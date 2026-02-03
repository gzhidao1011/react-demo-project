package com.example.auth.controller;

import com.example.api.common.Result;
import com.example.api.model.*;
import com.example.auth.service.AuthService;
import com.example.auth.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器：注册、登录、Token 刷新等，遵循 OAuth 2.0 标准
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private static final String CACHE_CONTROL_NO_STORE = "no-store";
    private static final String PRAGMA_NO_CACHE = "no-cache";

    private final AuthService authService;
    private final RateLimitService rateLimitService;

    @PostMapping("/register")
    public ResponseEntity<Result<RegisterResponse>> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_NO_STORE)
                .header(HttpHeaders.PRAGMA, PRAGMA_NO_CACHE)
                .body(Result.success(response));
    }

    @PostMapping("/login")
    public ResponseEntity<Result<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = getClientIpAddress(httpRequest);
        rateLimitService.checkRateLimit(ipAddress, null);
        LoginResponse response = authService.login(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_NO_STORE)
                .header(HttpHeaders.PRAGMA, PRAGMA_NO_CACHE)
                .body(Result.success(response));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<Result<LoginResponse>> verifyEmail(
            @Valid @RequestBody VerifyEmailRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = getClientIpAddress(httpRequest);
        rateLimitService.checkRateLimitForVerifyEmail(ipAddress);
        LoginResponse response = authService.verifyEmail(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_NO_STORE)
                .header(HttpHeaders.PRAGMA, PRAGMA_NO_CACHE)
                .body(Result.success(response));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<Result<Void>> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerification(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_NO_STORE)
                .header(HttpHeaders.PRAGMA, PRAGMA_NO_CACHE)
                .body(Result.success());
    }

    @PostMapping("/forgot-password")
    public ResponseEntity<Result<ForgotPasswordResponse>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = getClientIpAddress(httpRequest);
        rateLimitService.checkRateLimitForForgotPassword(ipAddress, request.getEmail());
        ForgotPasswordResponse response = authService.forgotPassword(request.getEmail());
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_NO_STORE)
                .header(HttpHeaders.PRAGMA, PRAGMA_NO_CACHE)
                .body(Result.success(response));
    }

    @PostMapping("/reset-password")
    public ResponseEntity<Result<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = getClientIpAddress(httpRequest);
        rateLimitService.checkRateLimitForResetPassword(ipAddress);
        authService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_NO_STORE)
                .header(HttpHeaders.PRAGMA, PRAGMA_NO_CACHE)
                .body(Result.success());
    }

    @PostMapping("/change-password")
    public ResponseEntity<Result<Void>> changePassword(
            @Valid @RequestBody ChangePasswordRequest request,
            Authentication authentication) {
        String userIdStr = authentication != null ? authentication.getName() : null;
        if (userIdStr == null || userIdStr.isEmpty()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        Long userId = Long.parseLong(userIdStr);
        authService.changePassword(userId, request);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_NO_STORE)
                .header(HttpHeaders.PRAGMA, PRAGMA_NO_CACHE)
                .body(Result.success());
    }

    @GetMapping("/me")
    public ResponseEntity<Result<UserInfo>> getCurrentUser(Authentication authentication) {
        String userIdStr = authentication != null ? authentication.getName() : null;
        if (userIdStr == null || userIdStr.isEmpty()) {
            return ResponseEntity.status(org.springframework.http.HttpStatus.UNAUTHORIZED).build();
        }
        Long userId = Long.parseLong(userIdStr);
        UserInfo userInfo = authService.getCurrentUser(userId);
        return ResponseEntity.ok(Result.success(userInfo));
    }

    @PostMapping("/refresh")
    public ResponseEntity<Result<LoginResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        LoginResponse response = authService.refreshToken(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_NO_STORE)
                .header(HttpHeaders.PRAGMA, PRAGMA_NO_CACHE)
                .body(Result.success(response));
    }

    @PostMapping("/logout")
    public ResponseEntity<Result<Void>> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_NO_STORE)
                .header(HttpHeaders.PRAGMA, PRAGMA_NO_CACHE)
                .body(Result.success());
    }

    private String getClientIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip != null ? ip : "unknown";
    }
}
