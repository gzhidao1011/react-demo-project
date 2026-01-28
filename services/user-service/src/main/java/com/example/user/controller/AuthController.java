package com.example.user.controller;

import com.example.api.common.Result;
import com.example.api.model.LoginRequest;
import com.example.api.model.LoginResponse;
import com.example.api.model.RegisterRequest;
import com.example.api.model.RefreshTokenRequest;
import com.example.user.service.AuthService;
import com.example.user.service.RateLimitService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.ResponseEntity;
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

    /**
     * 用户注册接口
     *
     * @param request 注册请求（邮箱、密码）
     * @return 登录响应（包含 Access Token、Refresh Token、用户信息）
     */
    @PostMapping("/register")
    public ResponseEntity<Result<LoginResponse>> register(@Valid @RequestBody RegisterRequest request) {
        LoginResponse response = authService.register(request);
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
        
        // 3. 执行登录（如果登录失败，AuthService 会抛出异常，限流计数已在 checkRateLimit 中增加）
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
