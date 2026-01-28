# 认证 API 文档

本文档描述了认证相关的 API 接口。

## 基础信息

- **Base URL**：`http://localhost:8080/api`（开发环境）
- **认证方式**：Bearer Token（OAuth 2.0）
- **响应格式**：JSON

## 统一响应格式

所有 API 响应遵循以下格式：

```typescript
interface ApiResponseBase<T> {
  code: number;        // 业务状态码（0 或 200 表示成功）
  message: string;     // 错误消息
  data: T | null;      // 响应数据
  timestamp?: number;  // 时间戳
  traceId?: string;    // 追踪 ID
  errors?: Array<{     // 字段级错误数组（可选）
    field: string;     // 字段名
    message: string;   // 错误消息
    code?: string;     // 错误代码
  }>;
}
```

## 错误码说明

| 错误码 | 说明 | HTTP 状态码 |
|--------|------|-------------|
| 0 | 成功 | 200 |
| 40001 | 邮箱已被注册 | 400 |
| 40003 | 密码策略违反 | 400 |
| 40100 | 用户名或密码错误 | 400 |
| 40105 | 无效的 Refresh Token | 400 |
| 40106 | Refresh Token 已被使用 | 400 |
| 42900 | 请求过于频繁（限流） | 429 |

## API 接口

### 1. 用户注册

**接口**：`POST /api/auth/register`

**请求体**：

```json
{
  "email": "user@example.com",
  "password": "Password123!",
  "username": "username",  // 可选
  "phone": "13800138000"   // 可选
}
```

**响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": {
    "accessToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
    "expiresIn": 3600,
    "tokenType": "Bearer",
    "user": {
      "id": "1",
      "email": "user@example.com",
      "username": "username",
      "emailVerified": false
    }
  }
}
```

**错误响应示例**：

```json
{
  "code": 40001,
  "message": "邮箱已被注册",
  "data": null
}
```

### 2. 用户登录

**接口**：`POST /api/auth/login`

**请求体**：

```json
{
  "email": "user@example.com",
  "password": "Password123!"
}
```

**响应**：同注册接口响应格式

**错误响应示例**：

```json
{
  "code": 40100,
  "message": "用户名或密码错误",
  "data": null
}
```

### 3. 刷新 Token

**接口**：`POST /api/auth/refresh`

**请求体**：

```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应**：同注册接口响应格式

**错误响应示例**：

```json
{
  "code": 40105,
  "message": "无效的 Refresh Token",
  "data": null
}
```

### 4. 用户登出

**接口**：`POST /api/auth/logout`

**请求体**：

```json
{
  "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**响应**：

```json
{
  "code": 0,
  "message": "success",
  "data": null
}
```

## 安全响应头

所有认证相关的响应都包含以下安全响应头：

- `Cache-Control: no-store` - 禁止缓存 Token（RFC 6749）
- `Pragma: no-cache` - 兼容旧版浏览器

## 限流说明

### 登录接口限流

- **IP 限流**：每 IP 每小时最多 100 次登录尝试
- **用户限流**：每用户每 15 分钟最多 5 次登录尝试

超过限流时返回：

```json
{
  "code": 42900,
  "message": "请求过于频繁，请稍后再试",
  "data": null
}
```

HTTP 状态码：`429 Too Many Requests`

## 密码策略

密码必须满足以下要求：

- 最少 8 个字符
- 至少包含一个大写字母
- 至少包含一个小写字母
- 至少包含一个数字
- 至少包含一个特殊字符（!@#$%^&*等）

不符合策略时返回：

```json
{
  "code": 40003,
  "message": "密码策略违反：密码必须包含至少一个大写字母；密码必须包含至少一个特殊字符（!@#$%^&*等）",
  "data": null
}
```

## Token 说明

### Access Token

- **有效期**：30 分钟（1800 秒）
- **用途**：访问受保护的 API 资源
- **存储**：建议存储在内存中，不要存储在 localStorage

### Refresh Token

- **有效期**：7 天（604800 秒）
- **用途**：刷新 Access Token
- **存储**：可以存储在 httpOnly cookie 或安全的存储中
- **安全机制**：Token 轮换，使用后立即失效

## 使用示例

### JavaScript/TypeScript

```typescript
import { authRegister, authLogin, authRefresh } from "@repo/services";

// 注册
const registerResponse = await authRegister({
  email: "user@example.com",
  password: "Password123!",
});

// 登录
const loginResponse = await authLogin({
  email: "user@example.com",
  password: "Password123!",
});

// 刷新 Token
const refreshResponse = await authRefresh(refreshToken);
```

### cURL

```bash
# 注册
curl -X POST http://localhost:8080/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'

# 登录
curl -X POST http://localhost:8080/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "Password123!"
  }'

# 刷新 Token
curl -X POST http://localhost:8080/api/auth/refresh \
  -H "Content-Type: application/json" \
  -d '{
    "refreshToken": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9..."
  }'
```

## 相关文档

- [表单验证规范](../../.cursor/rules/09-表单验证.mdc)
- [表单错误处理规范](../../.cursor/rules/10-表单错误处理.mdc)
- [API 结构规范](../../.cursor/rules/06-API结构.mdc)
