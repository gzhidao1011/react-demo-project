import type { AxiosResponse } from "axios";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiService } from "./api.service";
import type { ApiResponseBase } from "./api.service.base";
import { getUserLocale, updateUserLocale } from "./locale.service";

// Mock apiService
vi.mock("./api.service", () => ({
  apiService: {
    patch: vi.fn(),
    get: vi.fn(),
  },
}));

describe("locale.service", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("updateUserLocale", () => {
    it("应该调用 PATCH /api/user/locale 并传递 locale", async () => {
      // Arrange
      const mockResponse: AxiosResponse<ApiResponseBase<{ locale: string }>> = {
        data: {
          code: 0,
          message: "success",
          data: { locale: "en" },
        },
      } as AxiosResponse<ApiResponseBase<{ locale: string }>>;

      vi.mocked(apiService.patch).mockResolvedValue(mockResponse);

      // Act
      await updateUserLocale("en");

      // Assert
      expect(apiService.patch).toHaveBeenCalledWith("/user/locale", { locale: "en" });
    });

    it("应该返回成功响应", async () => {
      // Arrange
      const mockResponse: AxiosResponse<ApiResponseBase<{ locale: string }>> = {
        data: {
          code: 0,
          message: "success",
          data: { locale: "zh" },
        },
      } as AxiosResponse<ApiResponseBase<{ locale: string }>>;

      vi.mocked(apiService.patch).mockResolvedValue(mockResponse);

      // Act
      const result = await updateUserLocale("zh");

      // Assert
      expect(result.data?.locale).toBe("zh");
    });

    it("应该处理 API 错误", async () => {
      // Arrange
      vi.mocked(apiService.patch).mockRejectedValue(new Error("未授权"));

      // Act & Assert
      await expect(updateUserLocale("en")).rejects.toThrow();
    });
  });

  describe("getUserLocale", () => {
    it("应该调用 GET /api/user/locale", async () => {
      // Arrange
      const mockResponse: AxiosResponse<ApiResponseBase<{ locale: string }>> = {
        data: {
          code: 0,
          message: "success",
          data: { locale: "zh" },
        },
      } as AxiosResponse<ApiResponseBase<{ locale: string }>>;

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      // Act
      await getUserLocale();

      // Assert
      expect(apiService.get).toHaveBeenCalledWith("/user/locale");
    });

    it("应该返回 locale 字符串", async () => {
      // Arrange
      const mockResponse: AxiosResponse<ApiResponseBase<{ locale: string }>> = {
        data: {
          code: 0,
          message: "success",
          data: { locale: "ja" },
        },
      } as AxiosResponse<ApiResponseBase<{ locale: string }>>;

      vi.mocked(apiService.get).mockResolvedValue(mockResponse);

      // Act
      const result = await getUserLocale();

      // Assert
      expect(result.data?.locale).toBe("ja");
    });

    it("应该处理 API 错误", async () => {
      // Arrange
      vi.mocked(apiService.get).mockRejectedValue(new Error("未授权"));

      // Act & Assert
      await expect(getUserLocale()).rejects.toThrow();
    });
  });
});
