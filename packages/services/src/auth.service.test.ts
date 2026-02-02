import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiService } from "./api.service";
import type { ApiResponseBase } from "./api.service.base";
import {
  authChangePassword,
  authForgotPassword,
  authGetCurrentUser,
  authLogin,
  authRefresh,
  authRegister,
  authResetPassword,
  type LoginRequest,
  type LoginResponse,
  type UserInfo,
} from "./auth.service";

// Mock apiService
vi.mock("./api.service", () => ({
  apiService: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

describe("auth.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("LoginResponse 接口", () => {
    it("应该定义 LoginResponse 接口（OAuth 2.0 格式）", () => {
      // Arrange & Act
      const response: LoginResponse = {
        accessToken: "access-token",
        tokenType: "Bearer",
        expiresIn: 3600,
        refreshToken: "refresh-token",
        scope: "read write",
      };

      // Assert
      expect(response.accessToken).toBe("access-token");
      expect(response.tokenType).toBe("Bearer");
      expect(response.expiresIn).toBe(3600);
      expect(response.refreshToken).toBe("refresh-token");
    });

    it("应该包含可选的 user 字段", () => {
      // Arrange & Act
      const response: LoginResponse = {
        accessToken: "access-token",
        expiresIn: 3600,
        refreshToken: "refresh-token",
        user: {
          id: "123",
          email: "user@example.com",
          username: "testuser",
          emailVerified: false,
        },
      };

      // Assert
      expect(response.user).toBeDefined();
      expect(response.user?.id).toBe("123");
      expect(response.user?.email).toBe("user@example.com");
    });
  });

  describe("authLogin", () => {
    it("应该调用正确的 API 端点", async () => {
      // Arrange
      const loginData: LoginRequest = {
        email: "user@example.com",
        password: "password123",
      };
      const mockResponse: AxiosResponse<ApiResponseBase<LoginResponse>> = {
        data: {
          code: 0,
          message: "success",
          data: {
            accessToken: "access-token",
            expiresIn: 3600,
            refreshToken: "refresh-token",
          },
        },
      } as AxiosResponse<ApiResponseBase<LoginResponse>>;

      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      // Act
      const result = await authLogin(loginData);

      // Assert
      expect(apiService.post).toHaveBeenCalledWith("/auth/login", loginData);
      expect(result.data?.accessToken).toBe("access-token");
    });

    it("应该传递 email 和 password 参数", async () => {
      // Arrange
      const loginData: LoginRequest = {
        email: "user@example.com",
        password: "password123",
      };
      const mockResponse: AxiosResponse<ApiResponseBase<LoginResponse>> = {
        data: {
          code: 0,
          message: "success",
          data: {
            accessToken: "access-token",
            expiresIn: 3600,
            refreshToken: "refresh-token",
          },
        },
      } as AxiosResponse<ApiResponseBase<LoginResponse>>;

      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      // Act
      await authLogin(loginData);

      // Assert
      expect(apiService.post).toHaveBeenCalledWith("/auth/login", {
        email: "user@example.com",
        password: "password123",
      });
    });

    it("应该返回 LoginResponse 类型", async () => {
      // Arrange
      const loginData: LoginRequest = {
        email: "user@example.com",
        password: "password123",
      };
      const mockResponse: AxiosResponse<ApiResponseBase<LoginResponse>> = {
        data: {
          code: 0,
          message: "success",
          data: {
            accessToken: "access-token",
            expiresIn: 3600,
            refreshToken: "refresh-token",
          },
        },
      } as AxiosResponse<ApiResponseBase<LoginResponse>>;

      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      // Act
      const result = await authLogin(loginData);

      // Assert
      expect(result.data).not.toBeNull();
      expect(result.data).toHaveProperty("accessToken");
      expect(result.data).toHaveProperty("expiresIn");
      expect(result.data).toHaveProperty("refreshToken");
    });

    it("应该处理 API 错误", async () => {
      // Arrange
      const loginData: LoginRequest = {
        email: "user@example.com",
        password: "wrong-password",
      };
      const mockError = new Error("Invalid credentials");

      vi.mocked(apiService.post).mockRejectedValue(mockError);

      // Act & Assert
      await expect(authLogin(loginData)).rejects.toThrow("Invalid credentials");
    });
  });

  describe("authRefresh", () => {
    it("应该调用刷新 API", async () => {
      // Arrange
      const refreshToken = "refresh-token";
      const mockResponse: AxiosResponse<ApiResponseBase<LoginResponse>> = {
        data: {
          code: 0,
          message: "success",
          data: {
            accessToken: "new-access-token",
            expiresIn: 3600,
            refreshToken: "new-refresh-token",
          },
        },
      } as AxiosResponse<ApiResponseBase<LoginResponse>>;

      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      // Act
      const result = await authRefresh(refreshToken);

      // Assert
      expect(apiService.post).toHaveBeenCalledWith("/auth/refresh", {
        refreshToken,
      });
      expect(result.data?.accessToken).toBe("new-access-token");
    });

    it("应该返回新的 Token", async () => {
      // Arrange
      const refreshToken = "refresh-token";
      const mockResponse: AxiosResponse<ApiResponseBase<LoginResponse>> = {
        data: {
          code: 0,
          message: "success",
          data: {
            accessToken: "new-access-token",
            expiresIn: 3600,
            refreshToken: "new-refresh-token",
          },
        },
      } as AxiosResponse<ApiResponseBase<LoginResponse>>;

      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      // Act
      const result = await authRefresh(refreshToken);

      // Assert
      expect(result.data).not.toBeNull();
      expect(result.data?.accessToken).toBe("new-access-token");
      expect(result.data?.refreshToken).toBe("new-refresh-token");
    });
  });

  describe("authRegister", () => {
    it("应该调用注册 API 并返回 RegisterResponse", async () => {
      // Arrange
      const registerData = {
        email: "user@example.com",
        password: "password123",
      };
      const mockResponse: AxiosResponse<ApiResponseBase<{ message: string; email: string }>> = {
        data: {
          code: 0,
          message: "success",
          data: {
            message: "请查收验证邮件",
            email: "user@example.com",
          },
        },
      } as AxiosResponse<ApiResponseBase<{ message: string; email: string }>>;

      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      // Act
      const result = await authRegister(registerData);

      // Assert
      expect(apiService.post).toHaveBeenCalledWith("/auth/register", registerData);
      expect(result.message).toBe("请查收验证邮件");
      expect(result.email).toBe("user@example.com");
    });
  });

  describe("authForgotPassword", () => {
    it("应该调用 forgot-password API 并传递标准化后的 email", async () => {
      // Arrange
      const email = "  User@Example.COM  ";
      const mockResponse: AxiosResponse<ApiResponseBase<{ message: string }>> = {
        data: {
          code: 0,
          message: "success",
          data: { message: "请查收邮件" },
        },
      } as AxiosResponse<ApiResponseBase<{ message: string }>>;

      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      // Act
      await authForgotPassword(email);

      // Assert - email 应做 trim().toLowerCase() 标准化
      expect(apiService.post).toHaveBeenCalledWith("/auth/forgot-password", {
        email: "user@example.com",
      });
    });

    it("应该成功返回（无返回值）", async () => {
      // Arrange
      const mockResponse: AxiosResponse<ApiResponseBase<void>> = {
        data: { code: 0, message: "success", data: null },
      } as AxiosResponse<ApiResponseBase<void>>;

      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      // Act
      await authForgotPassword("user@example.com");

      // Assert
      expect(apiService.post).toHaveBeenCalledWith("/auth/forgot-password", {
        email: "user@example.com",
      });
    });
  });

  describe("authResetPassword", () => {
    it("应该调用 reset-password API 并传递 token 和 newPassword（不传 email）", async () => {
      // Arrange
      const token = "reset-token-xxx";
      const newPassword = "newPassword123";
      const mockResponse: AxiosResponse<ApiResponseBase<void>> = {
        data: { code: 0, message: "success", data: null },
      } as AxiosResponse<ApiResponseBase<void>>;

      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      // Act
      await authResetPassword(token, newPassword);

      // Assert - 仅传 token 和 newPassword，不传 email
      expect(apiService.post).toHaveBeenCalledWith("/auth/reset-password", {
        token,
        newPassword,
      });
    });

    it("应该成功返回（无返回值）", async () => {
      // Arrange
      const mockResponse: AxiosResponse<ApiResponseBase<void>> = {
        data: { code: 0, message: "success", data: null },
      } as AxiosResponse<ApiResponseBase<void>>;

      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      // Act
      await authResetPassword("token", "newpass");

      // Assert
      expect(apiService.post).toHaveBeenCalledWith("/auth/reset-password", {
        token: "token",
        newPassword: "newpass",
      });
    });
  });

  describe("authChangePassword", () => {
    it("应该调用 change-password API 并传递 currentPassword 和 newPassword", async () => {
      // Arrange
      const data = {
        currentPassword: "oldPassword123",
        newPassword: "newPassword456",
      };
      const mockResponse: AxiosResponse<ApiResponseBase<void>> = {
        data: { code: 0, message: "success", data: null },
      } as AxiosResponse<ApiResponseBase<void>>;

      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      // Act
      await authChangePassword(data);

      // Assert
      expect(apiService.post).toHaveBeenCalledWith("/auth/change-password", data);
    });

    it("应该成功返回（无返回值）", async () => {
      // Arrange
      const mockResponse: AxiosResponse<ApiResponseBase<void>> = {
        data: { code: 0, message: "success", data: null },
      } as AxiosResponse<ApiResponseBase<void>>;

      vi.mocked(apiService.post).mockResolvedValue(mockResponse);

      // Act
      await authChangePassword({
        currentPassword: "old",
        newPassword: "new",
      });

      // Assert
      expect(apiService.post).toHaveBeenCalledWith("/auth/change-password", {
        currentPassword: "old",
        newPassword: "new",
      });
    });
  });

  describe("authGetCurrentUser", () => {
    it("应该使用 GET 方法调用 /auth/me 接口", async () => {
      // Arrange
      const mockUserInfo: UserInfo = {
        id: 1,
        email: "user@example.com",
        username: "testuser",
        email_verified: true,
        created_at: "2024-01-01T00:00:00.000Z",
      };
      const mockResponse: AxiosResponse<ApiResponseBase<UserInfo>> = {
        data: {
          code: 0,
          message: "success",
          data: mockUserInfo,
        },
      } as AxiosResponse<ApiResponseBase<UserInfo>>;

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      // Act
      const result = await authGetCurrentUser();

      // Assert
      expect(apiService.get).toHaveBeenCalledWith("/auth/me");
      expect(result.data).toEqual(mockUserInfo);
      expect(result.data?.id).toBe(1);
      expect(result.data?.email).toBe("user@example.com");
      expect(result.data?.username).toBe("testuser");
      expect(result.data?.email_verified).toBe(true);
    });

    it("应该返回 UserInfo 类型（含 id、email、username、emailVerified、createdAt）", async () => {
      // Arrange
      const mockUserInfo: UserInfo = {
        id: 2,
        email: "me@example.com",
        username: "meuser",
        email_verified: true,
        created_at: "2024-02-01T12:00:00.000Z",
      };
      const mockResponse: AxiosResponse<ApiResponseBase<UserInfo>> = {
        data: { code: 0, message: "success", data: mockUserInfo },
      } as AxiosResponse<ApiResponseBase<UserInfo>>;

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      // Act
      const result = await authGetCurrentUser();

      // Assert
      expect(result.data).toHaveProperty("id");
      expect(result.data).toHaveProperty("email");
      expect(result.data).toHaveProperty("username");
      expect(result.data).toHaveProperty("email_verified");
      expect(result.data).toHaveProperty("created_at");
    });

    it("应该处理 API 错误", async () => {
      // Arrange
      const mockError = new Error("未授权");
      vi.mocked(apiService.get).mockRejectedValue(mockError);

      // Act & Assert
      await expect(authGetCurrentUser()).rejects.toThrow("未授权");
    });
  });
});
