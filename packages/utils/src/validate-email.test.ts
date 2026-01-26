import { describe, expect, it } from "vitest";
import { validateEmail } from "./validate-email";

describe("validateEmail", () => {
  describe("有效邮箱地址", () => {
    it("应该接受标准邮箱格式", () => {
      expect(validateEmail("user@example.com")).toBe(true);
      expect(validateEmail("test@domain.co.uk")).toBe(true);
      expect(validateEmail("user.name@example.com")).toBe(true);
    });

    it("应该接受包含加号的邮箱", () => {
      expect(validateEmail("user+tag@example.com")).toBe(true);
    });

    it("应该接受包含下划线的邮箱", () => {
      expect(validateEmail("user_name@example.com")).toBe(true);
    });

    it("应该接受包含连字符的邮箱", () => {
      expect(validateEmail("user-name@example.com")).toBe(true);
      expect(validateEmail("user@example-domain.com")).toBe(true);
    });

    it("应该接受包含数字的邮箱", () => {
      expect(validateEmail("user123@example.com")).toBe(true);
      expect(validateEmail("user@123example.com")).toBe(true);
    });

    it("应该接受多级域名", () => {
      expect(validateEmail("user@sub.example.com")).toBe(true);
      expect(validateEmail("user@sub.sub.example.com")).toBe(true);
    });

    it("应该接受短域名", () => {
      expect(validateEmail("user@ex.co")).toBe(true);
    });
  });

  describe("无效邮箱地址", () => {
    it("应该拒绝空字符串", () => {
      expect(validateEmail("")).toBe(false);
      expect(validateEmail("   ")).toBe(false);
    });

    it("应该拒绝非字符串类型", () => {
      // biome-ignore lint/suspicious/noExplicitAny: 测试需要验证非字符串类型的边界情况
      expect(validateEmail(null as any)).toBe(false);
      // biome-ignore lint/suspicious/noExplicitAny: 测试需要验证非字符串类型的边界情况
      expect(validateEmail(undefined as any)).toBe(false);
      // biome-ignore lint/suspicious/noExplicitAny: 测试需要验证非字符串类型的边界情况
      expect(validateEmail(123 as any)).toBe(false);
      // biome-ignore lint/suspicious/noExplicitAny: 测试需要验证非字符串类型的边界情况
      expect(validateEmail({} as any)).toBe(false);
    });

    it("应该拒绝缺少 @ 符号的邮箱", () => {
      expect(validateEmail("userexample.com")).toBe(false);
      expect(validateEmail("user@")).toBe(false);
      expect(validateEmail("@example.com")).toBe(false);
    });

    it("应该拒绝缺少域名的邮箱", () => {
      expect(validateEmail("user@")).toBe(false);
      expect(validateEmail("user@ ")).toBe(false);
    });

    it("应该拒绝缺少顶级域名的邮箱", () => {
      expect(validateEmail("user@example")).toBe(false);
      expect(validateEmail("user@example.")).toBe(false);
    });

    it("应该拒绝域名以点开头的邮箱", () => {
      expect(validateEmail("user@.example.com")).toBe(false);
    });

    it("应该拒绝域名以点结尾的邮箱", () => {
      expect(validateEmail("user@example.com.")).toBe(false);
    });

    it("应该拒绝包含连续点的邮箱", () => {
      expect(validateEmail("user..name@example.com")).toBe(false);
      expect(validateEmail("user@example..com")).toBe(false);
    });

    it("应该拒绝本地部分以点开头的邮箱", () => {
      expect(validateEmail(".user@example.com")).toBe(false);
    });

    it("应该拒绝本地部分以点结尾的邮箱", () => {
      expect(validateEmail("user.@example.com")).toBe(false);
    });

    it("应该拒绝包含无效字符的邮箱", () => {
      expect(validateEmail("user name@example.com")).toBe(false);
      expect(validateEmail("user@exam ple.com")).toBe(false);
      expect(validateEmail("user@exam$ple.com")).toBe(false);
    });

    it("应该拒绝域名部分以连字符开头的邮箱", () => {
      expect(validateEmail("user@-example.com")).toBe(false);
    });

    it("应该拒绝域名部分以连字符结尾的邮箱", () => {
      expect(validateEmail("user@example-.com")).toBe(false);
    });

    it("应该拒绝顶级域名为纯数字的邮箱", () => {
      expect(validateEmail("user@example.123")).toBe(false);
    });

    it("应该拒绝过长的邮箱地址", () => {
      // 测试超过 320 字符的情况（RFC 5321 限制）
      const longEmail = "a".repeat(321) + "@example.com";
      expect(validateEmail(longEmail)).toBe(false);
    });
  });

  describe("边界情况", () => {
    it("应该处理包含首尾空格的邮箱", () => {
      expect(validateEmail("  user@example.com  ")).toBe(true);
    });

    it("应该拒绝只包含空格的字符串", () => {
      expect(validateEmail("   ")).toBe(false);
    });

    it("应该接受最大长度的有效邮箱", () => {
      // 本地部分最大 64 字符，域名部分最大 255 字符
      const localPart = "a".repeat(64);
      const domainPart = "example.com";
      expect(validateEmail(`${localPart}@${domainPart}`)).toBe(true);
    });
  });
});
