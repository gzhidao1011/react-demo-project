---
name: 用户与权限管理后台设计
overview: 本计划采用 SSO + 独立认证服务改造方案：拆出 auth-service 统一负责登录/注册/JWT 签发与刷新，user-service 仅做用户与 RBAC、不再签发 Token；实现 RBAC 与 Admin 后台，对齐国外主流做法。后端设计见 后端.md，前端设计见 前端.md；本文档为总览、设计原则、主流参考与术语表。
todos: []
isProject: false
---

# 用户与权限管理后台设计方案

本计划拆分为 **后端** 与 **前端** 两份文档，便于按职责阅读与实施：

- **[后端.md](后端.md)**：架构与 Token 流、数据模型与迁移、管理 API、方法级鉴权、审计日志、限流、实施顺序与涉及文件、SSO 改造方案详细说明。
- **[前端.md](前端.md)**：Admin 路由与布局、接口与类型、页面与组件、权限与 UI 控制、与后端约定、实施顺序与涉及文件。

---

## 一、项目现状简要结论

- **认证**：user-service 已实现注册/登录、JWT（Access + Refresh）、邮箱验证、密码重置；[JwtService](services/user-service/src/main/java/com/example/user/service/JwtService.java) 支持在 Token 中写入 `roles`，[JwtAuthFilter](services/user-service/src/main/java/com/example/user/config/JwtAuthFilter.java) 已解析 `roles` 并转为 Spring Security 的 `ROLE_xxx`。
- **用户数据**：[UserEntity](services/user-service/src/main/java/com/example/user/entity/UserEntity.java) 仅有 id/name/email/phone/password/emailVerified 等，**无角色/权限字段**；[UserController](services/user-service/src/main/java/com/example/user/controller/UserController.java) 对 `/api/users/**` 提供完整 CRUD，[SecurityConfig](services/user-service/src/main/java/com/example/user/config/SecurityConfig.java) 仅要求 `authenticated()`，**未做角色或权限校验**，任意登录用户均可访问。
- **前端**：[UserInfo](packages/services/src/auth.service.ts) 已有可选 `roles`；路由仅有 home/chat/settings/sign-in/sign-up 等，**无 Admin 或用户/角色管理页面**。
- **数据库**：user-service 使用 Flyway，当前仅有 `users`、`email_verification_tokens`、`password_reset_tokens`；Nacos 的 `users/roles/permissions` 表与业务用户无关。

**目标**：采用 **SSO + 独立认证服务颁发 Token**，并实现 **RBAC（角色+权限）** 与 **Admin 后台**，对齐国外常见做法（REST、分页、权限控制、审计可扩展）。

### 本方案架构（SSO + 独立认证服务）

- **认证架构**：拆出独立 **auth-service** 作为身份提供商（IdP），**唯一负责**登录、注册、JWT 签发与刷新、邮箱验证、密码重置；**user-service** 仅负责用户 CRUD、RBAC、管理 API、审计，**不再签发 Token**，仅校验 auth-service 颁发的 JWT。
- **网关**：`/api/auth/**` → **auth-service**；`/api/users/**`、`/api/user/**` → **user-service**；其余业务路由不变。
- **SSO**：同一 auth-service 为多前端/多应用颁发同一套 JWT，一次登录可访问所有授权应用；各业务服务统一校验该 JWT（公钥一致即可）。

### 设计原则小结

- **最小权限**：默认无管理权限，仅显式授予的角色/权限可访问管理接口与 UI。
- **审计可追溯**：敏感操作写审计日志，满足 SOC2/GDPR 等合规要求。
- **安全默认**：软删除、限流、方法级鉴权、错误信息不泄露内部细节。
- **API 一致性**：REST 风格、统一错误格式（与现有 [ResultCode](services/api-common/src/main/java/com/example/api/common/ResultCode.java) 一致）、分页与筛选约定统一。
- **前端体验**：独立 Admin 区、按权限显隐、空状态与加载态、筛选与 URL 同步（可分享/书签）。

### 主流参考与标准

| 来源 | 参考点 |
|------|--------|
| **Stripe** | [Idempotency Keys](https://stripe.com/docs/api/idempotent_requests)、REST 分页、错误码与 `type` 字段、限流与 `Retry-After` |
| **GitHub** | [REST API](https://docs.github.com/en/rest)、分页 `page`/`per_page`、[Rate Limit](https://docs.github.com/en/rest/rate-limit) 响应头、OAuth2/Scopes |
| **Auth0** | RBAC、[Refresh Token Rotation](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)、MFA、审计日志 |
| **Vercel** | 团队/权限、API 版本与错误格式、Dashboard 布局与空状态 |
| **OWASP** | [Authentication](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)、[Session](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)、密码策略、限流防暴力破解 |
| **RFC / 标准** | [RFC 7807 Problem Details](https://datatracker.ietf.org/doc/html/rfc7807)（可选统一错误体）、[RFC 6585](https://datatracker.ietf.org/doc/html/rfc6585) 429 + Retry-After、OAuth2/OIDC 术语 |

本方案在错误码与响应结构上沿用现有 [ResultCode](services/api-common/src/main/java/com/example/api/common/ResultCode.java) 与 [Result](services/api-common/src/main/java/com/example/api/common/Result.java)，不强制引入 RFC 7807，仅在对齐点中注明可选扩展。

### 实施顺序总览

1. **新建 auth-service**（见 [后端.md](后端.md) 第三章）
2. **网关路由调整**（见 [后端.md](后端.md) 第三章）
3. **user-service 改造**（见 [后端.md](后端.md) 第三章）
4. **RBAC 与 Admin 后端**（见 [后端.md](后端.md) 第三章）
5. **前端 Admin 与其它业务服务**（见 [前端.md](前端.md) 第三章）

联调与验证、测试与文档、上线前检查分别见 [后端.md](后端.md) 与 [前端.md](前端.md)。

---

## 二、术语表

| 术语 | 说明 |
|------|------|
| **RBAC** | Role-Based Access Control，基于角色的访问控制；User–Role–Permission 多对多模型。 |
| **软删除** | 不物理删除记录，仅设置 `deleted_at`；列表默认过滤已删除，支持恢复与审计。 |
| **幂等键** | Idempotency-Key：同一 key 的重复请求在有效期内返回首次结果，避免重复创建（Stripe 等）。 |
| **乐观锁** | 通过 `version` 或 ETag 检测并发修改，冲突时返回 409，避免覆盖。 |
| **审计日志** | 记录“谁在何时对何资源做了何操作”，满足 SOC2/GDPR 等合规。 |
| **限流** | 对认证/管理接口按 IP 或 user 限制请求频率，超出返回 429 + Retry-After。 |
| **方法级鉴权** | 使用 `@PreAuthorize` 等在方法执行前校验角色/权限，未通过返回 403。 |
| **PermissionGuard** | 前端根据角色/权限决定是否渲染某 UI（按钮、菜单、路由）。 |
| **包裹式分页** | 列表接口 `data` 含 `items` + `total`/`page`/`size`，与现有 Result 一致，便于前端解析。 |
| **Idempotency-Key** | 请求头携带 UUID，同一 key 在有效期内重复请求返回首次结果，防止重复创建（Stripe）。 |
| **Request ID** | 请求级唯一标识（如 X-Request-Id），在响应头与审计/日志中透传，便于排查与关联（Stripe、AWS）。 |
| **指数退避** | 客户端对 429/5xx 重试时逐次增加延迟（如 1s、2s、4s），避免加重服务压力（AWS、Stripe）。 |
| **ISO 8601** | 日期时间格式标准（如 `2025-02-03T12:00:00Z`），API 传输与存储统一使用，与 Stripe/GitHub 一致。 |
| **204 No Content** | HTTP 状态码，表示成功且响应体无内容，常用于 DELETE 成功（RFC 7231）。 |
| **PATCH** | 部分更新（如仅更新角色、恢复软删除）；PUT 为全量替换，与 GitHub/Stripe 一致（RFC 7231）。 |
| **405 Method Not Allowed** | 资源存在但请求方法不被允许时返回，与 ResultCode.METHOD_NOT_ALLOWED 一致。 |
| **HSTS** | Strict-Transport-Security 响应头，强制仅通过 HTTPS 访问，与 OWASP/Stripe 一致。 |
| **Actor 快照** | 审计记录中操作人信息为操作时快照，不随用户后续改名/删号而修改，满足合规。 |
| **Onboarding** | 首次使用时的引导流程（如空状态 CTA、产品导览），与 Vercel、Linear 一致。 |
| **SSO** | Single Sign-On，单点登录；同一认证服务为多应用颁发 Token，一次登录多端可用（见 [后端.md](后端.md) 第五章）。 |
| **IdP** | Identity Provider，身份提供商；独立认证服务，负责认证并颁发 Token（见 [后端.md](后端.md) 第五章）。 |
