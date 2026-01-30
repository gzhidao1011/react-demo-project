# 国外主流 SaaS AI 应用平台登录后跳转分析

本文档分析国外主流 SaaS AI 应用平台在用户登录成功后的跳转目的地，供产品设计参考。

## 一、平台跳转行为汇总

| 平台 | 登录后跳转目的地 | 特殊逻辑 | 备注 |
|------|------------------|----------|------|
| **ChatGPT** (OpenAI) | `/c/{conversationId}` | 跳转到主聊天界面，通常是最近对话或新建对话 | 核心功能即聊天，直接进入工作区 |
| **Claude** (Anthropic) | `/` 或 `/onboarding` | 新用户优先跳转 `/onboarding` 完成引导 | 支持 `returnTo` 参数自定义跳转 |
| **Google AI Studio** (Gemini) | `aistudio.google.com/` | 登录后回到 AI Studio 首页 | 使用 Google 账号体系，`continue` 参数指定回跳地址 |
| **Jasper AI** | `/` (根路径) | 支持 `redirect_path` 参数 | 默认跳转到应用根路径（主工作区） |
| **Copy.ai** | 自定义 `redirect_uri` | OAuth 流程中由 `redirect_uri` 指定 | 面向 API/文档场景 |
| **Perplexity AI** | 主搜索/聊天界面 | 登录后回到当前页面或主界面 | 无明确公开文档 |

## 二、典型跳转模式

### 1. 直接进入核心工作区（ChatGPT 模式）

- **跳转目标**：主功能界面（如聊天、对话列表）
- **典型路径**：`/c/1`、`/chat`、`/` 等
- **适用场景**：产品以单一核心功能为主，用户登录后应尽快开始使用
- **代表产品**：ChatGPT、Perplexity

### 2. 新用户引导 + 老用户直达（Claude 模式）

- **跳转目标**：新用户 → `/onboarding`；老用户 → `/` 或上次访问页
- **实现方式**：通过 `returnTo` 或类似参数，结合用户状态判断
- **适用场景**：需要引导新用户完成设置、偏好或教程
- **代表产品**：Claude

### 3. 可配置跳转（Jasper / OAuth 模式）

- **跳转目标**：由 `redirect_path`、`redirect_uri`、`returnTo` 等参数指定
- **典型用法**：从某功能页触发登录 → 登录后回到该页
- **适用场景**：需要支持「从哪里来，回哪里去」的体验
- **代表产品**：Jasper、Copy.ai、Claude

### 4. 回到首页（Google AI Studio 模式）

- **跳转目标**：应用根路径 `/` 或首页
- **适用场景**：首页即工作入口，或作为多产品入口的聚合页
- **代表产品**：Google AI Studio

## 三、URL 参数约定

| 参数名 | 平台 | 用途 |
|--------|------|------|
| `returnTo` | Claude | 登录成功后跳转的路径 |
| `redirect_path` | Jasper | 同上 |
| `redirect_uri` | Copy.ai、OAuth 标准 | 同上 |
| `next` | 常见约定 | 同上 |
| `continue` | Google | OAuth 完成后继续的 URL |

## 四、设计建议

### 1. 基础跳转逻辑

- **默认跳转**：登录成功后跳转到**主工作区/核心功能页**（如 `/`、`/dashboard`、`/chat`）
- **避免**：长时间停留在登录页或空白页

### 2. 支持「从哪里来，回哪里去」

- 在登录页 URL 中支持 `returnTo`、`next` 或 `redirect` 参数
- 示例：`/sign-in?returnTo=/settings` → 登录后跳转到 `/settings`
- 需校验目标路径为站内路径，防止开放重定向

### 3. 新用户 vs 老用户

- **新用户**：可优先跳转到引导页（如 `/onboarding`、`/welcome`）
- **老用户**：直接进入主工作区或上次访问页
- 可通过用户元数据（如 `isFirstLogin`、`onboardingCompleted`）区分

### 4. 与当前项目对比

当前项目（`apps/web`）登录后跳转到 `/`（首页），与多数 SaaS AI 平台一致。若后续有独立工作区（如 `/dashboard`、`/chat`），建议：

- 将默认跳转改为工作区路径
- 增加 `returnTo` 支持，提升从深层页面触发登录时的体验

## 五、参考链接

- ChatGPT: https://chatgpt.com/auth/login
- Claude: https://claude.ai/login (支持 `returnTo` 参数)
- Google AI Studio: https://aistudio.google.com/
- Jasper: https://app.jasper.ai/auth/login?redirect_path=%2F
