# 后端 Locale Cookie 方案

本文档定义**已登录用户**的 locale 持久化方案，由后端通过 Cookie 存储。未登录用户仍使用前端 localStorage，详见主计划 [README.md](./README.md)。

---

## 一、适用场景

| 用户状态 | 存储位置 | 说明 |
|---------|---------|------|
| **未登录** | localStorage | 前端 `locale-preference`，与 theme 一致 |
| **已登录** | 后端 Cookie | 由后端 API 设置，跨设备同步（可选） |

---

## 二、Cookie 规范

### 2.1 Cookie 名称

```
locale
```

建议使用简短名称，与前端 localStorage key `locale-preference` 区分，避免混淆。

### 2.2 Cookie 值

| 值 | 说明 |
|----|------|
| `zh` | 简体中文 |
| `en` | 英文 |
| `ja` | 日语 |
| `ko` | 韩语 |
| ... | 其他 BCP 47 语言标签 |

仅存储语言代码，不含 region（如 `zh-CN` 可简化为 `zh`）。

### 2.3 Cookie 属性

| 属性 | 值 | 说明 |
|------|-----|------|
| **Path** | `/` | 全站生效 |
| **Max-Age** | `31536000`（1 年） | 或与 session 一致，按业务需求 |
| **SameSite** | `Lax` | 兼顾 CSRF 与跨站场景 |
| **Secure** | `true`（生产环境） | 仅 HTTPS 传输 |
| **HttpOnly** | `false` | 前端需读取以初始化 i18n，若仅后端使用可设为 `true` |

**说明**：若 locale 仅由后端使用（如 API 返回本地化内容），可设 `HttpOnly=true`，前端通过 API 响应体获取当前 locale。若前端需在首屏即知 locale（如 SSR、避免闪烁），则 `HttpOnly=false`，前端可从 `document.cookie` 读取。

### 2.4 Set-Cookie 示例

```
Set-Cookie: locale=zh; Path=/; Max-Age=31536000; SameSite=Lax; Secure
```

---

## 三、后端 API

### 3.1 更新用户 Locale

**请求**：

```
PATCH /api/user/locale
Content-Type: application/json

{ "locale": "en" }
```

**响应**：

- 成功：`200 OK`，响应头包含 `Set-Cookie: locale=en; ...`
- 失败：`400 Bad Request`（locale 非法）或 `401 Unauthorized`（未登录）

**说明**：也可合并到 `PATCH /api/user/profile`，在更新用户资料时一并更新 locale 并设置 Cookie。

### 3.2 获取当前 Locale（可选）

若采用 `HttpOnly=true`，前端无法读 Cookie，需提供接口：

```
GET /api/user/locale
```

**响应**：

```json
{ "locale": "zh" }
```

或在使用者信息接口（如 `GET /api/user/me`）的响应体中包含 `locale` 字段。

---

## 四、前端与后端协作流程

### 4.1 已登录用户切换语言

1. 用户点击 LocaleSwitcher 选择新语言
2. 前端调用 `PATCH /api/user/locale`，body 为 `{ "locale": "en" }`
3. 后端校验 locale、更新用户偏好，并在响应中设置 `Set-Cookie: locale=en; ...`
4. 前端收到成功响应后，更新 I18nContext 的 locale，并调用 `loadMessages("en")` 加载翻译
5. 若后端未返回 Set-Cookie，前端可降级为写入 localStorage，保证单次会话内生效

### 4.2 已登录用户首次加载

1. 前端发起页面请求或 `GET /api/user/me`
2. 若 Cookie 非 HttpOnly：从 `document.cookie` 解析 `locale`，作为初始 locale
3. 若 Cookie 为 HttpOnly：从 API 响应体（如 `user.locale`）获取
4. 若均无：使用 `defaultLocale`（如 `zh`）

### 4.3 未登录用户

- 读/写均使用 `localStorage.getItem("locale-preference")` / `localStorage.setItem(...)`
- 不调用后端 locale 相关 API

---

## 五、I18nProvider 配置扩展

`packages/i18n` 的 `I18nProvider` 需支持双存储模式，建议配置：

```typescript
interface I18nConfig {
  loadMessages: (locale: string) => Promise<Messages>
  defaultLocale?: string
  /** 是否已登录，用于选择持久化方式 */
  isAuthenticated?: boolean
  /** 已登录时更新 locale 的 API 调用 */
  onLocaleChange?: (locale: string) => Promise<void>
}
```

- `isAuthenticated`：来自 `@repo/user-store` 或 auth context
- `onLocaleChange`：已登录时实现为调用 `PATCH /api/user/locale`，未登录时实现为 `localStorage.setItem`

---

## 六、安全与兼容

1. **校验 locale**：后端仅接受白名单内的 locale（如 `zh`、`en`、`ja`、`ko` 等），拒绝非法值
2. **鉴权**：`PATCH /api/user/locale` 必须要求用户已登录
3. **CORS**：若前后端分离，确保 Cookie 的 `SameSite`、`Secure` 与域名配置正确，以便跨子域或同域携带 Cookie

---

## 七、相关文档

- [多语言功能计划 README](./README.md) - 主计划与前端实现
- [API 结构规范](../../../.cursor/rules/06-API结构.mdc) - 项目 API 约定
