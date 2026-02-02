import { describe, expect, it } from "vitest";
import { translate } from "./use-translation";

describe("translate", () => {
  const messages = {
    home: {
      nav: { home: "首页", docs: "文档" },
      hero: { title: "构建下一代", titleHighlight: "应用系统" },
    },
    common: { save: "保存", cancel: "取消" },
    items: "{count, plural, =0 {无项目} =1 {1 个项目} other {# 个项目}}",
  };

  it("应该根据点分隔 key 返回嵌套值", () => {
    expect(translate(messages, "zh", "home.nav.home")).toBe("首页");
    expect(translate(messages, "zh", "home.nav.docs")).toBe("文档");
    expect(translate(messages, "zh", "common.save")).toBe("保存");
  });

  it("未找到 key 时返回 key 本身", () => {
    expect(translate(messages, "zh", "unknown.key")).toBe("unknown.key");
    expect(translate(messages, "zh", "home.unknown")).toBe("home.unknown");
  });

  it("应该支持 ICU 复数语法", () => {
    expect(translate(messages, "zh", "items", { count: 0 })).toBe("无项目");
    expect(translate(messages, "zh", "items", { count: 1 })).toBe("1 个项目");
    expect(translate(messages, "zh", "items", { count: 5 })).toBe("5 个项目");
  });
});
