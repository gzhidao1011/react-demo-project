package com.example.auth.service;

import com.example.api.common.ResultCode;
import com.example.api.exception.BusinessException;
import com.example.api.model.*;
import com.example.auth.client.UserServiceInternalClient;
import com.example.auth.client.dto.*;
import com.example.auth.saga.RegistrationSaga;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.HttpServerErrorException;
import org.springframework.web.client.RestClientException;

import java.util.Collections;
import java.util.List;

/**
 * 认证服务：注册、登录、Token 刷新等，通过 user-service 内部 API 读写用户数据
 */
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserServiceInternalClient userClient;
    private final JwtService jwtService;
    private final PasswordPolicyService passwordPolicyService;
    private final TokenRotationService tokenRotationService;
    private final RateLimitService rateLimitService;
    private final RegistrationSaga registrationSaga;

    @Value("${jwt.access-token-expiration:1800}")
    private long accessTokenExpiration;

    @Value("${jwt.refresh-token-expiration:604800}")
    private long refreshTokenExpiration;

    /**
     * 用户注册：使用 Saga Pattern 管理分布式事务
     * 
     * Saga 步骤：
     * 1. 创建用户（createUser）
     * 2. 发送邮箱验证邮件（sendEmailVerification）
     * 
     * 如果任何步骤失败，会自动执行补偿操作（删除已创建的用户）
     */
    public RegisterResponse register(RegisterRequest request) {
        // 密码策略验证
        PasswordPolicyService.PasswordValidationResult validation = passwordPolicyService.validatePassword(request.getPassword());
        if (!validation.isValid()) {
            throw new BusinessException(ResultCode.PASSWORD_POLICY_VIOLATION, validation.getErrorMessage());
        }
        
        // 使用 Saga Pattern 执行注册流程
        return registrationSaga.execute(request);
    }

    public LoginResponse login(LoginRequest request) {
        InternalAuthValidateRequest req = new InternalAuthValidateRequest();
        req.setEmail(request.getEmail().trim().toLowerCase());
        req.setPassword(request.getPassword());
        InternalAuthValidateResponse validated = userClient.validateUserOrNull(req);
        if (validated == null) {
            throw new BusinessException(ResultCode.INVALID_CREDENTIALS);
        }
        InternalUserInfoResponse userInfo = userClient.getUser(validated.getUserId());
        if (!Boolean.TRUE.equals(userInfo.getEmailVerified())) {
            throw new BusinessException(ResultCode.EMAIL_NOT_VERIFIED);
        }
        List<String> roles = validated.getRoles() != null ? validated.getRoles() : Collections.emptyList();
        String accessToken = jwtService.generateAccessToken(
                validated.getUserId().toString(),
                validated.getName() != null ? validated.getName() : validated.getEmail(),
                roles);
        String refreshToken = jwtService.generateRefreshToken(validated.getUserId().toString(), null);
        tokenRotationService.storeRefreshToken(validated.getUserId().toString(), null, refreshToken);
        return LoginResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(accessTokenExpiration)
                .refreshToken(refreshToken)
                .scope("read write")
                .user(LoginResponse.UserInfo.builder()
                        .id(validated.getUserId().toString())
                        .email(validated.getEmail())
                        .username(validated.getName() != null ? validated.getName() : validated.getEmail())
                        .emailVerified(true)
                        .build())
                .build();
    }

    public LoginResponse verifyEmail(VerifyEmailRequest request) {
        InternalUserInfoResponse user = userClient.verifyEmailToken(request.getToken());
        return buildLoginResponse(user);
    }

    public void resendVerification(ResendVerificationRequest request) {
        userClient.resendEmailVerification(request.getEmail());
    }

    public ForgotPasswordResponse forgotPassword(String email) {
        userClient.requestPasswordReset(email);
        return ForgotPasswordResponse.builder()
                .message("如果该邮箱已注册，您将收到重置链接")
                .build();
    }

    public void resetPassword(String token, String newPassword) {
        PasswordPolicyService.PasswordValidationResult validation = passwordPolicyService.validatePassword(newPassword);
        if (!validation.isValid()) {
            throw new BusinessException(ResultCode.PASSWORD_POLICY_VIOLATION, validation.getErrorMessage());
        }
        Long userId = userClient.validatePasswordResetToken(token);
        InternalUpdatePasswordRequest req = new InternalUpdatePasswordRequest();
        req.setNewPassword(newPassword);
        userClient.updatePassword(userId, req);
        tokenRotationService.revokeAllByUserId(userId.toString());
    }

    public LoginResponse refreshToken(RefreshTokenRequest request) {
        try {
            io.jsonwebtoken.Claims claims = jwtService.parseToken(request.getRefreshToken());
            if (!"refresh".equals(claims.get("type", String.class))) {
                throw new BusinessException(ResultCode.REFRESH_TOKEN_INVALID);
            }
            String userId = claims.getSubject();
            String deviceId = claims.get("deviceId", String.class);
            if (tokenRotationService.checkTokenReuse(request.getRefreshToken())) {
                tokenRotationService.revokeToken(request.getRefreshToken());
                throw new BusinessException(ResultCode.REFRESH_TOKEN_REUSED);
            }
            if (!tokenRotationService.validateRefreshToken(userId, deviceId, request.getRefreshToken())) {
                throw new BusinessException(ResultCode.REFRESH_TOKEN_INVALID);
            }
            InternalUserInfoResponse user = userClient.getUser(Long.parseLong(userId));
            if (user == null) {
                throw new BusinessException(ResultCode.USER_NOT_FOUND);
            }
            InternalUserRolesResponse rolesRes = userClient.getUserRoles(user.getId());
            List<String> roles = rolesRes != null && rolesRes.getRoles() != null ? rolesRes.getRoles() : Collections.emptyList();
            String accessToken = jwtService.generateAccessToken(
                    userId,
                    user.getName() != null ? user.getName() : user.getEmail(),
                    roles);
            String newRefreshToken = jwtService.generateRefreshToken(userId, deviceId);
            tokenRotationService.markTokenAsUsed(userId, deviceId, request.getRefreshToken());
            tokenRotationService.storeRefreshToken(userId, deviceId, newRefreshToken);
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

    public UserInfo getCurrentUser(Long userId) {
        InternalUserInfoResponse user = userClient.getUser(userId);
        if (user == null) {
            throw new BusinessException(ResultCode.USER_NOT_FOUND);
        }
        return UserInfo.builder()
                .id(user.getId())
                .email(user.getEmail())
                .username(user.getName() != null ? user.getName() : user.getEmail())
                .phone(null)
                .emailVerified(Boolean.TRUE.equals(user.getEmailVerified()))
                .createdAt(user.getCreatedAt())
                .build();
    }

    public void changePassword(Long userId, ChangePasswordRequest request) {
        try {
            InternalUserInfoResponse user = userClient.getUser(userId);
            if (user == null) {
                throw new BusinessException(ResultCode.USER_NOT_FOUND);
            }
            InternalUpdatePasswordRequest req = new InternalUpdatePasswordRequest();
            req.setCurrentPassword(request.getCurrentPassword());
            req.setNewPassword(request.getNewPassword());
            userClient.updatePassword(userId, req);
            tokenRotationService.revokeAllByUserId(userId.toString());
        } catch (HttpClientErrorException e) {
            if (e.getStatusCode() == HttpStatus.NOT_FOUND) {
                throw new BusinessException(ResultCode.USER_NOT_FOUND);
            }
            if (e.getStatusCode() == HttpStatus.BAD_REQUEST) {
                throw new BusinessException(ResultCode.PASSWORD_ERROR);
            }
            throw new BusinessException(ResultCode.REMOTE_SERVICE_ERROR, "用户服务请求失败，请稍后重试");
        } catch (HttpServerErrorException e) {
            throw new BusinessException(ResultCode.REMOTE_SERVICE_ERROR, "用户服务暂时不可用，请稍后重试");
        } catch (RestClientException e) {
            throw new BusinessException(ResultCode.REMOTE_SERVICE_ERROR, "用户服务连接失败，请稍后重试");
        }
    }

    public void logout(String refreshToken) {
        tokenRotationService.revokeToken(refreshToken);
    }

    private LoginResponse buildLoginResponse(InternalUserInfoResponse user) {
        String userId = user.getId().toString();
        List<String> roles = Collections.emptyList();
        try {
            InternalUserRolesResponse rolesRes = userClient.getUserRoles(user.getId());
            if (rolesRes != null && rolesRes.getRoles() != null) {
                roles = rolesRes.getRoles();
            }
        } catch (Exception ignored) {
        }
        String accessToken = jwtService.generateAccessToken(
                userId,
                user.getName() != null ? user.getName() : user.getEmail(),
                roles);
        String refreshToken = jwtService.generateRefreshToken(userId, null);
        tokenRotationService.storeRefreshToken(userId, null, refreshToken);
        return LoginResponse.builder()
                .accessToken(accessToken)
                .tokenType("Bearer")
                .expiresIn(accessTokenExpiration)
                .refreshToken(refreshToken)
                .scope("read write")
                .user(LoginResponse.UserInfo.builder()
                        .id(userId)
                        .email(user.getEmail())
                        .username(user.getName() != null ? user.getName() : user.getEmail())
                        .emailVerified(Boolean.TRUE.equals(user.getEmailVerified()))
                        .build())
                .build();
    }
}
