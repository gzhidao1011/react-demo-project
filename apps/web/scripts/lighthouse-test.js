#!/usr/bin/env node

/**
 * Lighthouse 性能测试脚本
 *
 * 使用方法：
 * 1. 安装 Lighthouse CLI：npm install -g lighthouse
 * 2. 启动开发服务器：pnpm dev
 * 3. 运行测试：node scripts/lighthouse-test.js
 *
 * 或者使用 Lighthouse CI：
 * npm install -g @lhci/cli
 * lhci autorun
 */

const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const BASE_URL = process.env.LIGHTHOUSE_BASE_URL || "http://localhost:5173";
const OUTPUT_DIR = path.join(__dirname, "../lighthouse-reports");

// 创建输出目录
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

const pages = [
  { name: "home", path: "/" },
  { name: "sign-in", path: "/sign-in" },
  { name: "sign-up", path: "/sign-up" },
];

console.log("🚀 开始 Lighthouse 性能测试...\n");

pages.forEach((page) => {
  const url = `${BASE_URL}${page.path}`;
  const outputPath = path.join(OUTPUT_DIR, `${page.name}.html`);

  console.log(`📊 测试页面: ${page.name} (${url})`);

  try {
    execSync(
      `lighthouse ${url} --output=html --output-path=${outputPath} --chrome-flags="--headless" --only-categories=performance,accessibility,best-practices,seo`,
      { stdio: "inherit" },
    );

    console.log(`✅ ${page.name} 测试完成，报告已保存到: ${outputPath}\n`);
  } catch (error) {
    console.error(`❌ ${page.name} 测试失败:`, error.message);
  }
});

console.log("✨ 所有测试完成！");
console.log(`📁 报告位置: ${OUTPUT_DIR}`);
