import type { FieldValues, UseFormSetError } from "react-hook-form";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { getSystemErrorToastMessage, handleServerError, isSystemError, type ServerError } from "./form-errors";

describe("isSystemError", () => {
  describe("系统级错误", () => {
    it("应该识别包含'网络'的错误", () => {
      const error = new Error("网络连接失败");
      expect(isSystemError(error)).toBe(true);
    });

    it("应该识别包含'network'的错误", () => {
      const error = new Error("Network error occurred");
      expect(isSystemError(error)).toBe(true);
    });

    it("应该识别包含'fetch'的错误", () => {
      const error = new Error("Failed to fetch");
      expect(isSystemError(error)).toBe(true);
    });

    it("应该识别包含'500'的错误", () => {
      const error = new Error("服务器错误 500");
      expect(isSystemError(error)).toBe(true);
    });

    it("应该识别包含'503'的错误", () => {
      const error = new Error("服务不可用 503");
      expect(isSystemError(error)).toBe(true);
    });

    it("应该识别包含'502'的错误", () => {
      const error = new Error("网关错误 502");
      expect(isSystemError(error)).toBe(true);
    });

    it("应该识别包含'504'的错误", () => {
      const error = new Error("网关超时 504");
      expect(isSystemError(error)).toBe(true);
    });

    it("应该识别包含'timeout'的错误", () => {
      const error = new Error("Request timeout");
      expect(isSystemError(error)).toBe(true);
    });

    it("应该识别包含'超时'的错误", () => {
      const error = new Error("请求超时");
      expect(isSystemError(error)).toBe(true);
    });

    it("应该识别包含'连接'的错误", () => {
      const error = new Error("连接失败");
      expect(isSystemError(error)).toBe(true);
    });

    it("应该识别包含'connection'的错误", () => {
      const error = new Error("Connection refused");
      expect(isSystemError(error)).toBe(true);
    });

    it("应该识别包含'服务器'的错误", () => {
      const error = new Error("服务器错误");
      expect(isSystemError(error)).toBe(true);
    });

    it("应该识别包含'server'的错误", () => {
      const error = new Error("Server error");
      expect(isSystemError(error)).toBe(true);
    });

    it("应该不区分大小写", () => {
      const error1 = new Error("NETWORK ERROR");
      const error2 = new Error("Network Error");
      const error3 = new Error("network error");
      expect(isSystemError(error1)).toBe(true);
      expect(isSystemError(error2)).toBe(true);
      expect(isSystemError(error3)).toBe(true);
    });
  });

  describe("非系统级错误", () => {
    it("应该拒绝业务错误", () => {
      const error = new Error("用户名已存在");
      expect(isSystemError(error)).toBe(false);
    });

    it("应该拒绝验证错误", () => {
      const error = new Error("邮箱格式不正确");
      expect(isSystemError(error)).toBe(false);
    });

    it("应该拒绝非 Error 对象", () => {
      expect(isSystemError(null)).toBe(false);
      expect(isSystemError(undefined)).toBe(false);
      expect(isSystemError("字符串错误")).toBe(false);
      expect(isSystemError(123)).toBe(false);
      expect(isSystemError({})).toBe(false);
    });
  });
});

describe("getSystemErrorToastMessage", () => {
  describe("系统级错误消息", () => {
    it("应该返回超时错误消息", () => {
      const error1 = new Error("请求超时");
      const error2 = new Error("Request timeout");
      expect(getSystemErrorToastMessage(error1)).toBe("请求超时，请检查网络连接后重试");
      expect(getSystemErrorToastMessage(error2)).toBe("请求超时，请检查网络连接后重试");
    });

    it("应该返回服务器错误消息（500）", () => {
      const error = new Error("服务器错误 500");
      expect(getSystemErrorToastMessage(error)).toBe("服务器暂时无法响应，请稍后重试");
    });

    it("应该返回服务器错误消息（503）", () => {
      const error = new Error("服务不可用 503");
      expect(getSystemErrorToastMessage(error)).toBe("服务器暂时无法响应，请稍后重试");
    });

    it("应该返回服务器错误消息（502）", () => {
      const error = new Error("网关错误 502");
      expect(getSystemErrorToastMessage(error)).toBe("服务器暂时无法响应，请稍后重试");
    });

    it("应该返回网络错误消息", () => {
      const error1 = new Error("网络连接失败");
      const error2 = new Error("Network error");
      const error3 = new Error("Failed to fetch");
      expect(getSystemErrorToastMessage(error1)).toBe("网络连接失败，请检查网络设置");
      expect(getSystemErrorToastMessage(error2)).toBe("网络连接失败，请检查网络设置");
      expect(getSystemErrorToastMessage(error3)).toBe("网络连接失败，请检查网络设置");
    });

    it("应该返回默认服务器错误消息", () => {
      const error = new Error("服务器错误");
      expect(getSystemErrorToastMessage(error)).toBe("服务器暂时无法响应，请稍后重试");
    });
  });

  describe("非系统级错误", () => {
    it("应该返回 undefined", () => {
      const error = new Error("用户名已存在");
      expect(getSystemErrorToastMessage(error)).toBeUndefined();
    });

    it("应该对非 Error 对象返回 undefined", () => {
      expect(getSystemErrorToastMessage(null)).toBeUndefined();
      expect(getSystemErrorToastMessage(undefined)).toBeUndefined();
      expect(getSystemErrorToastMessage("字符串")).toBeUndefined();
    });
  });
});

describe("handleServerError", () => {
  let mockSetError: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockSetError = vi.fn();
  });

  describe("字段级错误处理", () => {
    it("应该处理单个字段错误", () => {
      const error = new Error("验证失败") as ServerError;
      error.errors = [{ field: "username", message: "用户名已存在" }];

      const result = handleServerError(error, mockSetError as UseFormSetError<FieldValues>);

      expect(mockSetError).toHaveBeenCalledTimes(1);
      expect(mockSetError).toHaveBeenCalledWith("username", {
        type: "server",
        message: "用户名已存在",
      });
      expect(result.type).toBe("field");
      expect(result.shouldShowToast).toBe(false);
      expect(result.toastMessage).toBeUndefined();
    });

    it("应该处理多个字段错误", () => {
      const error = new Error("验证失败") as ServerError;
      error.errors = [
        { field: "username", message: "用户名已存在" },
        { field: "email", message: "邮箱格式不正确" },
      ];

      const result = handleServerError(error, mockSetError as UseFormSetError<FieldValues>);

      expect(mockSetError).toHaveBeenCalledTimes(2);
      expect(mockSetError).toHaveBeenCalledWith("username", {
        type: "server",
        message: "用户名已存在",
      });
      expect(mockSetError).toHaveBeenCalledWith("email", {
        type: "server",
        message: "邮箱格式不正确",
      });
      expect(result.type).toBe("field");
      expect(result.shouldShowToast).toBe(false);
    });

    it("应该处理空错误数组", () => {
      const error = new Error("验证失败") as ServerError;
      error.errors = [];

      const result = handleServerError(error, mockSetError as UseFormSetError<FieldValues>);

      // 空数组时，forEach 不会执行，但条件判断为真，返回 field 类型且不调用 setError
      expect(mockSetError).toHaveBeenCalledTimes(0);
      expect(result.type).toBe("field");
      expect(result.shouldShowToast).toBe(false);
    });
  });

  describe("表单级错误处理", () => {
    it("应该处理普通错误消息", () => {
      const error = new Error("用户名或密码错误");

      const result = handleServerError(error, mockSetError as UseFormSetError<FieldValues>);

      expect(mockSetError).toHaveBeenCalledTimes(1);
      expect(mockSetError).toHaveBeenCalledWith("root", {
        type: "server",
        message: "用户名或密码错误",
      });
      expect(result.type).toBe("form");
      expect(result.shouldShowToast).toBe(false);
      expect(result.toastMessage).toBeUndefined();
    });

    it("应该使用默认错误消息（当错误不是 Error 对象时）", () => {
      const error = "字符串错误";

      const result = handleServerError(error, mockSetError as UseFormSetError<FieldValues>, "自定义默认消息");

      expect(mockSetError).toHaveBeenCalledTimes(1);
      expect(mockSetError).toHaveBeenCalledWith("root", {
        type: "server",
        message: "自定义默认消息",
      });
      expect(result.type).toBe("form");
    });

    it("应该使用默认错误消息（当错误为 null 时）", () => {
      const result = handleServerError(null, mockSetError as UseFormSetError<FieldValues>);

      expect(mockSetError).toHaveBeenCalledTimes(1);
      expect(mockSetError).toHaveBeenCalledWith("root", {
        type: "server",
        message: "操作失败，请检查网络连接",
      });
      expect(result.type).toBe("form");
    });
  });

  describe("系统级错误处理", () => {
    it("应该处理网络错误并返回 Toast 消息", () => {
      const error = new Error("网络连接失败");

      const result = handleServerError(error, mockSetError as UseFormSetError<FieldValues>);

      expect(mockSetError).toHaveBeenCalledTimes(1);
      expect(mockSetError).toHaveBeenCalledWith("root", {
        type: "server",
        message: "网络连接失败",
      });
      expect(result.type).toBe("system");
      expect(result.shouldShowToast).toBe(true);
      expect(result.toastMessage).toBe("网络连接失败，请检查网络设置");
    });

    it("应该处理超时错误并返回 Toast 消息", () => {
      const error = new Error("请求超时");

      const result = handleServerError(error, mockSetError as UseFormSetError<FieldValues>);

      expect(result.type).toBe("system");
      expect(result.shouldShowToast).toBe(true);
      expect(result.toastMessage).toBe("请求超时，请检查网络连接后重试");
    });

    it("应该处理服务器错误（500）并返回 Toast 消息", () => {
      const error = new Error("服务器错误 500");

      const result = handleServerError(error, mockSetError as UseFormSetError<FieldValues>);

      expect(result.type).toBe("system");
      expect(result.shouldShowToast).toBe(true);
      expect(result.toastMessage).toBe("服务器暂时无法响应，请稍后重试");
    });

    it("应该处理服务器错误（503）并返回 Toast 消息", () => {
      const error = new Error("服务不可用 503");

      const result = handleServerError(error, mockSetError as UseFormSetError<FieldValues>);

      expect(result.type).toBe("system");
      expect(result.shouldShowToast).toBe(true);
      expect(result.toastMessage).toBe("服务器暂时无法响应，请稍后重试");
    });
  });

  describe("边界情况", () => {
    it("应该处理包含 errors 但不是数组的情况", () => {
      // biome-ignore lint/suspicious/noExplicitAny: 测试需要模拟包含非数组 errors 的错误对象
      const error = new Error("错误") as any;
      error.errors = "不是数组";

      const result = handleServerError(error, mockSetError as UseFormSetError<FieldValues>);

      expect(mockSetError).toHaveBeenCalledTimes(1);
      expect(mockSetError).toHaveBeenCalledWith("root", {
        type: "server",
        message: "错误",
      });
      expect(result.type).toBe("form");
    });

    it("应该处理 Error 对象但没有 message 的情况", () => {
      const error = new Error("");
      error.message = "";

      const result = handleServerError(error, mockSetError as UseFormSetError<FieldValues>);

      expect(mockSetError).toHaveBeenCalledTimes(1);
      expect(mockSetError).toHaveBeenCalledWith("root", {
        type: "server",
        message: "",
      });
      expect(result.type).toBe("form");
    });

    it("应该正确处理自定义字段类型", () => {
      interface CustomFormData {
        username: string;
        email: string;
      }

      const error = new Error("验证失败") as ServerError;
      error.errors = [{ field: "username", message: "用户名已存在" }];

      const result = handleServerError<CustomFormData>(error, mockSetError as UseFormSetError<CustomFormData>);

      expect(mockSetError).toHaveBeenCalledWith("username", {
        type: "server",
        message: "用户名已存在",
      });
      expect(result.type).toBe("field");
    });
  });
});
