package com.example.user.controller;

import com.example.api.common.Result;
import com.example.api.model.ChangePasswordRequest;
import com.example.api.model.ForgotPasswordRequest;
import com.example.api.model.ForgotPasswordResponse;
import com.example.api.model.LoginRequest;
import com.example.api.model.LoginResponse;
import com.example.api.model.RegisterRequest;
import com.example.api.model.RegisterResponse;
import com.example.api.model.RefreshTokenRequest;
import com.example.api.model.ResendVerificationRequest;
import com.example.api.model.ResetPasswordRequest;
import com.example.api.model.UserInfo;
import com.example.api.model.VerifyEmailRequest;
import com.example.user.service.AuthService;
import com.example.user.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 * 遵循 OAuth 2.0 标准，实现注册、登录、Token 刷新等功能
 * Token 响应符合 RFC 6749 §5.1：返回 Cache-Control: no-store 防止客户端或中间层缓存 Token
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    /** OAuth 2.0 Token 响应安全头：禁止缓存 Token（RFC 6749、RFC 6750） */
    private static final String CACHE_CONTROL_NO_STORE = "no-store";
    private static final String PRAGMA_NO_CACHE = "no-cache";

    private final AuthService authService;
    private final RateLimitService rateLimitService;
    private final com.example.user.service.PasswordResetService passwordResetService;

    /**
     * 用户注册接口（邮箱验证模式）
     * 注册后不返回 token，发送验证邮件，返回 RegisterResponse
     *
     * @param request 注册请求（邮箱、密码）
     * @return 注册响应（message、email，无 token）
     */
    @PostMapping("/register")
    public ResponseEntity<Result<RegisterResponse>> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = authService.register(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_NO_STORE)
                .header(HttpHeaders.PRAGMA, PRAGMA_NO_CACHE)
                .body(Result.success(response));
    }

    /**
     * 用户登录接口
     * 遵循 OAuth 2.0 Password Grant 模式
     * 
     * 限流保护：在登录前检查 IP 和用户限流
     *
     * @param request 登录请求（邮箱、密码）
     * @param httpRequest HTTP 请求（用于获取 IP 地址）
     * @return 登录响应（包含 Access Token、Refresh Token、用户信息）
     */
    @PostMapping("/login")
    public ResponseEntity<Result<LoginResponse>> login(
            @Valid @RequestBody LoginRequest request,
            HttpServletRequest httpRequest) {
        // 1. 获取客户端 IP 地址
        String ipAddress = getClientIpAddress(httpRequest);
        
        // 2. 检查限流（在登录前检查，防止暴力破解）
        // 注意：这里先检查限流，如果超过限制会抛出异常
        // 登录成功后，如果之前有失败记录，计数会在下次登录时自动过期
        rateLimitService.checkRateLimit(ipAddress, null);
        
        // 3. 执行登录（如果登录失败，AuthService 会抛出异常）
        LoginResponse response = authService.login(request);
        
        // 4. 登录成功，返回响应
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_NO_STORE)
                .header(HttpHeaders.PRAGMA, PRAGMA_NO_CACHE)
                .body(Result.success(response));
    }
    
    /**
     * 获取客户端真实 IP 地址
     * 考虑代理和负载均衡的情况
     * 
     * @param request HTTP 请求
     * @return 客户端 IP 地址
     */
    private String getClientIpAddress(HttpServletRequest request) {
        String ip = request.getHeader("X-Forwarded-For");
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("X-Real-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getHeader("WL-Proxy-Client-IP");
        }
        if (ip == null || ip.isEmpty() || "unknown".equalsIgnoreCase(ip)) {
            ip = request.getRemoteAddr();
        }
        
        // X-Forwarded-For 可能包含多个 IP，取第一个
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        
        return ip != null ? ip : "unknown";
    }

    /**
     * 验证邮箱接口
     * 限流保护：每 IP 每小时最多 N 次，防暴力枚举 token
     *
     * @param request 验证请求（含 token）
     * @param httpRequest HTTP 请求（用于获取 IP 地址）
     * @return 登录响应（包含 Access Token、Refresh Token、用户信息）
     */
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

    /**
     * 重新发送验证邮件接口
     * 用户枚举防护：无论邮箱是否存在均返回 200 + 相同成功消息
     *
     * @param request 请求（含 email）
     * @return 成功响应
     */
    @PostMapping("/resend-verification")
    public ResponseEntity<Result<Void>> resendVerification(@Valid @RequestBody ResendVerificationRequest request) {
        authService.resendVerification(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_NO_STORE)
                .header(HttpHeaders.PRAGMA, PRAGMA_NO_CACHE)
                .body(Result.success());
    }

    /**
     * 忘记密码接口
     * 用户枚举防护：无论邮箱是否存在均返回 200 + 相同成功消息
     * 限流保护：每 IP 每小时 N 次、每邮箱每小时 M 次
     *
     * @param request 请求（含 email）
     * @param httpRequest HTTP 请求（用于获取 IP 地址）
     * @return 成功响应
     */
    @PostMapping("/forgot-password")
    public ResponseEntity<Result<ForgotPasswordResponse>> forgotPassword(
            @Valid @RequestBody ForgotPasswordRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = getClientIpAddress(httpRequest);
        rateLimitService.checkRateLimitForForgotPassword(ipAddress, request.getEmail());
        ForgotPasswordResponse response = passwordResetService.forgotPassword(request.getEmail());
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_NO_STORE)
                .header(HttpHeaders.PRAGMA, PRAGMA_NO_CACHE)
                .body(Result.success(response));
    }

    /**
     * 重置密码接口
     * 限流保护：每 IP 每小时 N 次（防暴力枚举 token）
     * 幂等性：同一 token 重复提交，首次成功后续返回 PASSWORD_RESET_TOKEN_INVALID
     *
     * @param request 请求（含 token、newPassword）
     * @param httpRequest HTTP 请求（用于获取 IP 地址）
     * @return 成功响应
     */
    @PostMapping("/reset-password")
    public ResponseEntity<Result<Void>> resetPassword(
            @Valid @RequestBody ResetPasswordRequest request,
            HttpServletRequest httpRequest) {
        String ipAddress = getClientIpAddress(httpRequest);
        rateLimitService.checkRateLimitForResetPassword(ipAddress);
        passwordResetService.resetPassword(request.getToken(), request.getNewPassword());
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_NO_STORE)
                .header(HttpHeaders.PRAGMA, PRAGMA_NO_CACHE)
                .body(Result.success());
    }

    /**
     * 修改密码接口
     * 需 JWT 认证，需当前密码验证
     *
     * @param request 修改密码请求（当前密码、新密码）
     * @param authentication 认证信息（由 JwtAuthFilter 注入）
     * @return 成功响应
     */
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

    /**
     * 获取当前用户信息接口
     * 需 JWT 认证，从 Authorization: Bearer &lt;token&gt; 提取用户身份
     *
     * @param authentication 认证信息（由 JwtAuthFilter 注入）
     * @return 用户信息（id、email、username、emailVerified、createdAt 等）
     */
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

    /**
     * 刷新 Token 接口
     * 遵循 OAuth 2.0 Refresh Token Grant 模式
     *
     * @param request 刷新 Token 请求
     * @return 登录响应（包含新的 Token）
     */
    @PostMapping("/refresh")
    public ResponseEntity<Result<LoginResponse>> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        LoginResponse response = authService.refreshToken(request);
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_NO_STORE)
                .header(HttpHeaders.PRAGMA, PRAGMA_NO_CACHE)
                .body(Result.success(response));
    }
    
    /**
     * 用户登出接口
     * 撤销 Refresh Token，将其加入黑名单
     *
     * @param request 刷新 Token 请求（包含要撤销的 Refresh Token）
     * @return 成功响应
     */
    @PostMapping("/logout")
    public ResponseEntity<Result<Void>> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok()
                .header(HttpHeaders.CACHE_CONTROL, CACHE_CONTROL_NO_STORE)
                .header(HttpHeaders.PRAGMA, PRAGMA_NO_CACHE)
                .body(Result.success());
    }
}
