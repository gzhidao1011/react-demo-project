import { describe, expect, it } from "vitest";
import { type LoginFormData, loginSchema } from "./login.schema";

describe("loginSchema", () => {
  describe("正常情况", () => {
    it("应该接受有效的邮箱和密码", () => {
      // Arrange: 准备测试数据
      const validData = {
        email: "user@example.com",
        password: "password123",
      };

      // Act: 调用 Schema 验证
      const result = loginSchema.parse(validData);

      // Assert: 验证结果
      expect(result).toEqual(validData);
    });

    it("应该接受有效的邮箱格式（包含子域名）", () => {
      // Arrange: 准备包含子域名的邮箱数据
      const validData = {
        email: "user@mail.example.com",
        password: "password123",
      };

      // Act: 调用 Schema 验证
      const result = loginSchema.parse(validData);

      // Assert: 验证结果
      expect(result).toEqual(validData);
    });

    it("应该接受符合最小长度要求的密码", () => {
      // Arrange: 准备最小长度密码数据
      const validData = {
        email: "user@example.com",
        password: "123456", // 最小 6 个字符
      };

      // Act: 调用 Schema 验证
      const result = loginSchema.parse(validData);

      // Assert: 验证结果
      expect(result).toEqual(validData);
    });
  });

  describe("异常情况 - 邮箱验证", () => {
    it("应该拒绝无效的邮箱格式", () => {
      // Arrange: 准备无效的邮箱数据
      const invalidData = {
        email: "invalid-email",
        password: "password123",
      };

      // Act & Assert: 验证抛出错误
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it("应该拒绝空邮箱", () => {
      // Arrange: 准备空邮箱数据
      const invalidData = {
        email: "",
        password: "password123",
      };

      // Act & Assert: 验证抛出错误
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it("应该拒绝缺少 @ 符号的邮箱", () => {
      // Arrange: 准备缺少 @ 符号的邮箱数据
      const invalidData = {
        email: "userexample.com",
        password: "password123",
      };

      // Act & Assert: 验证抛出错误
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it("应该拒绝缺少域名的邮箱", () => {
      // Arrange: 准备缺少域名的邮箱数据
      const invalidData = {
        email: "user@",
        password: "password123",
      };

      // Act & Assert: 验证抛出错误
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });
  });

  describe("异常情况 - 密码验证", () => {
    it("应该拒绝空密码", () => {
      // Arrange: 准备空密码数据
      const invalidData = {
        email: "user@example.com",
        password: "",
      };

      // Act & Assert: 验证抛出错误
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it("应该拒绝少于 6 个字符的密码", () => {
      // Arrange: 准备少于 6 个字符的密码数据
      const invalidData = {
        email: "user@example.com",
        password: "12345", // 只有 5 个字符
      };

      // Act & Assert: 验证抛出错误
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it("应该拒绝超过 50 个字符的密码", () => {
      // Arrange: 准备超过 50 个字符的密码数据
      const longPassword = "a".repeat(51); // 51 个字符
      const invalidData = {
        email: "user@example.com",
        password: longPassword,
      };

      // Act & Assert: 验证抛出错误
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });
  });

  describe("异常情况 - 必填字段验证", () => {
    it("应该拒绝缺少 email 字段", () => {
      // Arrange: 准备缺少 email 的数据
      const invalidData: Partial<LoginFormData> = {
        password: "password123",
      };

      // Act & Assert: 验证抛出错误
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });

    it("应该拒绝缺少 password 字段", () => {
      // Arrange: 准备缺少 password 的数据
      const invalidData: Partial<LoginFormData> = {
        email: "user@example.com",
      };

      // Act & Assert: 验证抛出错误
      expect(() => loginSchema.parse(invalidData)).toThrow();
    });
  });

  describe("边界情况", () => {
    it("应该接受恰好 6 个字符的密码", () => {
      // Arrange: 准备恰好 6 个字符的密码数据
      const validData = {
        email: "user@example.com",
        password: "123456",
      };

      // Act: 调用 Schema 验证
      const result = loginSchema.parse(validData);

      // Assert: 验证结果
      expect(result).toEqual(validData);
    });

    it("应该接受恰好 50 个字符的密码", () => {
      // Arrange: 准备恰好 50 个字符的密码数据
      const password = "a".repeat(50);
      const validData = {
        email: "user@example.com",
        password,
      };

      // Act: 调用 Schema 验证
      const result = loginSchema.parse(validData);

      // Assert: 验证结果
      expect(result).toEqual(validData);
    });

    it("应该处理包含特殊字符的密码", () => {
      // Arrange: 准备包含特殊字符的密码数据
      const validData = {
        email: "user@example.com",
        password: "P@ssw0rd!",
      };

      // Act: 调用 Schema 验证
      const result = loginSchema.parse(validData);

      // Assert: 验证结果
      expect(result).toEqual(validData);
    });
  });
});
