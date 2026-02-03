package com.example.auth.client;

import com.example.auth.client.dto.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.web.client.RestTemplateBuilder;
import org.springframework.cloud.client.loadbalancer.LoadBalanced;
import org.springframework.http.*;
import org.springframework.stereotype.Component;
import org.springframework.web.client.HttpClientErrorException;
import org.springframework.web.client.RestTemplate;

import java.util.Collections;

/**
 * 调用 user-service 内部 API 的客户端
 * 使用 RestTemplate + Nacos 服务发现（baseUrl 为 http://user-service），请求头携带 X-Internal-Secret
 */
@Component
public class UserServiceInternalClient {

    private final RestTemplate restTemplate;
    private final String baseUrl;
    private final String internalSecret;

    public UserServiceInternalClient(
            @LoadBalanced RestTemplate restTemplate,
            @Value("${user-service.internal.base-url}") String baseUrl,
            @Value("${user-service.internal.secret}") String internalSecret) {
        this.restTemplate = restTemplate;
        this.baseUrl = baseUrl;
        this.internalSecret = internalSecret;
    }

    private HttpHeaders headers() {
        HttpHeaders h = new HttpHeaders();
        h.setContentType(MediaType.APPLICATION_JSON);
        h.set("X-Internal-Secret", internalSecret);
        return h;
    }

    /**
     * 校验用户（登录）：验证邮箱+密码，返回 userId、email、name、roles
     */
    public InternalAuthValidateResponse validateUser(InternalAuthValidateRequest request) {
        String url = baseUrl + "/internal/auth/validate";
        ResponseEntity<InternalAuthValidateResponse> res = restTemplate.exchange(
                url,
                HttpMethod.POST,
                new HttpEntity<>(request, headers()),
                InternalAuthValidateResponse.class);
        return res.getBody();
    }

    /**
     * 创建用户（注册）
     */
    public InternalCreateUserResponse createUser(InternalCreateUserRequest request) {
        String url = baseUrl + "/internal/users";
        ResponseEntity<InternalCreateUserResponse> res = restTemplate.exchange(
                url,
                HttpMethod.POST,
                new HttpEntity<>(request, headers()),
                InternalCreateUserResponse.class);
        return res.getBody();
    }

    /**
     * 设置用户邮箱已验证
     */
    public void setEmailVerified(Long userId) {
        String url = baseUrl + "/internal/users/" + userId + "/email-verified";
        restTemplate.exchange(url, HttpMethod.PATCH, new HttpEntity<>(headers()), Void.class);
    }

    /**
     * 更新密码（currentPassword 可选，修改密码时传）
     */
    public void updatePassword(Long userId, InternalUpdatePasswordRequest request) {
        String url = baseUrl + "/internal/users/" + userId + "/password";
        restTemplate.exchange(url, HttpMethod.PATCH, new HttpEntity<>(request, headers()), Void.class);
    }

    /**
     * 获取用户信息
     */
    public InternalUserInfoResponse getUser(Long userId) {
        String url = baseUrl + "/internal/users/" + userId;
        ResponseEntity<InternalUserInfoResponse> res = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers()),
                InternalUserInfoResponse.class);
        return res.getBody();
    }

    /**
     * 获取用户角色列表
     */
    public InternalUserRolesResponse getUserRoles(Long userId) {
        String url = baseUrl + "/internal/users/" + userId + "/roles";
        ResponseEntity<InternalUserRolesResponse> res = restTemplate.exchange(
                url,
                HttpMethod.GET,
                new HttpEntity<>(headers()),
                InternalUserRolesResponse.class);
        return res.getBody();
    }

    /**
     * 发送邮箱验证邮件（注册后）
     */
    public void sendEmailVerification(Long userId, String email) {
        String url = baseUrl + "/internal/email-verification/send";
        restTemplate.exchange(
                url,
                HttpMethod.POST,
                new HttpEntity<>(new InternalEmailVerificationSendRequest(userId, email), headers()),
                Void.class);
    }

    /**
     * 重新发送邮箱验证邮件
     */
    public void resendEmailVerification(String email) {
        String url = baseUrl + "/internal/email-verification/resend";
        restTemplate.exchange(
                url,
                HttpMethod.POST,
                new HttpEntity<>(Collections.singletonMap("email", email), headers()),
                Void.class);
    }

    /**
     * 验证邮箱 token，返回用户信息（验证成功后签发 JWT）
     */
    public InternalUserInfoResponse verifyEmailToken(String token) {
        String url = baseUrl + "/internal/email-verification/verify";
        ResponseEntity<InternalUserInfoResponse> res = restTemplate.exchange(
                url,
                HttpMethod.POST,
                new HttpEntity<>(new InternalEmailVerificationVerifyRequest(token), headers()),
                InternalUserInfoResponse.class);
        return res.getBody();
    }

    /**
     * 请求密码重置（发邮件）
     */
    public void requestPasswordReset(String email) {
        String url = baseUrl + "/internal/password-reset/request";
        restTemplate.exchange(
                url,
                HttpMethod.POST,
                new HttpEntity<>(new InternalPasswordResetRequestRequest(email), headers()),
                com.example.api.model.ForgotPasswordResponse.class);
    }

    /**
     * 校验密码重置 token 并一次性消费，返回 userId
     */
    public Long validatePasswordResetToken(String token) {
        String url = baseUrl + "/internal/password-reset/validate";
        ResponseEntity<InternalPasswordResetValidateResponse> res = restTemplate.exchange(
                url,
                HttpMethod.POST,
                new HttpEntity<>(new InternalPasswordResetValidateRequest(token), headers()),
                InternalPasswordResetValidateResponse.class);
        return res.getBody() != null ? res.getBody().getUserId() : null;
    }

    /**
     * 校验用户是否返回 401（登录失败）
     */
    public boolean isUnauthorized(InternalAuthValidateRequest request) {
        String url = baseUrl + "/internal/auth/validate";
        try {
            restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(request, headers()),
                    InternalAuthValidateResponse.class);
            return false;
        } catch (HttpClientErrorException.Unauthorized e) {
            return true;
        }
    }

    /**
     * 校验用户，若 401 返回 null，否则返回响应
     */
    public InternalAuthValidateResponse validateUserOrNull(InternalAuthValidateRequest request) {
        String url = baseUrl + "/internal/auth/validate";
        try {
            ResponseEntity<InternalAuthValidateResponse> res = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(request, headers()),
                    InternalAuthValidateResponse.class);
            return res.getBody();
        } catch (HttpClientErrorException.Unauthorized e) {
            return null;
        }
    }

    /**
     * 删除用户（内部 API，供注册失败时补偿使用）
     */
    public void deleteUser(Long userId) {
        String url = baseUrl + "/internal/users/" + userId;
        restTemplate.exchange(url, HttpMethod.DELETE, new HttpEntity<>(headers()), Void.class);
    }
}
