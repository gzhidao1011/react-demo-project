package com.example.user.controller;

import com.example.api.common.Result;
import com.example.api.model.LoginRequest;
import com.example.api.model.LoginResponse;
import com.example.api.model.RegisterRequest;
import com.example.api.model.RefreshTokenRequest;
import com.example.user.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

/**
 * 认证控制器
 * 遵循 OAuth 2.0 标准，实现注册、登录、Token 刷新等功能
 */
@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    
    private final AuthService authService;
    
    /**
     * 用户注册接口
     * 
     * @param request 注册请求（邮箱、密码）
     * @return 登录响应（包含 Access Token、Refresh Token、用户信息）
     */
    @PostMapping("/register")
    public Result<LoginResponse> register(@Valid @RequestBody RegisterRequest request) {
        LoginResponse response = authService.register(request);
        return Result.success(response);
    }
    
    /**
     * 用户登录接口
     * 遵循 OAuth 2.0 Password Grant 模式
     * 
     * @param request 登录请求（邮箱、密码、记住我）
     * @return 登录响应（包含 Access Token、Refresh Token、用户信息）
     */
    @PostMapping("/login")
    public Result<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = authService.login(request);
        return Result.success(response);
    }
    
    /**
     * 刷新 Token 接口
     * 遵循 OAuth 2.0 Refresh Token Grant 模式
     * 
     * @param request 刷新 Token 请求
     * @return 登录响应（包含新的 Token）
     */
    @PostMapping("/refresh")
    public Result<LoginResponse> refreshToken(@Valid @RequestBody RefreshTokenRequest request) {
        LoginResponse response = authService.refreshToken(request);
        return Result.success(response);
    }
    
    /**
     * 用户登出接口
     * 撤销 Refresh Token，将其加入黑名单
     * 
     * @param request 刷新 Token 请求（包含要撤销的 Refresh Token）
     * @return 成功响应
     */
    @PostMapping("/logout")
    public Result<Void> logout(@Valid @RequestBody RefreshTokenRequest request) {
        authService.logout(request.getRefreshToken());
        return Result.success();
    }
}
