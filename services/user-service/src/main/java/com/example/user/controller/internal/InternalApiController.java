package com.example.user.controller.internal;

import com.example.api.common.ResultCode;
import com.example.api.exception.BusinessException;
import com.example.api.model.ForgotPasswordResponse;
import com.example.user.controller.internal.dto.*;
import com.example.user.entity.UserEntity;
import com.example.user.mapper.RoleMapper;
import com.example.user.mapper.UserMapper;
import com.example.user.mapper.UserRoleMapper;
import com.example.user.service.EmailVerificationService;
import com.example.user.service.PasswordResetService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

/**
 * 内部 API（供 auth-service 调用）
 * 校验用户、创建用户、拉取角色、更新邮箱验证/密码等
 * 仅允许携带正确 X-Internal-Secret 的请求（由 InternalApiSecretFilter 校验）
 */
@RestController
@RequestMapping("/internal")
@RequiredArgsConstructor
public class InternalApiController {

    private final UserMapper userMapper;
    private final UserRoleMapper userRoleMapper;
    private final RoleMapper roleMapper;
    private final PasswordEncoder passwordEncoder;
    private final EmailVerificationService emailVerificationService;
    private final PasswordResetService passwordResetService;

    /**
     * 校验用户（登录时）：验证邮箱+密码，返回 userId、email、name、roles
     */
    @PostMapping("/auth/validate")
    public ResponseEntity<InternalAuthValidateResponse> validateUser(@Valid @RequestBody InternalAuthValidateRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        UserEntity user = userMapper.findByEmail(email);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        }
        List<Long> roleIds = userRoleMapper.findRoleIdsByUserId(user.getId());
        List<String> roles = roleIds.stream()
                .map(roleMapper::findById)
                .filter(r -> r != null)
                .map(r -> r.getCode())
                .collect(Collectors.toList());
        InternalAuthValidateResponse body = InternalAuthValidateResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .name(user.getName() != null ? user.getName() : user.getEmail())
                .roles(roles)
                .build();
        return ResponseEntity.ok(body);
    }

    /**
     * 创建用户（注册时）：user-service 哈希密码并入库
     */
    @PostMapping("/users")
    @Transactional
    public ResponseEntity<InternalCreateUserResponse> createUser(@Valid @RequestBody InternalCreateUserRequest request) {
        String email = request.getEmail().trim().toLowerCase();
        if (userMapper.existsByEmailWithDeleted(email, true)) {
            throw new BusinessException(ResultCode.EMAIL_ALREADY_EXISTS, "邮箱已存在: " + email);
        }
        var now = LocalDateTime.now();
        UserEntity entity = new UserEntity();
        entity.setName(request.getName());
        entity.setEmail(email);
        entity.setPhone(null);
        entity.setPassword(passwordEncoder.encode(request.getPassword()));
        entity.setEmailVerified(false);
        entity.setCreatedAt(now);
        entity.setUpdatedAt(now);
        entity.setDeletedAt(null);
        userMapper.insert(entity);
        return ResponseEntity.status(HttpStatus.CREATED).body(new InternalCreateUserResponse(entity.getId()));
    }

    /**
     * 设置用户邮箱已验证
     */
    @PatchMapping("/users/{id}/email-verified")
    public ResponseEntity<Void> setEmailVerified(@PathVariable("id") Long id) {
        UserEntity user = userMapper.findById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        user.setEmailVerified(true);
        user.setEmailVerifiedAt(LocalDateTime.now());
        user.setUpdatedAt(LocalDateTime.now());
        userMapper.update(user);
        return ResponseEntity.ok().build();
    }

    /**
     * 更新密码（重置：仅 newPassword；修改：currentPassword + newPassword）
     */
    @PatchMapping("/users/{id}/password")
    public ResponseEntity<Void> updatePassword(@PathVariable("id") Long id, @Valid @RequestBody InternalUpdatePasswordRequest request) {
        UserEntity user = userMapper.findById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        if (request.getCurrentPassword() != null && !request.getCurrentPassword().isEmpty()) {
            if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPassword())) {
                throw new BusinessException(ResultCode.PASSWORD_ERROR);
            }
        }
        String encodedNew = passwordEncoder.encode(request.getNewPassword());
        var now = LocalDateTime.now();
        userMapper.updatePassword(id, encodedNew, now);
        return ResponseEntity.ok().build();
    }

    /**
     * 按邮箱查用户（供忘记密码等，存在则返回 userId、email）
     */
    @GetMapping("/users/by-email")
    public ResponseEntity<InternalUserByEmailResponse> getUserByEmail(@RequestParam("email") String email) {
        String normalized = email.trim().toLowerCase();
        UserEntity user = userMapper.findByEmail(normalized);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        return ResponseEntity.ok(new InternalUserByEmailResponse(user.getId(), user.getEmail()));
    }

    /**
     * 获取用户信息（供 /me、refresh 等）
     */
    @GetMapping("/users/{id}")
    public ResponseEntity<InternalUserInfoResponse> getUser(@PathVariable("id") Long id) {
        UserEntity user = userMapper.findById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        InternalUserInfoResponse body = InternalUserInfoResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .emailVerified(user.getEmailVerified())
                .createdAt(user.getCreatedAt())
                .build();
        return ResponseEntity.ok(body);
    }

    /**
     * 获取用户角色列表（供 refresh Token 时拉取最新角色）
     */
    @GetMapping("/users/{id}/roles")
    public ResponseEntity<InternalUserRolesResponse> getUserRoles(@PathVariable("id") Long id) {
        UserEntity user = userMapper.findById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        List<Long> roleIds = userRoleMapper.findRoleIdsByUserId(id);
        List<String> roles = roleIds.stream()
                .map(roleMapper::findById)
                .filter(r -> r != null)
                .map(r -> r.getCode())
                .collect(Collectors.toList());
        return ResponseEntity.ok(new InternalUserRolesResponse(roles));
    }

    /**
     * 发送邮箱验证邮件（供 auth-service 注册后调用）
     */
    @PostMapping("/email-verification/send")
    public ResponseEntity<Void> sendEmailVerification(@Valid @RequestBody InternalEmailVerificationSendRequest request) {
        emailVerificationService.generateAndSendVerificationEmail(request.getUserId(), request.getEmail());
        return ResponseEntity.noContent().build();
    }

    /**
     * 重新发送邮箱验证邮件（供 auth-service resend-verification 调用）
     */
    @PostMapping("/email-verification/resend")
    public ResponseEntity<Void> resendEmailVerification(@Valid @RequestBody InternalEmailVerificationResendRequest request) {
        if (request == null || request.getEmail() == null || request.getEmail().isBlank()) {
            return ResponseEntity.badRequest().build();
        }
        emailVerificationService.resendVerificationEmail(request.getEmail().trim().toLowerCase());
        return ResponseEntity.noContent().build();
    }

    /**
     * 验证邮箱 token，设置 email_verified，返回用户信息（供 auth-service 验证邮箱后签发 JWT）
     */
    @PostMapping("/email-verification/verify")
    public ResponseEntity<InternalUserInfoResponse> verifyEmail(@Valid @RequestBody InternalEmailVerificationVerifyRequest request) {
        UserEntity user = emailVerificationService.verifyEmail(request.getToken());
        InternalUserInfoResponse body = InternalUserInfoResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .name(user.getName())
                .emailVerified(Boolean.TRUE)
                .createdAt(user.getCreatedAt())
                .build();
        return ResponseEntity.ok(body);
    }

    /**
     * 请求密码重置（发邮件，用户枚举防护）
     */
    @PostMapping("/password-reset/request")
    public ResponseEntity<ForgotPasswordResponse> requestPasswordReset(@Valid @RequestBody InternalPasswordResetRequestRequest request) {
        ForgotPasswordResponse response = passwordResetService.forgotPassword(request.getEmail());
        return ResponseEntity.ok(response);
    }

    /**
     * 校验密码重置 token 并一次性消费，返回 userId（供 auth-service 再调用 updatePassword）
     */
    @PostMapping("/password-reset/validate")
    public ResponseEntity<InternalPasswordResetValidateResponse> validatePasswordResetToken(@Valid @RequestBody InternalPasswordResetValidateRequest request) {
        Long userId = passwordResetService.validateTokenAndConsume(request.getToken());
        return ResponseEntity.ok(new InternalPasswordResetValidateResponse(userId));
    }

    /**
     * 删除用户（内部 API，供 auth-service 注册失败时补偿使用）
     */
    @DeleteMapping("/users/{id}")
    @Transactional
    public ResponseEntity<Void> deleteUser(@PathVariable("id") Long id) {
        UserEntity user = userMapper.findById(id);
        if (user == null) {
            return ResponseEntity.notFound().build();
        }
        // 硬删除（注册失败补偿，不需要软删除）
        userMapper.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
