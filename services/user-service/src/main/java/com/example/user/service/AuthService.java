package com.example.user.service;

import com.example.api.common.ResultCode;
import com.example.api.exception.BusinessException;
import com.example.api.model.LoginRequest;
import com.example.api.model.LoginResponse;
import com.example.api.model.RegisterRequest;
import com.example.api.model.RefreshTokenRequest;
import com.example.user.entity.UserEntity;
import com.example.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Collections;

/**
 * 认证服务类
 * 负责用户注册、登录、Token 刷新等认证相关业务逻辑
 */
@Service
@RequiredArgsConstructor
public class AuthService {
    
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordPolicyService passwordPolicyService;
    private final TokenRotationService tokenRotationService;
    
    @Value("${jwt.access-token-expiration:1800}")
    private long accessTokenExpiration;
    
    @Value("${jwt.refresh-token-expiration:604800}")
    private long refreshTokenExpiration;
    
    @Value("${jwt.remember-me-expiration:7776000}")
    private long rememberMeExpiration;
    
    /**
     * 用户注册
     * 
     * @param request 注册请求
     * @return 登录响应（包含 Token 和用户信息）
     */
    @Transactional
    public LoginResponse register(RegisterRequest request) {
        // 1. 验证邮箱唯一性
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BusinessException(ResultCode.EMAIL_ALREADY_EXISTS);
        }
        
        // 2. 验证密码策略
        PasswordPolicyService.PasswordValidationResult validationResult = 
            passwordPolicyService.validatePassword(request.getPassword());
        if (!validationResult.isValid()) {
            throw new BusinessException(ResultCode.PASSWORD_POLICY_VIOLATION, validationResult.getErrorMessage());
        }
        
        // 3. 创建用户
        UserEntity user = new UserEntity();
        user.setEmail(request.getEmail());
        user.setName(request.getEmail().split("@")[0]); // 默认使用邮箱前缀作为用户名
        // 密码加密存储
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        
        UserEntity savedUser = userRepository.save(user);
        
        // 4. 生成 JWT Token
        String accessToken = jwtService.generateAccessToken(
            savedUser.getId().toString(),
            savedUser.getName() != null ? savedUser.getName() : savedUser.getEmail(),
            Collections.emptyList() // 默认无角色，后续可扩展
        );
        String refreshToken = jwtService.generateRefreshToken(
            savedUser.getId().toString(),
            null // 设备ID，后续添加设备管理时使用
        );
        
        // 5. 存储 Refresh Token 到 Redis
        tokenRotationService.storeRefreshToken(
            savedUser.getId().toString(),
            null,
            refreshToken
        );
        
        // 6. 构建响应（遵循 OAuth 2.0 格式）
        return LoginResponse.builder()
            .accessToken(accessToken)
            .tokenType("Bearer")
            .expiresIn(accessTokenExpiration)
            .refreshToken(refreshToken)
            .scope("read write")
            .user(LoginResponse.UserInfo.builder()
                .id(savedUser.getId().toString())
                .email(savedUser.getEmail())
                .username(savedUser.getName() != null ? savedUser.getName() : savedUser.getEmail())
                .emailVerified(false) // 默认未验证
                .build())
            .build();
    }
    
    /**
     * 用户登录
     * 遵循 OAuth 2.0 Password Grant 模式
     * 
     * @param request 登录请求
     * @return 登录响应（包含 Token 和用户信息）
     */
    public LoginResponse login(LoginRequest request) {
        // 1. 查找用户
        UserEntity user = userRepository.findByEmail(request.getEmail())
            .orElseThrow(() -> new BusinessException(ResultCode.INVALID_CREDENTIALS));
        
        // 2. 验证密码（不明确提示是邮箱还是密码错误，防止用户枚举攻击）
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(ResultCode.INVALID_CREDENTIALS);
        }
        
        // 3. 根据 rememberMe 设置 Token 有效期
        long accessTokenExp = request.getRememberMe() != null && request.getRememberMe() 
            ? rememberMeExpiration 
            : accessTokenExpiration;
        long refreshTokenExp = request.getRememberMe() != null && request.getRememberMe() 
            ? rememberMeExpiration 
            : refreshTokenExpiration;
        
        // 注意：JwtService 使用配置的过期时间，这里需要动态设置
        // 为了简化，先使用默认配置，后续可以扩展 JwtService 支持自定义过期时间
        
        // 4. 生成 JWT Token
        String accessToken = jwtService.generateAccessToken(
            user.getId().toString(),
            user.getName() != null ? user.getName() : user.getEmail(),
            Collections.emptyList() // 默认无角色，后续可扩展
        );
        String refreshToken = jwtService.generateRefreshToken(
            user.getId().toString(),
            null // 设备ID，后续添加设备管理时使用
        );
        
        // 5. 存储 Refresh Token 到 Redis
        tokenRotationService.storeRefreshToken(
            user.getId().toString(),
            null,
            refreshToken
        );
        
        // 6. 构建响应（遵循 OAuth 2.0 格式）
        return LoginResponse.builder()
            .accessToken(accessToken)
            .tokenType("Bearer")
            .expiresIn(accessTokenExp)
            .refreshToken(refreshToken)
            .scope("read write")
            .user(LoginResponse.UserInfo.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .username(user.getName() != null ? user.getName() : user.getEmail())
                .emailVerified(false) // 默认未验证，后续可扩展
                .build())
            .build();
    }
    
    /**
     * 刷新 Token
     * 遵循 OAuth 2.0 Refresh Token Grant 模式
     * 
     * @param request 刷新 Token 请求
     * @return 登录响应（包含新的 Token）
     */
    public LoginResponse refreshToken(RefreshTokenRequest request) {
        try {
            // 1. 解析和验证 Refresh Token
            io.jsonwebtoken.Claims claims = jwtService.parseToken(request.getRefreshToken());
            
            // 2. 验证 Token 类型
            String tokenType = claims.get("type", String.class);
            if (!"refresh".equals(tokenType)) {
                throw new BusinessException(ResultCode.REFRESH_TOKEN_INVALID);
            }
            
            // 3. 获取用户ID和设备ID
            String userId = claims.getSubject();
            String deviceId = claims.get("deviceId", String.class);
            
            // 4. 检测 Token 重用（如果旧 Token 被重用，撤销所有 Token）
            if (tokenRotationService.checkTokenReuse(request.getRefreshToken())) {
                // Token 被重用，撤销所有该用户的 Token
                tokenRotationService.revokeToken(request.getRefreshToken());
                throw new BusinessException(ResultCode.REFRESH_TOKEN_REUSED);
            }
            
            // 5. 验证 Refresh Token 是否有效（从 Redis 查询）
            if (!tokenRotationService.validateRefreshToken(userId, deviceId, request.getRefreshToken())) {
                throw new BusinessException(ResultCode.REFRESH_TOKEN_INVALID);
            }
            
            // 6. 获取用户信息
            UserEntity user = userRepository.findById(Long.parseLong(userId))
                .orElseThrow(() -> new BusinessException(ResultCode.USER_NOT_FOUND));
            
            // 7. 生成新的 Access Token 和 Refresh Token
            String accessToken = jwtService.generateAccessToken(
                user.getId().toString(),
                user.getName() != null ? user.getName() : user.getEmail(),
                Collections.emptyList()
            );
            String newRefreshToken = jwtService.generateRefreshToken(
                user.getId().toString(),
                deviceId
            );
            
            // 8. 标记旧 Token 已使用（加入黑名单，删除 Redis 中的旧 Token）
            tokenRotationService.markTokenAsUsed(userId, deviceId, request.getRefreshToken());
            
            // 9. 存储新 Refresh Token 到 Redis
            tokenRotationService.storeRefreshToken(userId, deviceId, newRefreshToken);
            
            // 10. 构建响应
            return LoginResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(accessTokenExpiration)
                .refreshToken(newRefreshToken)
                .scope("read write")
                .user(LoginResponse.UserInfo.builder()
                    .id(user.getId().toString())
                    .email(user.getEmail())
                    .username(user.getName() != null ? user.getName() : user.getEmail())
                    .emailVerified(false)
                    .build())
                .build();
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            throw new BusinessException(ResultCode.TOKEN_EXPIRED);
        } catch (io.jsonwebtoken.JwtException e) {
            throw new BusinessException(ResultCode.REFRESH_TOKEN_INVALID);
        }
    }
    
    /**
     * 用户登出
     * 撤销 Refresh Token，将其加入黑名单
     * 
     * @param refreshToken Refresh Token 字符串
     */
    public void logout(String refreshToken) {
        // 撤销 Token（加入黑名单）
        tokenRotationService.revokeToken(refreshToken);
    }
}
