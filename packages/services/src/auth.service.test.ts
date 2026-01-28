import { beforeEach, describe, expect, it, vi } from "vitest";
import type { AxiosResponse } from "axios";
import { authLogin, authRefresh, authRegister, type LoginRequest, type LoginResponse } from "./auth.service";
import { apiService } from "./api.service";
import type { ApiResponseBase } from "./api.service.base";

// Mock apiService
vi.mock("./api.service", () => ({
  apiService: {
    post: vi.fn(),
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
    it("应该调用注册 API", async () => {
      // Arrange
      const registerData = {
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
      const result = await authRegister(registerData);

      // Assert
      expect(apiService.post).toHaveBeenCalledWith("/auth/register", registerData);
      expect(result.data?.accessToken).toBe("access-token");
    });
  });
});
