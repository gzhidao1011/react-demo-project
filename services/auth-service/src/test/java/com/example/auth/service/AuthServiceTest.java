package com.example.auth.service;

import com.example.api.common.ResultCode;
import com.example.api.exception.BusinessException;
import com.example.auth.client.UserServiceInternalClient;
import com.example.auth.client.dto.*;
import com.example.api.model.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.test.util.ReflectionTestUtils;
import org.springframework.web.client.HttpClientErrorException;

import java.util.Collections;
import java.util.List;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

/**
 * AuthService 单元测试
 * 覆盖注册、登录、密码策略、Token 刷新等核心逻辑
 */
@ExtendWith(MockitoExtension.class)
class AuthServiceTest {

    @Mock
    private UserServiceInternalClient userClient;

    @Mock
    private JwtService jwtService;

    @Mock
    private PasswordPolicyService passwordPolicyService;

    @Mock
    private TokenRotationService tokenRotationService;

    @Mock
    private RateLimitService rateLimitService;

    @InjectMocks
    private AuthService authService;

    @BeforeEach
    void setUp() {
        ReflectionTestUtils.setField(authService, "accessTokenExpiration", 1800L);
        ReflectionTestUtils.setField(authService, "refreshTokenExpiration", 604800L);
    }

    @Test
    void register_whenPasswordInvalid_throwsPasswordPolicyViolation() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("test@example.com");
        request.setPassword("weak");

        PasswordPolicyService.PasswordValidationResult invalid =
                new PasswordPolicyService.PasswordValidationResult(
                        false, "密码长度至少需要 8 个字符", List.of("密码长度至少需要 8 个字符"));
        when(passwordPolicyService.validatePassword("weak")).thenReturn(invalid);

        BusinessException ex = assertThrows(BusinessException.class, () -> authService.register(request));
        assertEquals(ResultCode.PASSWORD_POLICY_VIOLATION.getCode(), ex.getCode());
        verify(userClient, never()).createUser(any());
    }

    @Test
    void register_whenEmailExists_throwsEmailAlreadyExists() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("exist@example.com");
        request.setPassword("Password123!");

        when(passwordPolicyService.validatePassword(anyString()))
                .thenReturn(new PasswordPolicyService.PasswordValidationResult(true, null, List.of()));
        when(userClient.createUser(any(InternalCreateUserRequest.class)))
                .thenThrow(new HttpClientErrorException(HttpStatus.CONFLICT));

        BusinessException ex = assertThrows(BusinessException.class, () -> authService.register(request));
        assertEquals(ResultCode.EMAIL_ALREADY_EXISTS.getCode(), ex.getCode());
    }

    @Test
    void register_whenSuccess_returnsRegisterResponse() {
        RegisterRequest request = new RegisterRequest();
        request.setEmail("new@example.com");
        request.setPassword("Password123!");

        when(passwordPolicyService.validatePassword(anyString()))
                .thenReturn(new PasswordPolicyService.PasswordValidationResult(true, null, List.of()));
        InternalCreateUserResponse created = new InternalCreateUserResponse(100L);
        when(userClient.createUser(any(InternalCreateUserRequest.class))).thenReturn(created);
        doNothing().when(userClient).sendEmailVerification(eq(100L), eq("new@example.com"));

        RegisterResponse response = authService.register(request);

        assertNotNull(response);
        assertEquals("注册成功，请查收验证邮件", response.getMessage());
        assertEquals("new@example.com", response.getEmail());
        verify(userClient).createUser(argThat(req ->
                "new@example.com".equals(req.getEmail()) && "Password123!".equals(req.getPassword())));
        verify(userClient).sendEmailVerification(100L, "new@example.com");
    }

    @Test
    void login_whenValidateReturnsNull_throwsInvalidCredentials() {
        LoginRequest request = new LoginRequest();
        request.setEmail("nobody@example.com");
        request.setPassword("any");

        when(userClient.validateUserOrNull(any(InternalAuthValidateRequest.class))).thenReturn(null);

        BusinessException ex = assertThrows(BusinessException.class, () -> authService.login(request));
        assertEquals(ResultCode.INVALID_CREDENTIALS.getCode(), ex.getCode());
        verify(jwtService, never()).generateAccessToken(anyString(), anyString(), anyList());
    }

    @Test
    void login_whenEmailNotVerified_throwsEmailNotVerified() {
        LoginRequest request = new LoginRequest();
        request.setEmail("unverified@example.com");
        request.setPassword("Password123!");

        InternalAuthValidateResponse validated = InternalAuthValidateResponse.builder()
                .userId(1L)
                .email("unverified@example.com")
                .name("user")
                .roles(List.of("USER"))
                .build();
        when(userClient.validateUserOrNull(any(InternalAuthValidateRequest.class))).thenReturn(validated);

        InternalUserInfoResponse userInfo = new InternalUserInfoResponse();
        userInfo.setId(1L);
        userInfo.setEmail("unverified@example.com");
        userInfo.setName("user");
        userInfo.setEmailVerified(false);
        when(userClient.getUser(1L)).thenReturn(userInfo);

        BusinessException ex = assertThrows(BusinessException.class, () -> authService.login(request));
        assertEquals(ResultCode.EMAIL_NOT_VERIFIED.getCode(), ex.getCode());
    }

    @Test
    void login_whenSuccess_returnsLoginResponse() {
        LoginRequest request = new LoginRequest();
        request.setEmail("ok@example.com");
        request.setPassword("Password123!");

        InternalAuthValidateResponse validated = InternalAuthValidateResponse.builder()
                .userId(2L)
                .email("ok@example.com")
                .name("okuser")
                .roles(List.of("USER"))
                .build();
        when(userClient.validateUserOrNull(any(InternalAuthValidateRequest.class))).thenReturn(validated);

        InternalUserInfoResponse userInfo = new InternalUserInfoResponse();
        userInfo.setId(2L);
        userInfo.setEmail("ok@example.com");
        userInfo.setName("okuser");
        userInfo.setEmailVerified(true);
        when(userClient.getUser(2L)).thenReturn(userInfo);

        when(jwtService.generateAccessToken(eq("2"), eq("okuser"), eq(List.of("USER"))))
                .thenReturn("access-token");
        when(jwtService.generateRefreshToken(eq("2"), isNull())).thenReturn("refresh-token");
        doNothing().when(tokenRotationService).storeRefreshToken(eq("2"), isNull(), eq("refresh-token"));

        LoginResponse response = authService.login(request);

        assertNotNull(response);
        assertEquals("access-token", response.getAccessToken());
        assertEquals("refresh-token", response.getRefreshToken());
        assertEquals("Bearer", response.getTokenType());
        assertEquals(1800L, response.getExpiresIn());
        assertNotNull(response.getUser());
        assertEquals("2", response.getUser().getId());
        assertEquals("ok@example.com", response.getUser().getEmail());
        assertEquals("okuser", response.getUser().getUsername());
        assertTrue(response.getUser().getEmailVerified());
    }

    @Test
    void forgotPassword_returnsMessage() {
        ForgotPasswordResponse response = authService.forgotPassword("user@example.com");
        assertNotNull(response);
        assertTrue(response.getMessage().contains("如果该邮箱已注册"));
        verify(userClient).requestPasswordReset("user@example.com");
    }

    @Test
    void getCurrentUser_whenUserNotFound_throwsUserNotFound() {
        when(userClient.getUser(999L)).thenReturn(null);
        BusinessException ex = assertThrows(BusinessException.class, () -> authService.getCurrentUser(999L));
        assertEquals(ResultCode.USER_NOT_FOUND.getCode(), ex.getCode());
    }

    @Test
    void getCurrentUser_whenSuccess_returnsUserInfo() {
        InternalUserInfoResponse internal = new InternalUserInfoResponse();
        internal.setId(3L);
        internal.setEmail("current@example.com");
        internal.setName("Current User");
        internal.setEmailVerified(true);
        when(userClient.getUser(3L)).thenReturn(internal);

        UserInfo user = authService.getCurrentUser(3L);
        assertNotNull(user);
        assertEquals(3L, user.getId());
        assertEquals("current@example.com", user.getEmail());
        assertEquals("Current User", user.getUsername());
        assertTrue(user.getEmailVerified());
    }

    @Test
    void logout_revokesToken() {
        authService.logout("some-refresh-token");
        verify(tokenRotationService).revokeToken("some-refresh-token");
    }
}
