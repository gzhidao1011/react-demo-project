package com.example.user.service;

import com.example.api.common.ResultCode;
import com.example.api.exception.BusinessException;
import com.example.api.model.ChangePasswordRequest;
import com.example.api.model.LoginRequest;
import com.example.api.model.LoginResponse;
import com.example.api.model.RegisterRequest;
import com.example.api.model.RegisterResponse;
import com.example.api.model.RefreshTokenRequest;
import com.example.api.model.ResendVerificationRequest;
import com.example.api.model.UserInfo;
import com.example.api.model.VerifyEmailRequest;
import com.example.user.entity.UserEntity;
import com.example.user.mapper.UserMapper;
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
    
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final PasswordPolicyService passwordPolicyService;
    private final TokenRotationService tokenRotationService;
    private final EmailVerificationService emailVerificationService;
    
    @Value("${jwt.access-token-expiration:1800}")
    private long accessTokenExpiration;
    
    @Value("${jwt.refresh-token-expiration:604800}")
    private long refreshTokenExpiration;
    
    /**
     * 用户注册（邮箱验证模式）
     * 注册后不返回 token，发送验证邮件，返回 RegisterResponse
     * 
     * @param request 注册请求
     * @return 注册响应（message、email，无 token）
     */
    @Transactional
    public RegisterResponse register(RegisterRequest request) {
        // 1. 验证邮箱唯一性
        if (userMapper.existsByEmail(request.getEmail())) {
            throw new BusinessException(ResultCode.EMAIL_ALREADY_EXISTS);
        }
        
        // 2. 验证密码策略
        PasswordPolicyService.PasswordValidationResult validationResult = 
            passwordPolicyService.validatePassword(request.getPassword());
        if (!validationResult.isValid()) {
            throw new BusinessException(ResultCode.PASSWORD_POLICY_VIOLATION, validationResult.getErrorMessage());
        }
        
        // 3. 创建用户（emailVerified = false）
        UserEntity user = new UserEntity();
        user.setEmail(request.getEmail());
        user.setName(request.getEmail().split("@")[0]);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setEmailVerified(false);
        user.setCreatedAt(java.time.LocalDateTime.now());
        user.setUpdatedAt(java.time.LocalDateTime.now());

        userMapper.insert(user);
        UserEntity savedUser = user;
        
        // 4. 生成验证 token 并发送验证邮件
        emailVerificationService.generateAndSendVerificationEmail(savedUser.getId(), savedUser.getEmail());
        
        // 5. 返回 RegisterResponse（无 token）
        return RegisterResponse.builder()
            .message("注册成功，请查收验证邮件")
            .email(savedUser.getEmail())
            .build();
    }
    
    /**
     * 用户登录
     * 遵循 OAuth 2.0 Password Grant 模式
     * 硬验证模式：未验证邮箱的用户拒绝登录
     * 
     * @param request 登录请求
     * @return 登录响应（包含 Token 和用户信息）
     */
    public LoginResponse login(LoginRequest request) {
        // 1. 查找用户
        UserEntity user = userMapper.findByEmail(request.getEmail());
        if (user == null) {
            throw new BusinessException(ResultCode.INVALID_CREDENTIALS);
        }
        
        // 2. 验证密码（不明确提示是邮箱还是密码错误，防止用户枚举攻击）
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new BusinessException(ResultCode.INVALID_CREDENTIALS);
        }
        
        // 3. 硬验证：邮箱未验证则拒绝登录
        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new BusinessException(ResultCode.EMAIL_NOT_VERIFIED);
        }
        
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
            .expiresIn(accessTokenExpiration)
            .refreshToken(refreshToken)
            .scope("read write")
            .user(LoginResponse.UserInfo.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .username(user.getName() != null ? user.getName() : user.getEmail())
                .emailVerified(true)
                .build())
            .build();
    }
    
    /**
     * 验证邮箱
     * 验证成功后生成 JWT 并返回 LoginResponse
     * 
     * @param request 验证请求（含 token）
     * @return 登录响应（包含 Token 和用户信息）
     */
    public LoginResponse verifyEmail(VerifyEmailRequest request) {
        UserEntity user = emailVerificationService.verifyEmail(request.getToken());
        return buildLoginResponse(user);
    }
    
    /**
     * 重新发送验证邮件
     * 
     * @param request 请求（含 email）
     */
    public void resendVerification(ResendVerificationRequest request) {
        emailVerificationService.resendVerificationEmail(request.getEmail());
    }
    
    /**
     * 构建 LoginResponse
     */
    private LoginResponse buildLoginResponse(UserEntity user) {
        String accessToken = jwtService.generateAccessToken(
            user.getId().toString(),
            user.getName() != null ? user.getName() : user.getEmail(),
            Collections.emptyList()
        );
        String refreshToken = jwtService.generateRefreshToken(
            user.getId().toString(),
            null
        );
        tokenRotationService.storeRefreshToken(
            user.getId().toString(),
            null,
            refreshToken
        );
        return LoginResponse.builder()
            .accessToken(accessToken)
            .tokenType("Bearer")
            .expiresIn(accessTokenExpiration)
            .refreshToken(refreshToken)
            .scope("read write")
            .user(LoginResponse.UserInfo.builder()
                .id(user.getId().toString())
                .email(user.getEmail())
                .username(user.getName() != null ? user.getName() : user.getEmail())
                .emailVerified(Boolean.TRUE.equals(user.getEmailVerified()))
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
            UserEntity user = userMapper.findById(Long.parseLong(userId));
            if (user == null) {
                throw new BusinessException(ResultCode.USER_NOT_FOUND);
            }
            
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
                    .emailVerified(Boolean.TRUE.equals(user.getEmailVerified()))
                    .build())
                .build();
        } catch (io.jsonwebtoken.ExpiredJwtException e) {
            throw new BusinessException(ResultCode.TOKEN_EXPIRED);
        } catch (io.jsonwebtoken.JwtException e) {
            throw new BusinessException(ResultCode.REFRESH_TOKEN_INVALID);
        }
    }
    
    /**
     * 获取当前用户信息
     * 根据 JWT 中的 userId 查询用户，返回 UserInfo（不含密码）
     *
     * @param userId 用户 ID（从 JWT subject 获取）
     * @return 用户信息
     */
    public UserInfo getCurrentUser(Long userId) {
        UserEntity user = userMapper.findById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }
        return UserInfo.builder()
            .id(user.getId())
            .email(user.getEmail())
            .username(user.getName() != null ? user.getName() : user.getEmail())
            .phone(user.getPhone())
            .emailVerified(Boolean.TRUE.equals(user.getEmailVerified()))
            .createdAt(user.getCreatedAt())
            .build();
    }

    /**
     * 修改密码
     * 需当前密码验证，修改成功后旧 Refresh Token 仍有效（用户可继续使用当前会话）
     *
     * @param userId 用户 ID（从 JWT 获取）
     * @param request 修改密码请求（当前密码、新密码）
     */
    @Transactional
    public void changePassword(Long userId, ChangePasswordRequest request) {
        UserEntity user = userMapper.findById(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }

        // 1. 验证当前密码
        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
            throw new BusinessException(ResultCode.PASSWORD_ERROR);
        }

        // 2. 验证新密码策略
        PasswordPolicyService.PasswordValidationResult validationResult =
            passwordPolicyService.validatePassword(request.getNewPassword());
        if (!validationResult.isValid()) {
            throw new BusinessException(ResultCode.PASSWORD_POLICY_VIOLATION, validationResult.getErrorMessage());
        }

        // 3. 更新密码（使用 updatePassword 确保密码字段被持久化）
        String encodedNewPassword = passwordEncoder.encode(request.getNewPassword());
        java.time.LocalDateTime now = java.time.LocalDateTime.now();
        userMapper.updatePassword(user.getId(), encodedNewPassword, now);
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
