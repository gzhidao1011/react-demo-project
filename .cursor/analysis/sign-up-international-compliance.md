# 注册流程国际主流合规性分析

> 分析对象：`apps/web/app/(all)/sign-up/page.tsx`  
> 参考标准：web.dev Sign-up Form Best Practices、NNGroup、OWASP Authentication Cheat Sheet

## 一、当前实现概览

| 项目 | 当前实现 |
|------|----------|
| 表单字段 | 邮箱、密码、确认密码 |
| 验证方式 | React Hook Form + Zod，`mode: "onBlur"` |
| 密码可见性 | ✅ 支持显示/隐藏 |
| 成功反馈 | Toast + 2 秒后跳转登录页 |
| 错误反馈 | 内联错误 + 表单级错误 |
| 可访问性 | ARIA 属性、`role="alert"`、`aria-invalid` |
| 社交登录 | ❌ 无 |

---

## 二、符合国际主流实践的部分 ✅

### 1. 表单简洁性

- **仅收集必要信息**：邮箱 + 密码，符合「ask for as little as possible」
- **无用户名**：web.dev 建议「Don't insist on a username unless you need one」，当前仅用邮箱 ✅

### 2. 密码管理

- **密码可见性**：支持显示/隐藏，符合主流做法 ✅
- **密码粘贴**：未禁止粘贴 ✅
- **约束提前说明**：placeholder 提示「至少 6 个字符」✅
- **autocomplete**：`autocomplete="email"`、`autocomplete="new-password"` ✅

### 3. 表单与验证

- **HTML 语义**：`<form>`、`<label>`、`<input type="email">` ✅
- **实时验证**：`mode: "onBlur"` 提供即时反馈 ✅
- **错误内联展示**：符合「Show problems inline and explain how to fix」✅

### 4. 可访问性

- **ARIA**：`aria-invalid`、`aria-describedby`、`role="alert"` ✅
- **label 关联**：`htmlFor` / `id` 正确关联 ✅

### 5. 导航与流程

- **登录入口**：「已有账户？立即登录」链接清晰 ✅
- **取消/返回**：提供取消按钮 ✅

### 6. 技术实现

- **OAuth 2.0 响应**：后端返回标准 Token 格式 ✅
- **密码哈希**：后端使用 BCrypt ✅（非前端职责）

---

## 三、与国际主流的差异与改进建议 ⚠️

### 1. 确认密码（Confirm Password）

**当前**：有「确认密码」字段。

**web.dev 建议**：

> Don't double up your inputs just to make sure users get their contact details right. That slows down form completion and doesn't make sense if form fields are autofilled. Instead, **send a confirmation code** to the user once they've entered their contact details, then continue with account creation once they respond.

**结论**：

- 主流趋势：减少重复输入，改用邮箱验证码确认身份
- 但「确认密码」仍被大量产品使用，尤其在非英语市场
- **建议**：若面向国际用户，可考虑移除确认密码，改为邮箱验证码；若面向国内用户，保留亦可接受

### 2. 邮箱验证（Email Verification）

**当前**：注册成功后直接跳转登录，无邮箱验证。

**主流做法**：

- GitHub、Gmail、Stripe 等：注册后要求验证邮箱
- web.dev：通过发送验证码到邮箱，在用户响应后再完成注册

**建议**：

- 增加邮箱验证流程：注册后发送验证链接或验证码
- 或至少提供「发送验证邮件」的扩展点，便于后续接入

### 3. 社交登录（Federated Login）

**当前**：仅支持邮箱 + 密码。

**web.dev 建议**：

> You should also enable users to sign in using a third-party identity provider, also known as federated login.

**主流产品**：多数提供 Google、Apple、GitHub 等社交登录。

**建议**：

- 增加 Google Sign-In、Apple Sign In 等
- 可参考项目内 `oauth-integration` skill 实现

### 4. 密码强度指示（Password Strength Meter）

**当前**：无实时强度指示。

**NNGroup / web.dev**：建议实时展示密码强度，并提前说明规则。

**建议**：

- 增加密码强度条（弱/中/强）
- 在输入时即时反馈，帮助用户选择更安全密码

### 5. 泄露密码检测（Compromised Password Check）

**当前**：未检测密码是否在泄露库中。

**web.dev / OWASP**：

> You should never allow passwords that have been exposed in security breaches. Have I Been Pwned provides an API for password checking.

**建议**：

- 在前端或后端接入 Have I Been Pwned API（或等价服务）
- 拒绝已知泄露密码并给出明确提示

### 6. 多因素认证（MFA）

**当前**：无 MFA。

**web.dev**：对敏感信息场景建议提供或强制 MFA。

**建议**：作为后续增强，在账户安全设置中支持 TOTP、短信验证等。

---

## 四、对比总结

| 维度 | 当前状态 | 主流实践 | 优先级 |
|------|----------|----------|--------|
| 表单字段精简 | ✅ 邮箱+密码 | 同左 | - |
| 无用户名 | ✅ | 同左 | - |
| 密码可见性 | ✅ | 同左 | - |
| 允许粘贴 | ✅ | 同左 | - |
| autocomplete | ✅ | 同左 | - |
| 确认密码 | ⚠️ 有 | 建议用验证码替代 | 中 |
| 邮箱验证 | ❌ 无 | 建议有 | **高** |
| 社交登录 | ❌ 无 | 建议有 | **高** |
| 密码强度 | ❌ 无 | 建议有 | 中 |
| 泄露密码检测 | ❌ 无 | 建议有 | 中 |
| MFA | ❌ 无 | 可选 | 低 |

---

## 五、结论与建议

### 总体评价

当前注册流程在**表单设计、验证、可访问性、密码基础体验**上已较好对齐国际实践，但在**身份验证强度**和**社交登录**上与主流产品仍有差距。

### 短期可做（低成本）

1. **密码强度指示**：前端增加简单强度条和规则说明
2. **文案与引导**：将「创建账户」等文案与主流产品对齐（如 "Create account"）

### 中期建议（需后端配合）

1. **邮箱验证**：注册后发送验证链接/验证码，验证通过后再允许完整使用
2. **社交登录**：接入 Google、Apple 等，提升转化和体验

### 长期增强

1. **泄露密码检测**：接入 Have I Been Pwned 或类似服务
2. **MFA**：在账户设置中支持 TOTP、短信等二次验证

---

## 六、参考资源

- [web.dev - Sign-up form best practices](https://web.dev/articles/sign-up-form-best-practices)
- [NNGroup - Registration and Login Forms Checklist](https://www.nngroup.com/articles/checklist-registration-login/)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [NIST Digital Identity Guidelines (SP 800-63B)](https://pages.nist.gov/800-63-3/sp800-63b.html)
