# JWT 认证授权设计文档

> 本文档描述微服务架构中 JWT 认证授权的设计方案，包含整体架构、前端集成指南、API 规范和安全考虑。
> 
> 本设计参考 [RFC 7519](https://tools.ietf.org/html/rfc7519)、[OAuth 2.0](https://tools.ietf.org/html/rfc6749)、[Auth0 最佳实践](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation) 和 [OWASP 安全指南](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)。

## 目录

- [1. 概述](#1-概述)
- [2. 整体架构](#2-整体架构)
- [3. 前端集成指南（React）](#3-前端集成指南react)
- [4. API 接口规范](#4-api-接口规范)
- [5. 后端设计方案](#5-后端设计方案)
- [6. 安全规范](#6-安全规范)
- [7. 密码安全](#7-密码安全)
- [8. 限流与防护](#8-限流与防护)
- [9. 多设备与会话管理](#9-多设备与会话管理)
- [10. 双因素认证（2FA）](#10-双因素认证2fa)
- [11. 错误码定义](#11-错误码定义)

---

## 1. 概述

### 1.1 JWT 简介

JWT（JSON Web Token）是一种开放标准（RFC 7519），用于在各方之间安全地传输信息。JWT 由三部分组成：

```
Header.Payload.Signature
```

- **Header**：声明 Token 类型和签名算法
- **Payload**：携带用户信息和声明（Claims）
- **Signature**：用于验证 Token 完整性

**示例 JWT**：

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.
eyJzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6IuW8oOS4iSIsImlhdCI6MTUxNjIzOTAyMn0.
SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c
```

### 1.2 签名算法选择

根据 [OWASP JWT 安全指南](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)，选择合适的签名算法至关重要：

| 算法 | 类型 | 密钥 | 安全性 | 推荐场景 |
|------|------|------|--------|----------|
| **HS256** | 对称加密 | 共享密钥 | 中 | 单体应用、内部服务 |
| **HS384** | 对称加密 | 共享密钥 | 中高 | 需要更高安全性的内部服务 |
| **HS512** | 对称加密 | 共享密钥 | 高 | 高安全要求的内部服务 |
| **RS256** | 非对称加密 | 公钥/私钥 | 高 | 微服务架构（推荐） |
| **RS384** | 非对称加密 | 公钥/私钥 | 更高 | 企业级安全要求 |
| **RS512** | 非对称加密 | 公钥/私钥 | 最高 | 金融、医疗等高安全场景 |
| **ES256** | 椭圆曲线 | 公钥/私钥 | 高 | 移动端、性能敏感场景 |

#### 本项目推荐：RS256

**原因**：
1. **微服务架构**：Auth Service 用私钥签名，其他服务用公钥验证，无需共享密钥
2. **密钥轮换**：只需更新私钥，公钥可提前分发
3. **安全审计**：只有 Auth Service 能签发 Token，便于追踪
4. **行业标准**：Auth0、Okta、Firebase Auth 默认使用 RS256

```java
// RS256 密钥对生成示例
KeyPairGenerator keyPairGenerator = KeyPairGenerator.getInstance("RSA");
keyPairGenerator.initialize(2048);
KeyPair keyPair = keyPairGenerator.generateKeyPair();
PrivateKey privateKey = keyPair.getPrivate();  // 只在 Auth Service 使用
PublicKey publicKey = keyPair.getPublic();     // 分发给所有需要验证的服务
```

### 1.3 OAuth 2.0 对齐

本设计遵循 OAuth 2.0 规范（RFC 6749），支持以下授权模式：

| Grant Type | 适用场景 | 本项目支持 |
|------------|----------|------------|
| `password` | 可信客户端（自有 App） | ✅ 支持 |
| `refresh_token` | Token 刷新 | ✅ 支持 |
| `authorization_code` | 第三方登录 | 🔮 预留 |
| `client_credentials` | 服务间调用 | 🔮 预留 |

**Token Response 遵循 OAuth 2.0 格式**：

```json
{
    "access_token": "eyJhbGciOiJSUzI1NiIs...",
    "token_type": "Bearer",
    "expires_in": 1800,
    "refresh_token": "dGhpcyBpcyBhIHJlZnJlc2gg...",
    "scope": "read write"
}
```

### 1.4 为什么选择 JWT

| 特性 | JWT | Session |
|------|-----|---------|
| **无状态** | ✅ 服务端无需存储 | ❌ 需要存储 Session |
| **分布式友好** | ✅ 天然支持 | ❌ 需要共享 Session |
| **跨域支持** | ✅ 通过 Header 传递 | ❌ 依赖 Cookie |
| **移动端支持** | ✅ 通用 | ❌ Cookie 支持有限 |
| **微服务架构** | ✅ 适合网关统一验证 | ❌ 复杂 |

**选择 JWT 的原因**：

1. **微服务架构**：服务间无状态通信，网关统一验证
2. **分布式部署**：无需 Session 共享，便于横向扩展
3. **前后端分离**：前端可以独立管理 Token 生命周期

---

## 2. 整体架构

### 2.1 服务架构图

```mermaid
graph TB
    subgraph frontend [前端应用]
        React[React App]
    end
    
    subgraph gateway [API 网关层]
        GW[API Gateway<br/>端口 8080]
        JwtFilter[JWT 过滤器]
    end
    
    subgraph services [微服务层]
        Auth[Auth Service<br/>端口 8003]
        User[User Service<br/>端口 8001]
        Order[Order Service<br/>端口 8002]
    end
    
    subgraph infra [基础设施层]
        Nacos[Nacos<br/>服务注册]
        MySQL[(MySQL)]
        Redis[(Redis<br/>Token 黑名单)]
    end
    
    React-->GW
    GW-->JwtFilter
    JwtFilter-->Auth
    JwtFilter-->User
    JwtFilter-->Order
    Auth-.Dubbo.->User
    Auth-->MySQL
    Auth-->Redis
    User-->MySQL
    Order-->MySQL
    GW-->Nacos
    Auth-->Nacos
    User-->Nacos
    Order-->Nacos
```

### 2.2 认证流程

#### 2.2.1 登录流程

```mermaid
sequenceDiagram
    participant FE as React 前端
    participant GW as API Gateway
    participant Auth as Auth Service
    participant User as User Service
    participant DB as MySQL
    
    FE->>GW: POST /api/auth/login<br/>{username, password}
    GW->>Auth: 转发登录请求
    Auth->>User: getUserByUsername (Dubbo RPC)
    User->>DB: 查询用户
    DB-->>User: 用户数据
    User-->>Auth: 返回用户信息
    Auth->>Auth: 验证密码
    Auth->>Auth: 生成 JWT Token
    Auth-->>GW: 返回 Token 响应
    GW-->>FE: {accessToken, refreshToken, expiresIn}
    
    Note over FE: 存储 Token 到 localStorage
```

#### 2.2.2 请求认证流程

```mermaid
sequenceDiagram
    participant FE as React 前端
    participant GW as API Gateway
    participant Filter as JWT 过滤器
    participant User as User Service
    
    FE->>GW: GET /api/users/1<br/>Authorization: Bearer {token}
    GW->>Filter: 进入 JWT 过滤器
    
    alt Token 有效
        Filter->>Filter: 解析 Token
        Filter->>Filter: 验证签名和有效期
        Filter->>GW: 注入用户信息到 Header
        GW->>User: 转发请求<br/>X-User-Id: 123
        User-->>FE: 返回用户数据
    else Token 无效/过期
        Filter-->>FE: 401 Unauthorized
    end
```

#### 2.2.3 Token 刷新流程

```mermaid
sequenceDiagram
    participant FE as React 前端
    participant GW as API Gateway
    participant Auth as Auth Service
    
    Note over FE: Access Token 过期
    
    FE->>GW: POST /api/auth/refresh<br/>{refreshToken}
    GW->>Auth: 转发刷新请求
    Auth->>Auth: 验证 Refresh Token
    
    alt Refresh Token 有效
        Auth->>Auth: 生成新的 Access Token
        Auth-->>FE: {accessToken, expiresIn}
    else Refresh Token 无效/过期
        Auth-->>FE: 401 需要重新登录
    end
```

### 2.3 组件职责说明

| 组件 | 职责 |
|------|------|
| **API Gateway** | 统一入口，路由转发，JWT 验证 |
| **JWT 过滤器** | 拦截请求，验证 Token，注入用户信息 |
| **Auth Service** | 用户认证，Token 生成和刷新 |
| **User Service** | 用户数据管理，提供 Dubbo 接口 |
| **Redis** | 存储 Token 黑名单（登出时使用） |

---

## 3. 前端集成指南（React）

### 3.1 登录流程概述

```
用户输入账号密码 
    → 调用登录 API 
    → 获取 Token 
    → 存储 Token 
    → 后续请求自动携带 Token
```

### 3.2 Token 存储策略

#### 存储方案对比

| 存储方式 | 安全性 | 便捷性 | 推荐场景 |
|----------|--------|--------|----------|
| `localStorage` | 中（XSS 风险） | 高 | 一般 Web 应用 |
| `sessionStorage` | 中 | 中 | 单标签页应用 |
| `httpOnly Cookie` | 高 | 低 | 高安全要求 |
| `内存 + Refresh Token` | 高 | 中 | 推荐方案 |

#### 推荐方案

```
Access Token  → 存储在内存（变量）中，生命周期短（15-30 分钟）
Refresh Token → 存储在 localStorage，生命周期长（7-30 天）
```

### 3.3 完整代码示例

#### 3.3.1 Token 管理工具

```typescript
// src/utils/auth.ts

// Token 存储 Key
const ACCESS_TOKEN_KEY = 'access_token'
const REFRESH_TOKEN_KEY = 'refresh_token'
const TOKEN_EXPIRES_KEY = 'token_expires'

// 内存中的 Access Token（更安全）
let accessTokenInMemory: string | null = null

/**
 * 获取 Access Token
 * 优先从内存获取，内存没有则从 localStorage 获取
 */
export const getAccessToken = (): string | null => {
  if (accessTokenInMemory) {
    return accessTokenInMemory
  }
  return localStorage.getItem(ACCESS_TOKEN_KEY)
}

/**
 * 设置 Access Token
 */
export const setAccessToken = (token: string): void => {
  accessTokenInMemory = token
  localStorage.setItem(ACCESS_TOKEN_KEY, token)
}

/**
 * 获取 Refresh Token
 */
export const getRefreshToken = (): string | null => {
  return localStorage.getItem(REFRESH_TOKEN_KEY)
}

/**
 * 设置 Refresh Token
 */
export const setRefreshToken = (token: string): void => {
  localStorage.setItem(REFRESH_TOKEN_KEY, token)
}

/**
 * 设置 Token 过期时间
 */
export const setTokenExpires = (expiresIn: number): void => {
  const expiresAt = Date.now() + expiresIn * 1000
  localStorage.setItem(TOKEN_EXPIRES_KEY, expiresAt.toString())
}

/**
 * 检查 Token 是否过期
 */
export const isTokenExpired = (): boolean => {
  const expiresAt = localStorage.getItem(TOKEN_EXPIRES_KEY)
  if (!expiresAt) return true
  // 提前 60 秒判断为过期，预留刷新时间
  return Date.now() > parseInt(expiresAt) - 60000
}

/**
 * 保存登录响应的 Token
 */
export const saveTokens = (response: LoginResponse): void => {
  setAccessToken(response.accessToken)
  setRefreshToken(response.refreshToken)
  setTokenExpires(response.expiresIn)
}

/**
 * 清除所有 Token（登出时使用）
 */
export const clearTokens = (): void => {
  accessTokenInMemory = null
  localStorage.removeItem(ACCESS_TOKEN_KEY)
  localStorage.removeItem(REFRESH_TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRES_KEY)
}

/**
 * 检查是否已登录
 */
export const isAuthenticated = (): boolean => {
  return !!getAccessToken() && !isTokenExpired()
}

// 类型定义
export interface LoginResponse {
  accessToken: string
  refreshToken: string
  expiresIn: number  // 秒
  tokenType: string
}
```

#### 3.3.2 Axios 实例配置

```typescript
// src/utils/request.ts

import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios'
import {
  getAccessToken,
  getRefreshToken,
  saveTokens,
  clearTokens,
  isTokenExpired,
  LoginResponse,
} from './auth'

// 创建 Axios 实例
const request: AxiosInstance = axios.create({
  baseURL: 'http://localhost:8080',  // API Gateway 地址
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 是否正在刷新 Token
let isRefreshing = false
// 等待 Token 刷新的请求队列
let refreshSubscribers: Array<(token: string) => void> = []

/**
 * 将请求加入等待队列
 */
const subscribeTokenRefresh = (callback: (token: string) => void) => {
  refreshSubscribers.push(callback)
}

/**
 * 刷新完成后，执行队列中的请求
 */
const onTokenRefreshed = (newToken: string) => {
  refreshSubscribers.forEach((callback) => callback(newToken))
  refreshSubscribers = []
}

/**
 * 刷新 Token
 */
const refreshToken = async (): Promise<string | null> => {
  const refreshTokenValue = getRefreshToken()
  if (!refreshTokenValue) {
    return null
  }

  try {
    // 注意：刷新 Token 请求不要走拦截器，避免循环
    const response = await axios.post<ApiResponse<LoginResponse>>(
      'http://localhost:8080/api/auth/refresh',
      { refreshToken: refreshTokenValue }
    )

    if (response.data.code === 0 && response.data.data) {
      const tokenData = response.data.data
      saveTokens(tokenData)
      return tokenData.accessToken
    }
    return null
  } catch (error) {
    return null
  }
}

/**
 * 请求拦截器 - 自动添加 Token
 */
request.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // 白名单路径不需要 Token
    const whiteList = ['/api/auth/login', '/api/auth/register', '/api/auth/refresh']
    if (whiteList.some((path) => config.url?.includes(path))) {
      return config
    }

    let token = getAccessToken()

    // 如果 Token 即将过期，尝试刷新
    if (token && isTokenExpired()) {
      if (!isRefreshing) {
        isRefreshing = true
        const newToken = await refreshToken()
        isRefreshing = false

        if (newToken) {
          token = newToken
          onTokenRefreshed(newToken)
        } else {
          // 刷新失败，清除 Token，跳转登录
          clearTokens()
          window.location.href = '/login'
          return Promise.reject(new Error('Token 刷新失败'))
        }
      } else {
        // 正在刷新中，等待刷新完成
        return new Promise((resolve) => {
          subscribeTokenRefresh((newToken: string) => {
            config.headers.Authorization = `Bearer ${newToken}`
            resolve(config)
          })
        })
      }
    }

    // 添加 Authorization Header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }

    return config
  },
  (error: AxiosError) => {
    return Promise.reject(error)
  }
)

/**
 * 响应拦截器 - 统一错误处理
 */
request.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse<unknown>

    // 业务错误处理
    if (data.code !== 0) {
      // 可以在这里添加全局错误提示
      console.error(`API 错误: ${data.message}`)
      return Promise.reject(new Error(data.message))
    }

    return response
  },
  async (error: AxiosError<ApiResponse<unknown>>) => {
    const { response, config } = error

    // 401 未授权处理
    if (response?.status === 401) {
      // 如果是刷新 Token 的请求返回 401，直接跳转登录
      if (config?.url?.includes('/api/auth/refresh')) {
        clearTokens()
        window.location.href = '/login'
        return Promise.reject(error)
      }

      // 尝试刷新 Token
      if (!isRefreshing) {
        isRefreshing = true
        const newToken = await refreshToken()
        isRefreshing = false

        if (newToken) {
          onTokenRefreshed(newToken)
          // 重试原请求
          if (config) {
            config.headers.Authorization = `Bearer ${newToken}`
            return request(config)
          }
        } else {
          clearTokens()
          window.location.href = '/login'
        }
      } else {
        // 等待 Token 刷新完成后重试
        return new Promise((resolve) => {
          subscribeTokenRefresh((token: string) => {
            if (config) {
              config.headers.Authorization = `Bearer ${token}`
              resolve(request(config))
            }
          })
        })
      }
    }

    // 其他错误
    const errorMessage = response?.data?.message || error.message || '网络错误'
    console.error(`请求错误: ${errorMessage}`)
    return Promise.reject(error)
  }
)

// API 响应类型定义
export interface ApiResponse<T> {
  code: number
  message: string
  data: T | null
  timestamp: number
  traceId: string
  errors?: Array<{ field: string; message: string; code: string }>
}

export default request
```

#### 3.3.3 认证 API 封装

```typescript
// src/api/auth.ts

import request, { ApiResponse } from '@/utils/request'
import { LoginResponse, saveTokens, clearTokens } from '@/utils/auth'

// 登录请求参数
export interface LoginRequest {
  username: string
  password: string
}

// 注册请求参数
export interface RegisterRequest {
  username: string
  password: string
  email: string
  phone?: string
}

// 用户信息
export interface UserInfo {
  id: number
  username: string
  email: string
  phone: string
  roles: string[]
  createdAt: string
}

/**
 * 用户登录
 */
export const login = async (data: LoginRequest): Promise<LoginResponse> => {
  const response = await request.post<ApiResponse<LoginResponse>>('/api/auth/login', data)
  const tokenData = response.data.data!
  saveTokens(tokenData)
  return tokenData
}

/**
 * 用户注册
 */
export const register = async (data: RegisterRequest): Promise<UserInfo> => {
  const response = await request.post<ApiResponse<UserInfo>>('/api/auth/register', data)
  return response.data.data!
}

/**
 * 刷新 Token
 */
export const refreshAccessToken = async (refreshToken: string): Promise<LoginResponse> => {
  const response = await request.post<ApiResponse<LoginResponse>>('/api/auth/refresh', {
    refreshToken,
  })
  const tokenData = response.data.data!
  saveTokens(tokenData)
  return tokenData
}

/**
 * 用户登出
 */
export const logout = async (): Promise<void> => {
  try {
    await request.post('/api/auth/logout')
  } finally {
    clearTokens()
  }
}

/**
 * 获取当前用户信息
 */
export const getCurrentUser = async (): Promise<UserInfo> => {
  const response = await request.get<ApiResponse<UserInfo>>('/api/auth/me')
  return response.data.data!
}
```

#### 3.3.4 登录组件示例

```tsx
// src/pages/Login.tsx

import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login, LoginRequest } from '@/api/auth'

const Login: React.FC = () => {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [formData, setFormData] = useState<LoginRequest>({
    username: '',
    password: '',
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      await login(formData)
      // 登录成功，跳转到首页
      navigate('/')
    } catch (err) {
      setError(err instanceof Error ? err.message : '登录失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-container">
      <h1>用户登录</h1>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="username">用户名</label>
          <input
            type="text"
            id="username"
            name="username"
            value={formData.username}
            onChange={handleChange}
            required
          />
        </div>
        <div className="form-group">
          <label htmlFor="password">密码</label>
          <input
            type="password"
            id="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>
        {error && <div className="error-message">{error}</div>}
        <button type="submit" disabled={loading}>
          {loading ? '登录中...' : '登录'}
        </button>
      </form>
    </div>
  )
}

export default Login
```

#### 3.3.5 路由守卫

```tsx
// src/components/PrivateRoute.tsx

import React from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { isAuthenticated } from '@/utils/auth'

interface PrivateRouteProps {
  children: React.ReactNode
}

const PrivateRoute: React.FC<PrivateRouteProps> = ({ children }) => {
  const location = useLocation()
  
  if (!isAuthenticated()) {
    // 未登录，跳转到登录页，并记录当前路径
    return <Navigate to="/login" state={{ from: location }} replace />
  }

  return <>{children}</>
}

export default PrivateRoute
```

```tsx
// src/App.tsx - 路由配置示例

import { BrowserRouter, Routes, Route } from 'react-router-dom'
import PrivateRoute from '@/components/PrivateRoute'
import Login from '@/pages/Login'
import Dashboard from '@/pages/Dashboard'
import UserList from '@/pages/UserList'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* 公开路由 */}
        <Route path="/login" element={<Login />} />
        
        {/* 需要认证的路由 */}
        <Route
          path="/"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/users"
          element={
            <PrivateRoute>
              <UserList />
            </PrivateRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

export default App
```

---

## 4. API 接口规范

### 4.1 接口概览

| 接口 | 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|------|
| 登录 | POST | `/api/auth/login` | 否 | 用户登录，返回 Token |
| 注册 | POST | `/api/auth/register` | 否 | 用户注册 |
| 刷新 Token | POST | `/api/auth/refresh` | 否 | 使用 Refresh Token 获取新 Access Token |
| 登出 | POST | `/api/auth/logout` | 是 | 使当前 Token 失效 |
| 当前用户 | GET | `/api/auth/me` | 是 | 获取当前登录用户信息 |

### 4.2 登录接口

**请求**

```http
POST /api/auth/login
Content-Type: application/json

{
    "username": "zhangsan",
    "password": "123456"
}
```

**成功响应**

```json
HTTP/1.1 200 OK

{
    "code": 0,
    "message": "登录成功",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4...",
        "expiresIn": 1800,
        "tokenType": "Bearer"
    },
    "timestamp": 1737475200000,
    "traceId": "a1b2c3d4e5f6g7h8"
}
```

**失败响应**

```json
HTTP/1.1 401 Unauthorized

{
    "code": 40101,
    "message": "用户名或密码错误",
    "data": null,
    "timestamp": 1737475200000,
    "traceId": "a1b2c3d4e5f6g7h8"
}
```

### 4.3 注册接口

**请求**

```http
POST /api/auth/register
Content-Type: application/json

{
    "username": "zhangsan",
    "password": "123456",
    "email": "zhangsan@example.com",
    "phone": "13800138000"
}
```

**成功响应**

```json
HTTP/1.1 200 OK

{
    "code": 0,
    "message": "注册成功",
    "data": {
        "id": 1,
        "username": "zhangsan",
        "email": "zhangsan@example.com",
        "phone": "13800138000",
        "createdAt": "2026-01-21T12:00:00Z"
    },
    "timestamp": 1737475200000,
    "traceId": "a1b2c3d4e5f6g7h8"
}
```

**校验失败响应**

```json
HTTP/1.1 400 Bad Request

{
    "code": 40001,
    "message": "参数校验失败",
    "data": null,
    "timestamp": 1737475200000,
    "traceId": "a1b2c3d4e5f6g7h8",
    "errors": [
        { "field": "username", "message": "用户名已存在", "code": "Duplicate" },
        { "field": "email", "message": "邮箱格式不正确", "code": "Email" }
    ]
}
```

### 4.4 刷新 Token 接口

**请求**

```http
POST /api/auth/refresh
Content-Type: application/json

{
    "refreshToken": "dGhpcyBpcyBhIHJlZnJlc2ggdG9rZW4..."
}
```

**成功响应**

```json
HTTP/1.1 200 OK

{
    "code": 0,
    "message": "Token 刷新成功",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "expiresIn": 1800,
        "tokenType": "Bearer"
    },
    "timestamp": 1737475200000,
    "traceId": "a1b2c3d4e5f6g7h8"
}
```

**失败响应**

```json
HTTP/1.1 401 Unauthorized

{
    "code": 40102,
    "message": "Refresh Token 已过期，请重新登录",
    "data": null,
    "timestamp": 1737475200000,
    "traceId": "a1b2c3d4e5f6g7h8"
}
```

### 4.5 登出接口

**请求**

```http
POST /api/auth/logout
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**成功响应**

```json
HTTP/1.1 200 OK

{
    "code": 0,
    "message": "登出成功",
    "data": null,
    "timestamp": 1737475200000,
    "traceId": "a1b2c3d4e5f6g7h8"
}
```

### 4.6 获取当前用户信息

**请求**

```http
GET /api/auth/me
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**成功响应**

```json
HTTP/1.1 200 OK

{
    "code": 0,
    "message": "操作成功",
    "data": {
        "id": 1,
        "username": "zhangsan",
        "email": "zhangsan@example.com",
        "phone": "13800138000",
        "roles": ["USER"],
        "createdAt": "2026-01-21T12:00:00Z"
    },
    "timestamp": 1737475200000,
    "traceId": "a1b2c3d4e5f6g7h8"
}
```

---

## 5. 后端设计方案

### 5.1 Auth Service 模块结构

```
auth-service/
├── pom.xml
├── Dockerfile
└── src/main/java/com/example/auth/
    ├── AuthServiceApplication.java       # 启动类
    ├── controller/
    │   └── AuthController.java           # 认证 API 控制器
    ├── service/
    │   ├── AuthService.java              # 认证服务接口
    │   ├── impl/
    │   │   └── AuthServiceImpl.java      # 认证服务实现
    │   └── JwtService.java               # JWT 生成与验证
    ├── model/
    │   ├── LoginRequest.java             # 登录请求
    │   ├── RegisterRequest.java          # 注册请求
    │   ├── TokenResponse.java            # Token 响应
    │   └── RefreshTokenRequest.java      # 刷新 Token 请求
    ├── config/
    │   ├── SecurityConfig.java           # Spring Security 配置
    │   └── JwtConfig.java                # JWT 配置
    └── entity/
        └── RefreshTokenEntity.java       # Refresh Token 实体（可选，用于持久化）
```

### 5.2 JWT Token 结构设计（RFC 7519 标准）

#### Access Token 完整结构

**Header**：

```json
{
    "alg": "RS256",                       // 签名算法
    "typ": "JWT",                         // Token 类型
    "kid": "auth-service-key-2026-01"     // 密钥 ID（用于密钥轮换）
}
```

**Payload（Claims）**：

```json
{
    // ========== 标准声明（Registered Claims） ==========
    "iss": "https://auth.example.com",    // 签发者（Issuer）
    "sub": "user:123",                    // 主题（Subject）- 用户 ID
    "aud": ["api.example.com"],           // 受众（Audience）- 允许的服务
    "exp": 1737477000,                    // 过期时间（Expiration）
    "nbf": 1737475200,                    // 生效时间（Not Before）
    "iat": 1737475200,                    // 签发时间（Issued At）
    "jti": "a1b2c3d4-e5f6-7890-abcd",     // JWT ID（唯一标识，用于防重放）

    // ========== 自定义声明（Private Claims） ==========
    "username": "zhangsan",               // 用户名
    "email": "zhangsan@example.com",      // 邮箱
    "roles": ["USER", "ADMIN"],           // 角色列表
    "permissions": ["user:read", "order:write"],  // 权限列表
    "tenant_id": "tenant_001",            // 租户 ID（多租户场景）
    "device_id": "device_abc123",         // 设备标识
    "session_id": "sess_xyz789"           // 会话 ID（用于会话管理）
}
```

#### Claims 验证规则

| Claim | 验证方式 | 说明 |
|-------|----------|------|
| `iss` | 必须匹配配置的签发者 | 防止伪造的 Token |
| `aud` | 必须包含当前服务标识 | 确保 Token 是给当前服务的 |
| `exp` | 当前时间 < exp | Token 未过期 |
| `nbf` | 当前时间 >= nbf | Token 已生效 |
| `jti` | 检查黑名单/已使用列表 | 防止重放攻击 |

#### Refresh Token 设计

Refresh Token 使用 **不透明令牌**（Opaque Token）+ **数据库存储**：

```sql
-- refresh_tokens 表结构
CREATE TABLE refresh_tokens (
    id              BIGINT PRIMARY KEY AUTO_INCREMENT,
    token_hash      VARCHAR(64) NOT NULL UNIQUE,   -- Token 的 SHA-256 哈希
    user_id         BIGINT NOT NULL,
    device_id       VARCHAR(64),                   -- 设备标识
    device_name     VARCHAR(128),                  -- 设备名称（如 "iPhone 14"）
    ip_address      VARCHAR(45),                   -- 登录 IP
    user_agent      VARCHAR(512),                  -- User-Agent
    issued_at       TIMESTAMP NOT NULL,
    expires_at      TIMESTAMP NOT NULL,
    last_used_at    TIMESTAMP,                     -- 最后使用时间
    revoked         BOOLEAN DEFAULT FALSE,         -- 是否已撤销
    revoked_at      TIMESTAMP,
    revoked_reason  VARCHAR(128),                  -- 撤销原因
    created_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    INDEX idx_user_id (user_id),
    INDEX idx_token_hash (token_hash),
    INDEX idx_expires_at (expires_at)
);
```

**Refresh Token 特点**：

1. **不透明**：客户端无法解析内容，增加安全性
2. **可追踪**：存储设备信息，支持多设备管理
3. **可撤销**：单独撤销某个设备的登录状态
4. **可审计**：记录使用时间和 IP，便于安全审计

### 5.3 网关 JWT 过滤器设计

```java
// api-gateway/src/main/java/com/example/gateway/filter/JwtAuthFilter.java

/**
 * JWT 认证过滤器
 * 在网关层统一验证 Token，并将用户信息注入到请求头中
 */
@Component
public class JwtAuthFilter implements GlobalFilter, Ordered {

    @Autowired
    private JwtService jwtService;

    // 白名单路径（不需要认证）
    private static final List<String> WHITE_LIST = Arrays.asList(
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/refresh"
    );

    @Override
    public Mono<Void> filter(ServerWebExchange exchange, GatewayFilterChain chain) {
        ServerHttpRequest request = exchange.getRequest();
        String path = request.getPath().value();

        // 白名单路径直接放行
        if (isWhiteListed(path)) {
            return chain.filter(exchange);
        }

        // 从 Header 获取 Token
        String authHeader = request.getHeaders().getFirst(HttpHeaders.AUTHORIZATION);
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return unauthorized(exchange, "缺少认证信息");
        }

        String token = authHeader.substring(7);

        try {
            // 验证 Token 并解析用户信息
            Claims claims = jwtService.parseToken(token);
            
            // 将用户信息注入到请求头，传递给下游服务
            ServerHttpRequest mutatedRequest = request.mutate()
                .header("X-User-Id", claims.getSubject())
                .header("X-User-Name", claims.get("username", String.class))
                .header("X-User-Roles", String.join(",", claims.get("roles", List.class)))
                .build();

            return chain.filter(exchange.mutate().request(mutatedRequest).build());
        } catch (ExpiredJwtException e) {
            return unauthorized(exchange, "Token 已过期");
        } catch (JwtException e) {
            return unauthorized(exchange, "无效的 Token");
        }
    }

    @Override
    public int getOrder() {
        return -100;  // 优先级高，在其他过滤器之前执行
    }

    private boolean isWhiteListed(String path) {
        return WHITE_LIST.stream().anyMatch(path::startsWith);
    }

    private Mono<Void> unauthorized(ServerWebExchange exchange, String message) {
        ServerHttpResponse response = exchange.getResponse();
        response.setStatusCode(HttpStatus.UNAUTHORIZED);
        response.getHeaders().setContentType(MediaType.APPLICATION_JSON);
        
        String body = String.format(
            "{\"code\":40100,\"message\":\"%s\",\"data\":null,\"timestamp\":%d}",
            message, System.currentTimeMillis()
        );
        
        DataBuffer buffer = response.bufferFactory().wrap(body.getBytes(StandardCharsets.UTF_8));
        return response.writeWith(Mono.just(buffer));
    }
}
```

### 5.4 路由白名单配置

在 `api-gateway/application.yml` 中配置：

```yaml
spring:
  cloud:
    gateway:
      routes:
        # 认证服务路由
        - id: auth-service
          uri: lb://auth-service
          predicates:
            - Path=/api/auth/**

# JWT 配置
jwt:
  secret: your-256-bit-secret-key-here-at-least-32-characters
  access-token-expiration: 1800      # Access Token 有效期（秒），30 分钟
  refresh-token-expiration: 604800   # Refresh Token 有效期（秒），7 天
  
# 认证白名单（不需要 Token 的路径）
auth:
  white-list:
    - /api/auth/login
    - /api/auth/register
    - /api/auth/refresh
    - /actuator/**
```

---

## 6. 安全规范

### 6.1 Token 有效期策略

根据 [Auth0 最佳实践](https://auth0.com/docs/secure/tokens/token-best-practices)：

| Token 类型 | 有效期 | 存储位置 | 说明 |
|------------|--------|----------|------|
| Access Token | 15-30 分钟 | 内存（推荐）/ localStorage | 短期有效，减少泄露风险 |
| Refresh Token | 7-30 天 | localStorage / httpOnly Cookie | 长期有效，用于刷新 Access Token |
| Remember Me Token | 90 天 | httpOnly Cookie | "记住我"场景 |

### 6.2 Refresh Token Rotation（轮换机制）

根据 [Auth0 Refresh Token Rotation](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)，推荐实现 **Token 轮换**：

```mermaid
sequenceDiagram
    participant Client as 前端
    participant Auth as Auth Service
    participant DB as 数据库
    
    Note over Client: Refresh Token: RT_1
    
    Client->>Auth: POST /auth/refresh {refreshToken: RT_1}
    Auth->>DB: 查询 RT_1
    DB-->>Auth: RT_1 有效
    Auth->>Auth: 生成新 Access Token (AT_2)
    Auth->>Auth: 生成新 Refresh Token (RT_2)
    Auth->>DB: 标记 RT_1 已使用，保存 RT_2
    Auth-->>Client: {accessToken: AT_2, refreshToken: RT_2}
    
    Note over Client: 更新为 RT_2
    
    rect rgb(255, 200, 200)
        Note over Client,Auth: 重放攻击检测
        Client->>Auth: POST /auth/refresh {refreshToken: RT_1}（旧 Token）
        Auth->>DB: 查询 RT_1
        DB-->>Auth: RT_1 已被使用！
        Auth->>DB: 撤销该用户所有 Refresh Token
        Auth-->>Client: 401 检测到 Token 重用，请重新登录
    end
```

**Rotation 实现**：

```java
@Service
public class TokenRotationService {
    
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;
    
    /**
     * 刷新 Token（带轮换）
     */
    @Transactional
    public TokenResponse refreshWithRotation(String oldRefreshToken) {
        RefreshTokenEntity oldToken = refreshTokenRepository
            .findByTokenHash(hash(oldRefreshToken))
            .orElseThrow(() -> new InvalidTokenException("无效的 Refresh Token"));
        
        // 检测重放攻击：Token 已被使用过
        if (oldToken.isUsed()) {
            // 安全措施：撤销该用户所有 Token
            refreshTokenRepository.revokeAllByUserId(
                oldToken.getUserId(), 
                "Token 重用检测"
            );
            throw new SecurityException("检测到 Token 重用，所有会话已失效");
        }
        
        // 检查是否过期
        if (oldToken.isExpired()) {
            throw new TokenExpiredException("Refresh Token 已过期");
        }
        
        // 标记旧 Token 为已使用
        oldToken.setUsed(true);
        oldToken.setUsedAt(Instant.now());
        refreshTokenRepository.save(oldToken);
        
        // 生成新的 Token 对
        String newAccessToken = jwtService.generateAccessToken(oldToken.getUserId());
        String newRefreshToken = generateRefreshToken(oldToken.getUserId(), oldToken.getDeviceId());
        
        return new TokenResponse(newAccessToken, newRefreshToken);
    }
}
```

### 6.3 Token 存储安全

#### 前端存储方案对比

| 存储方式 | XSS 风险 | CSRF 风险 | 推荐等级 |
|----------|----------|-----------|----------|
| localStorage | ⚠️ 高 | ✅ 无 | ⭐⭐ 一般应用 |
| sessionStorage | ⚠️ 高 | ✅ 无 | ⭐⭐ 单标签页 |
| 内存变量 | ✅ 低 | ✅ 无 | ⭐⭐⭐ 推荐 |
| httpOnly Cookie | ✅ 无 | ⚠️ 需防护 | ⭐⭐⭐⭐ 高安全 |
| 内存 + Refresh in Cookie | ✅ 低 | ✅ 已处理 | ⭐⭐⭐⭐⭐ 最佳 |

#### 推荐方案：混合存储

```
Access Token  → 存储在内存（JavaScript 变量）
Refresh Token → 存储在 httpOnly Cookie（服务端设置）
```

**后端设置 httpOnly Cookie**：

```java
@PostMapping("/login")
public ResponseEntity<TokenResponse> login(
        @RequestBody LoginRequest request,
        HttpServletResponse response) {
    
    TokenResponse tokens = authService.login(request);
    
    // Refresh Token 通过 httpOnly Cookie 返回
    Cookie refreshCookie = new Cookie("refresh_token", tokens.getRefreshToken());
    refreshCookie.setHttpOnly(true);      // 禁止 JavaScript 访问
    refreshCookie.setSecure(true);        // 仅 HTTPS
    refreshCookie.setPath("/api/auth");   // 限制路径
    refreshCookie.setMaxAge(7 * 24 * 3600); // 7 天
    refreshCookie.setSameSite("Strict");  // 防 CSRF
    response.addCookie(refreshCookie);
    
    // 只返回 Access Token
    return ResponseEntity.ok(new TokenResponse(tokens.getAccessToken(), null));
}
```

### 6.4 XSS/CSRF 防护

#### XSS 防护措施

1. **内容安全策略（CSP）**：

```http
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
```

2. **输入验证和输出转义**：

```typescript
// 前端使用 DOMPurify 清理用户输入
import DOMPurify from 'dompurify'

const sanitizedHtml = DOMPurify.sanitize(userInput)
```

3. **不在 Token 中存储敏感信息**：密码、信用卡等敏感数据不放入 JWT Payload

#### CSRF 防护措施

1. **使用 Authorization Header**（而非 Cookie）：

```typescript
// 前端发送请求时
headers: {
    'Authorization': `Bearer ${accessToken}`
}
```

2. **SameSite Cookie 属性**：

```java
refreshCookie.setSameSite("Strict");  // 或 "Lax"
```

3. **验证 Origin/Referer**：

```java
@Component
public class CsrfFilter implements Filter {
    
    private static final Set<String> ALLOWED_ORIGINS = Set.of(
        "https://example.com",
        "https://app.example.com"
    );
    
    @Override
    public void doFilter(ServletRequest req, ServletResponse res, FilterChain chain) {
        HttpServletRequest request = (HttpServletRequest) req;
        String origin = request.getHeader("Origin");
        
        if (isMutatingMethod(request.getMethod())) {
            if (origin == null || !ALLOWED_ORIGINS.contains(origin)) {
                throw new ForbiddenException("Invalid origin");
            }
        }
        chain.doFilter(req, res);
    }
}
```

### 6.5 Token 黑名单

用于处理以下场景：

- 用户主动登出
- 密码修改后使旧 Token 失效
- 账户被禁用
- 检测到安全威胁

**高效实现（使用 jti + Redis）**：

```java
@Service
public class TokenBlacklistService {
    
    @Autowired
    private StringRedisTemplate redisTemplate;
    
    private static final String BLACKLIST_PREFIX = "jwt:blacklist:";
    
    /**
     * 将 Token 加入黑名单（使用 jti，而非整个 Token）
     */
    public void addToBlacklist(String jti, long remainingTtlSeconds) {
        if (remainingTtlSeconds > 0) {
            String key = BLACKLIST_PREFIX + jti;
            redisTemplate.opsForValue().set(key, "1", remainingTtlSeconds, TimeUnit.SECONDS);
        }
    }
    
    /**
     * 检查 Token 是否在黑名单中
     */
    public boolean isBlacklisted(String jti) {
        String key = BLACKLIST_PREFIX + jti;
        return Boolean.TRUE.equals(redisTemplate.hasKey(key));
    }
    
    /**
     * 撤销用户所有 Token（通过用户级别的版本号）
     */
    public void revokeAllUserTokens(Long userId) {
        String key = "user:token_version:" + userId;
        redisTemplate.opsForValue().increment(key);
    }
    
    /**
     * 检查 Token 版本是否有效
     */
    public boolean isTokenVersionValid(Long userId, int tokenVersion) {
        String key = "user:token_version:" + userId;
        String currentVersion = redisTemplate.opsForValue().get(key);
        return currentVersion == null || Integer.parseInt(currentVersion) <= tokenVersion;
    }
}
```

### 6.6 密钥管理

#### 密钥存储规范

```yaml
# application.yml - 生产环境配置
jwt:
  # 从环境变量读取密钥
  private-key: ${JWT_PRIVATE_KEY}
  public-key: ${JWT_PUBLIC_KEY}
  
  # 或从配置中心读取
  # private-key-path: vault://secret/jwt/private-key
```

#### 密钥轮换策略

```java
/**
 * 支持多密钥验证（用于平滑轮换）
 */
@Service
public class JwtKeyService {
    
    // 当前签名密钥
    private PrivateKey currentSigningKey;
    private String currentKeyId;
    
    // 用于验证的所有公钥（支持多版本）
    private Map<String, PublicKey> verificationKeys = new ConcurrentHashMap<>();
    
    /**
     * 签名时使用当前密钥
     */
    public String sign(Claims claims) {
        return Jwts.builder()
            .setHeaderParam("kid", currentKeyId)  // 在 Header 中标记密钥 ID
            .setClaims(claims)
            .signWith(currentSigningKey, SignatureAlgorithm.RS256)
            .compact();
    }
    
    /**
     * 验证时根据 kid 选择公钥
     */
    public Claims verify(String token) {
        String kid = extractKeyId(token);
        PublicKey publicKey = verificationKeys.get(kid);
        
        if (publicKey == null) {
            throw new InvalidTokenException("Unknown key ID");
        }
        
        return Jwts.parserBuilder()
            .setSigningKey(publicKey)
            .build()
            .parseClaimsJws(token)
            .getBody();
    }
}
```

---

## 7. 密码安全

### 7.1 密码哈希算法

根据 [OWASP 密码存储指南](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)：

| 算法 | 推荐等级 | 说明 |
|------|----------|------|
| **Argon2id** | ⭐⭐⭐⭐⭐ | 首选，2015 年密码哈希竞赛冠军 |
| **bcrypt** | ⭐⭐⭐⭐ | 广泛使用，Spring Security 默认 |
| **scrypt** | ⭐⭐⭐⭐ | 内存密集型，防 GPU 攻击 |
| **PBKDF2** | ⭐⭐⭐ | NIST 推荐，但不如上述安全 |
| ❌ MD5/SHA1/SHA256 | 禁止 | 不是密码哈希算法，不安全 |

#### bcrypt 实现（推荐）

```java
@Configuration
public class SecurityConfig {
    
    @Bean
    public PasswordEncoder passwordEncoder() {
        // 成本因子 12（推荐 10-14）
        // 成本因子每增加 1，计算时间翻倍
        return new BCryptPasswordEncoder(12);
    }
}

@Service
public class UserService {
    
    @Autowired
    private PasswordEncoder passwordEncoder;
    
    public void createUser(RegisterRequest request) {
        User user = new User();
        user.setUsername(request.getUsername());
        // 存储哈希值，永远不存储明文密码
        user.setPasswordHash(passwordEncoder.encode(request.getPassword()));
        userRepository.save(user);
    }
    
    public boolean verifyPassword(String rawPassword, String storedHash) {
        return passwordEncoder.matches(rawPassword, storedHash);
    }
}
```

#### Argon2 实现（更安全）

```xml
<!-- pom.xml -->
<dependency>
    <groupId>org.bouncycastle</groupId>
    <artifactId>bcprov-jdk18on</artifactId>
    <version>1.77</version>
</dependency>
```

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new Argon2PasswordEncoder(
        16,    // Salt 长度
        32,    // Hash 长度
        1,     // 并行度
        65536, // 内存成本（KB）
        3      // 迭代次数
    );
}
```

### 7.2 密码强度要求

```java
/**
 * 密码强度验证器
 */
@Component
public class PasswordStrengthValidator {
    
    private static final int MIN_LENGTH = 8;
    private static final int MAX_LENGTH = 128;
    
    public ValidationResult validate(String password) {
        List<String> errors = new ArrayList<>();
        
        // 长度检查
        if (password.length() < MIN_LENGTH) {
            errors.add("密码长度至少 " + MIN_LENGTH + " 位");
        }
        if (password.length() > MAX_LENGTH) {
            errors.add("密码长度不能超过 " + MAX_LENGTH + " 位");
        }
        
        // 复杂度检查
        if (!password.matches(".*[A-Z].*")) {
            errors.add("密码必须包含大写字母");
        }
        if (!password.matches(".*[a-z].*")) {
            errors.add("密码必须包含小写字母");
        }
        if (!password.matches(".*\\d.*")) {
            errors.add("密码必须包含数字");
        }
        if (!password.matches(".*[!@#$%^&*()_+\\-=\\[\\]{};':\"\\\\|,.<>\\/?].*")) {
            errors.add("密码必须包含特殊字符");
        }
        
        // 常见弱密码检查
        if (isCommonPassword(password)) {
            errors.add("密码过于简单，请使用更复杂的密码");
        }
        
        // 连续字符检查
        if (hasSequentialChars(password, 3)) {
            errors.add("密码不能包含连续字符（如 123、abc）");
        }
        
        return new ValidationResult(errors.isEmpty(), errors);
    }
    
    private boolean isCommonPassword(String password) {
        // 检查常见弱密码列表（可从文件加载）
        Set<String> commonPasswords = Set.of(
            "password", "123456", "12345678", "qwerty", 
            "abc123", "password1", "admin123"
        );
        return commonPasswords.contains(password.toLowerCase());
    }
}
```

### 7.3 忘记密码/重置密码

#### 重置密码流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant FE as 前端
    participant Auth as Auth Service
    participant Email as 邮件服务
    participant DB as 数据库
    
    User->>FE: 点击"忘记密码"
    FE->>Auth: POST /auth/forgot-password {email}
    Auth->>DB: 查询用户
    Auth->>Auth: 生成重置 Token（有效期 1 小时）
    Auth->>DB: 存储 Token 哈希
    Auth->>Email: 发送重置链接
    Auth-->>FE: "重置链接已发送到邮箱"
    
    Note over User: 用户点击邮件中的链接
    
    User->>FE: 访问重置链接
    FE->>Auth: POST /auth/reset-password {token, newPassword}
    Auth->>DB: 验证 Token
    Auth->>Auth: 验证密码强度
    Auth->>DB: 更新密码，删除 Token
    Auth->>DB: 撤销所有 Refresh Token
    Auth-->>FE: "密码重置成功"
```

#### 重置密码 API

**发送重置链接**：

```http
POST /api/auth/forgot-password
Content-Type: application/json

{
    "email": "zhangsan@example.com"
}
```

**响应**（无论邮箱是否存在，都返回相同响应，防止用户枚举）：

```json
{
    "code": 0,
    "message": "如果该邮箱已注册，重置链接将在几分钟内发送",
    "data": null
}
```

**重置密码**：

```http
POST /api/auth/reset-password
Content-Type: application/json

{
    "token": "abc123def456...",
    "newPassword": "NewSecurePass123!"
}
```

#### 重置 Token 安全

```java
@Service
public class PasswordResetService {
    
    @Autowired
    private StringRedisTemplate redisTemplate;
    
    private static final String RESET_TOKEN_PREFIX = "password_reset:";
    private static final int TOKEN_VALIDITY_HOURS = 1;
    
    /**
     * 生成重置 Token
     */
    public String generateResetToken(Long userId) {
        // 生成安全随机 Token
        String token = generateSecureToken();
        String tokenHash = sha256(token);
        
        // 存储 Token 哈希（不存储明文）
        String key = RESET_TOKEN_PREFIX + tokenHash;
        redisTemplate.opsForValue().set(
            key, 
            userId.toString(), 
            TOKEN_VALIDITY_HOURS, 
            TimeUnit.HOURS
        );
        
        return token;
    }
    
    /**
     * 验证并使用 Token
     */
    public Long validateAndConsumeToken(String token) {
        String tokenHash = sha256(token);
        String key = RESET_TOKEN_PREFIX + tokenHash;
        
        String userId = redisTemplate.opsForValue().get(key);
        if (userId == null) {
            throw new InvalidTokenException("重置链接无效或已过期");
        }
        
        // 删除 Token（一次性使用）
        redisTemplate.delete(key);
        
        return Long.parseLong(userId);
    }
    
    private String generateSecureToken() {
        byte[] bytes = new byte[32];
        new SecureRandom().nextBytes(bytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(bytes);
    }
}
```

---

## 8. 限流与防护

### 8.1 登录限流策略

根据 [OWASP 暴力破解防护](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html#protect-against-automated-attacks)：

#### 多层限流策略

```java
@Service
public class LoginRateLimiter {
    
    @Autowired
    private StringRedisTemplate redisTemplate;
    
    // 限流配置
    private static final int MAX_ATTEMPTS_PER_IP = 100;        // 每 IP 每小时最多 100 次
    private static final int MAX_ATTEMPTS_PER_USER = 5;        // 每用户每 15 分钟最多 5 次
    private static final int MAX_ATTEMPTS_BEFORE_CAPTCHA = 3;  // 3 次失败后需要验证码
    private static final int LOCKOUT_DURATION_MINUTES = 15;    // 锁定 15 分钟
    
    /**
     * 检查是否允许登录尝试
     */
    public LoginAttemptResult checkAttempt(String ip, String username) {
        // 1. IP 级别限流
        String ipKey = "login:ip:" + ip;
        Long ipAttempts = redisTemplate.opsForValue().increment(ipKey);
        if (ipAttempts == 1) {
            redisTemplate.expire(ipKey, 1, TimeUnit.HOURS);
        }
        if (ipAttempts > MAX_ATTEMPTS_PER_IP) {
            return LoginAttemptResult.blocked("请求过于频繁，请稍后再试");
        }
        
        // 2. 用户级别限流
        String userKey = "login:user:" + username;
        Long userAttempts = redisTemplate.opsForValue().increment(userKey);
        if (userAttempts == 1) {
            redisTemplate.expire(userKey, LOCKOUT_DURATION_MINUTES, TimeUnit.MINUTES);
        }
        
        // 账户锁定
        if (userAttempts > MAX_ATTEMPTS_PER_USER) {
            return LoginAttemptResult.locked(
                "账户已锁定，请 " + LOCKOUT_DURATION_MINUTES + " 分钟后再试"
            );
        }
        
        // 需要验证码
        if (userAttempts > MAX_ATTEMPTS_BEFORE_CAPTCHA) {
            return LoginAttemptResult.requireCaptcha();
        }
        
        return LoginAttemptResult.allowed();
    }
    
    /**
     * 登录成功后重置计数
     */
    public void onLoginSuccess(String username) {
        String userKey = "login:user:" + username;
        redisTemplate.delete(userKey);
    }
}
```

#### 渐进式延迟

```java
/**
 * 登录失败后的渐进式延迟
 */
public Duration getDelayAfterFailure(int failureCount) {
    // 指数退避：1s, 2s, 4s, 8s, 16s, 最大 30s
    int delaySeconds = (int) Math.min(Math.pow(2, failureCount - 1), 30);
    return Duration.ofSeconds(delaySeconds);
}
```

### 8.2 API 限流配置

使用 Spring Cloud Gateway 的 RequestRateLimiter：

```yaml
# api-gateway/application.yml
spring:
  cloud:
    gateway:
      routes:
        - id: auth-service
          uri: lb://auth-service
          predicates:
            - Path=/api/auth/**
          filters:
            - name: RequestRateLimiter
              args:
                redis-rate-limiter.replenishRate: 10   # 每秒填充 10 个令牌
                redis-rate-limiter.burstCapacity: 20   # 令牌桶容量 20
                key-resolver: "#{@userKeyResolver}"    # 按用户限流
```

```java
@Configuration
public class RateLimiterConfig {
    
    @Bean
    public KeyResolver userKeyResolver() {
        return exchange -> {
            // 优先按用户 ID，未登录按 IP
            String userId = exchange.getRequest().getHeaders().getFirst("X-User-Id");
            if (userId != null) {
                return Mono.just(userId);
            }
            return Mono.just(
                Objects.requireNonNull(exchange.getRequest().getRemoteAddress())
                    .getAddress().getHostAddress()
            );
        };
    }
}
```

### 8.3 异常检测与告警

```java
@Service
public class SecurityAlertService {
    
    @Autowired
    private AlertNotifier alertNotifier;  // 邮件/短信/钉钉通知
    
    /**
     * 检测异常登录行为
     */
    public void analyzeLoginAttempt(LoginAttemptEvent event) {
        // 1. 地理位置异常
        if (isGeoLocationAnomalous(event)) {
            alertNotifier.sendAlert(
                "异常登录检测",
                "用户 " + event.getUsername() + " 从异常地点登录：" + event.getLocation()
            );
        }
        
        // 2. 设备异常
        if (isNewDevice(event)) {
            // 发送邮件通知用户
            emailService.sendNewDeviceAlert(event.getUserEmail(), event.getDeviceInfo());
        }
        
        // 3. 暴力破解检测
        if (isBruteForceAttack(event.getIp())) {
            // 临时封禁 IP
            blockIp(event.getIp(), Duration.ofHours(1));
            alertNotifier.sendAlert(
                "暴力破解攻击",
                "IP " + event.getIp() + " 触发暴力破解检测，已封禁 1 小时"
            );
        }
    }
}
```

---

## 9. 多设备与会话管理

### 9.1 设备管理功能

```mermaid
graph TB
    subgraph devices [用户设备列表]
        D1[MacBook Pro<br/>北京 · 当前设备]
        D2[iPhone 14<br/>上海 · 2小时前]
        D3[Windows PC<br/>深圳 · 3天前]
    end
    
    User[用户] --> |查看| devices
    User --> |登出指定设备| D2
    User --> |登出所有设备| devices
```

### 9.2 设备管理 API

**获取设备列表**：

```http
GET /api/auth/devices
Authorization: Bearer {accessToken}
```

**响应**：

```json
{
    "code": 0,
    "message": "操作成功",
    "data": [
        {
            "sessionId": "sess_abc123",
            "deviceId": "device_001",
            "deviceName": "MacBook Pro",
            "deviceType": "DESKTOP",
            "browser": "Chrome 120",
            "os": "macOS 14.0",
            "ipAddress": "123.123.123.123",
            "location": "北京市",
            "lastActiveAt": "2026-01-21T12:00:00Z",
            "isCurrent": true
        },
        {
            "sessionId": "sess_def456",
            "deviceId": "device_002",
            "deviceName": "iPhone 14",
            "deviceType": "MOBILE",
            "browser": "Safari",
            "os": "iOS 17.0",
            "ipAddress": "124.124.124.124",
            "location": "上海市",
            "lastActiveAt": "2026-01-21T10:00:00Z",
            "isCurrent": false
        }
    ]
}
```

**登出指定设备**：

```http
DELETE /api/auth/devices/{sessionId}
Authorization: Bearer {accessToken}
```

**登出所有其他设备**：

```http
POST /api/auth/devices/revoke-others
Authorization: Bearer {accessToken}
```

### 9.3 会话管理实现

```java
@Service
public class SessionManagementService {
    
    @Autowired
    private RefreshTokenRepository refreshTokenRepository;
    
    /**
     * 获取用户所有活跃会话
     */
    public List<DeviceSession> getActiveSessions(Long userId) {
        return refreshTokenRepository.findActiveByUserId(userId).stream()
            .map(token -> DeviceSession.builder()
                .sessionId(token.getId())
                .deviceId(token.getDeviceId())
                .deviceName(token.getDeviceName())
                .deviceType(parseDeviceType(token.getUserAgent()))
                .browser(parseBrowser(token.getUserAgent()))
                .os(parseOs(token.getUserAgent()))
                .ipAddress(token.getIpAddress())
                .location(getLocationByIp(token.getIpAddress()))
                .lastActiveAt(token.getLastUsedAt())
                .build())
            .collect(Collectors.toList());
    }
    
    /**
     * 撤销指定会话
     */
    public void revokeSession(Long userId, String sessionId) {
        RefreshTokenEntity token = refreshTokenRepository.findById(sessionId)
            .orElseThrow(() -> new NotFoundException("会话不存在"));
        
        // 验证归属
        if (!token.getUserId().equals(userId)) {
            throw new ForbiddenException("无权操作此会话");
        }
        
        token.setRevoked(true);
        token.setRevokedAt(Instant.now());
        token.setRevokedReason("用户主动登出");
        refreshTokenRepository.save(token);
    }
    
    /**
     * 撤销除当前会话外的所有会话
     */
    public int revokeOtherSessions(Long userId, String currentSessionId) {
        return refreshTokenRepository.revokeAllExcept(
            userId, 
            currentSessionId, 
            "用户登出其他设备"
        );
    }
}
```

### 9.4 "记住我"功能

```java
@PostMapping("/login")
public ResponseEntity<LoginResponse> login(
        @RequestBody LoginRequest request,
        HttpServletResponse response) {
    
    // 根据"记住我"选项设置不同的 Token 有效期
    TokenConfig tokenConfig;
    if (request.isRememberMe()) {
        tokenConfig = TokenConfig.builder()
            .accessTokenTtl(Duration.ofHours(1))      // 1 小时
            .refreshTokenTtl(Duration.ofDays(90))     // 90 天
            .build();
    } else {
        tokenConfig = TokenConfig.builder()
            .accessTokenTtl(Duration.ofMinutes(30))   // 30 分钟
            .refreshTokenTtl(Duration.ofDays(7))      // 7 天
            .build();
    }
    
    TokenResponse tokens = authService.login(request, tokenConfig);
    
    // ...
}
```

---

## 10. 双因素认证（2FA）

> 本章节为预留扩展，提供设计方案供后续实现参考。

### 10.1 2FA 类型选择

| 类型 | 安全性 | 便捷性 | 推荐场景 |
|------|--------|--------|----------|
| **TOTP**（Google Authenticator） | ⭐⭐⭐⭐ | ⭐⭐⭐ | 企业用户，推荐 |
| **短信验证码** | ⭐⭐ | ⭐⭐⭐⭐ | 一般用户 |
| **邮箱验证码** | ⭐⭐ | ⭐⭐⭐ | 备用方案 |
| **硬件密钥**（YubiKey） | ⭐⭐⭐⭐⭐ | ⭐⭐ | 高安全需求 |
| **WebAuthn/Passkey** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | 现代化方案 |

### 10.2 TOTP 实现方案

#### 启用 2FA 流程

```mermaid
sequenceDiagram
    participant User as 用户
    participant FE as 前端
    participant Auth as Auth Service
    
    User->>FE: 点击"启用两步验证"
    FE->>Auth: POST /auth/2fa/setup
    Auth->>Auth: 生成 TOTP Secret
    Auth-->>FE: {secret, qrCodeUrl}
    FE->>User: 显示二维码
    User->>User: 使用 Google Authenticator 扫码
    User->>FE: 输入验证码确认
    FE->>Auth: POST /auth/2fa/verify {code}
    Auth->>Auth: 验证 TOTP 码
    Auth->>Auth: 启用 2FA，生成恢复码
    Auth-->>FE: {enabled: true, recoveryCodes: [...]}
    FE->>User: 显示恢复码，提示保存
```

#### 登录流程（启用 2FA 后）

```mermaid
sequenceDiagram
    participant User as 用户
    participant FE as 前端
    participant Auth as Auth Service
    
    User->>FE: 输入用户名密码
    FE->>Auth: POST /auth/login
    Auth->>Auth: 验证密码
    Auth-->>FE: {requiresTwoFactor: true, twoFactorToken: "..."}
    
    FE->>User: 显示 2FA 输入框
    User->>FE: 输入验证码
    FE->>Auth: POST /auth/2fa/authenticate {twoFactorToken, code}
    Auth->>Auth: 验证 TOTP 码
    Auth-->>FE: {accessToken, refreshToken}
```

#### 2FA API 设计

**启用 2FA - 获取设置信息**：

```http
POST /api/auth/2fa/setup
Authorization: Bearer {accessToken}
```

**响应**：

```json
{
    "code": 0,
    "data": {
        "secret": "JBSWY3DPEHPK3PXP",
        "qrCodeUrl": "otpauth://totp/MyApp:zhangsan?secret=JBSWY3DPEHPK3PXP&issuer=MyApp",
        "qrCodeImage": "data:image/png;base64,..."
    }
}
```

**验证并启用 2FA**：

```http
POST /api/auth/2fa/enable
Authorization: Bearer {accessToken}
Content-Type: application/json

{
    "code": "123456"
}
```

**响应**：

```json
{
    "code": 0,
    "data": {
        "enabled": true,
        "recoveryCodes": [
            "ABCD-EFGH-1234",
            "IJKL-MNOP-5678",
            "QRST-UVWX-9012",
            "...（共 10 个恢复码）"
        ]
    }
}
```

**2FA 登录验证**：

```http
POST /api/auth/2fa/authenticate
Content-Type: application/json

{
    "twoFactorToken": "eyJ...",
    "code": "123456"
}
```

#### TOTP 实现代码

```xml
<!-- pom.xml -->
<dependency>
    <groupId>dev.samstevens.totp</groupId>
    <artifactId>totp</artifactId>
    <version>1.7.1</version>
</dependency>
```

```java
@Service
public class TwoFactorService {
    
    private final SecretGenerator secretGenerator = new DefaultSecretGenerator();
    private final CodeVerifier codeVerifier = new DefaultCodeVerifier(
        new DefaultCodeGenerator(), 
        new SystemTimeProvider()
    );
    private final QrDataFactory qrDataFactory = new QrDataFactory(
        HashingAlgorithm.SHA1, 6, 30
    );
    private final QrGenerator qrGenerator = new ZxingPngQrGenerator();
    
    /**
     * 生成 2FA 设置信息
     */
    public TwoFactorSetupResponse generateSetup(String username) {
        String secret = secretGenerator.generate();
        
        QrData qrData = qrDataFactory.newBuilder()
            .label(username)
            .issuer("MyApp")
            .secret(secret)
            .build();
        
        String qrCodeUrl = qrData.getUri();
        String qrCodeImage = getDataUriForImage(
            qrGenerator.generate(qrData), 
            qrGenerator.getImageMimeType()
        );
        
        return new TwoFactorSetupResponse(secret, qrCodeUrl, qrCodeImage);
    }
    
    /**
     * 验证 TOTP 码
     */
    public boolean verifyCode(String secret, String code) {
        return codeVerifier.isValidCode(secret, code);
    }
    
    /**
     * 生成恢复码
     */
    public List<String> generateRecoveryCodes() {
        RecoveryCodeGenerator generator = new RecoveryCodeGenerator();
        return Arrays.asList(generator.generateCodes(10));
    }
}
```

---

## 11. 错误码定义

### 11.1 认证相关错误码

| 错误码 | 枚举名称 | 错误消息 | HTTP 状态码 | 说明 |
|--------|----------|----------|-------------|------|
| 40100 | UNAUTHORIZED | 未授权，请先登录 | 401 | 缺少认证信息 |
| 40101 | LOGIN_FAILED | 用户名或密码错误 | 401 | 登录凭证错误 |
| 40102 | TOKEN_EXPIRED | Token 已过期 | 401 | Access Token 过期 |
| 40103 | TOKEN_INVALID | 无效的 Token | 401 | Token 格式错误或签名无效 |
| 40104 | REFRESH_TOKEN_EXPIRED | Refresh Token 已过期，请重新登录 | 401 | 需要重新登录 |
| 40105 | ACCOUNT_DISABLED | 账户已被禁用 | 401 | 账户被管理员禁用 |
| 40106 | ACCOUNT_LOCKED | 账户已锁定，请稍后再试 | 401 | 登录失败次数过多 |
| 40107 | TOKEN_REVOKED | Token 已被撤销 | 401 | Token 在黑名单中 |
| 40108 | SESSION_EXPIRED | 会话已过期 | 401 | 会话不存在或已失效 |
| 40109 | DEVICE_NOT_TRUSTED | 设备未授信，需要验证 | 401 | 新设备登录需验证 |
| 40110 | TWO_FACTOR_REQUIRED | 需要两步验证 | 401 | 用户启用了 2FA |
| 40111 | TWO_FACTOR_INVALID | 两步验证码错误 | 401 | 2FA 验证码不正确 |
| 40112 | PASSWORD_EXPIRED | 密码已过期，请修改密码 | 401 | 密码策略要求 |

### 11.2 权限相关错误码

| 错误码 | 枚举名称 | 错误消息 | HTTP 状态码 | 说明 |
|--------|----------|----------|-------------|------|
| 40300 | FORBIDDEN | 无权限访问 | 403 | 通用权限不足 |
| 40301 | ROLE_NOT_ALLOWED | 当前角色无权执行此操作 | 403 | 角色权限不足 |
| 40302 | RESOURCE_NOT_OWNED | 无权访问他人资源 | 403 | 资源归属验证失败 |
| 40303 | IP_BLOCKED | IP 已被封禁 | 403 | 安全策略封禁 |
| 40304 | REGION_RESTRICTED | 当前地区不可用 | 403 | 地区限制 |

### 11.3 密码相关错误码

| 错误码 | 枚举名称 | 错误消息 | HTTP 状态码 | 说明 |
|--------|----------|----------|-------------|------|
| 40201 | PASSWORD_TOO_WEAK | 密码强度不足 | 400 | 不满足密码策略 |
| 40202 | PASSWORD_SAME_AS_OLD | 新密码不能与旧密码相同 | 400 | 密码历史检查 |
| 40203 | PASSWORD_RECENTLY_USED | 不能使用最近使用过的密码 | 400 | 密码历史检查 |
| 40204 | RESET_TOKEN_INVALID | 重置链接无效或已过期 | 400 | 密码重置 Token |
| 40205 | RESET_TOKEN_USED | 重置链接已被使用 | 400 | 一次性 Token |

### 11.4 限流相关错误码

| 错误码 | 枚举名称 | 错误消息 | HTTP 状态码 | 说明 |
|--------|----------|----------|-------------|------|
| 42900 | TOO_MANY_REQUESTS | 请求过于频繁，请稍后再试 | 429 | 通用限流 |
| 42901 | LOGIN_ATTEMPTS_EXCEEDED | 登录尝试次数过多 | 429 | 登录限流 |
| 42902 | CAPTCHA_REQUIRED | 需要完成验证码 | 429 | 触发验证码 |

### 11.5 ResultCode 扩展

```java
// api-common/src/main/java/com/example/api/common/ResultCode.java

public enum ResultCode {
    // ... 已有错误码 ...

    // ========== 认证相关 4010x ==========
    UNAUTHORIZED(40100, "未授权，请先登录"),
    LOGIN_FAILED(40101, "用户名或密码错误"),
    TOKEN_EXPIRED(40102, "Token 已过期"),
    TOKEN_INVALID(40103, "无效的 Token"),
    REFRESH_TOKEN_EXPIRED(40104, "Refresh Token 已过期，请重新登录"),
    ACCOUNT_DISABLED(40105, "账户已被禁用"),
    ACCOUNT_LOCKED(40106, "账户已锁定，请稍后再试"),
    TOKEN_REVOKED(40107, "Token 已被撤销"),
    SESSION_EXPIRED(40108, "会话已过期"),
    DEVICE_NOT_TRUSTED(40109, "设备未授信，需要验证"),
    TWO_FACTOR_REQUIRED(40110, "需要两步验证"),
    TWO_FACTOR_INVALID(40111, "两步验证码错误"),
    PASSWORD_EXPIRED(40112, "密码已过期，请修改密码"),
    
    // ========== 密码相关 4020x ==========
    PASSWORD_TOO_WEAK(40201, "密码强度不足"),
    PASSWORD_SAME_AS_OLD(40202, "新密码不能与旧密码相同"),
    PASSWORD_RECENTLY_USED(40203, "不能使用最近使用过的密码"),
    RESET_TOKEN_INVALID(40204, "重置链接无效或已过期"),
    RESET_TOKEN_USED(40205, "重置链接已被使用"),
    
    // ========== 权限相关 4030x ==========
    FORBIDDEN(40300, "无权限访问"),
    ROLE_NOT_ALLOWED(40301, "当前角色无权执行此操作"),
    RESOURCE_NOT_OWNED(40302, "无权访问他人资源"),
    IP_BLOCKED(40303, "IP 已被封禁"),
    REGION_RESTRICTED(40304, "当前地区不可用"),
    
    // ========== 限流相关 4290x ==========
    TOO_MANY_REQUESTS(42900, "请求过于频繁，请稍后再试"),
    LOGIN_ATTEMPTS_EXCEEDED(42901, "登录尝试次数过多"),
    CAPTCHA_REQUIRED(42902, "需要完成验证码");
    
    private final int code;
    private final String message;
    
    ResultCode(int code, String message) {
        this.code = code;
        this.message = message;
    }
    
    // getters...
}
```

---

## 附录

### A. 完整 API 清单

| 接口 | 方法 | 路径 | 认证 | 说明 |
|------|------|------|------|------|
| 登录 | POST | `/api/auth/login` | 否 | 用户登录 |
| 注册 | POST | `/api/auth/register` | 否 | 用户注册 |
| 刷新 Token | POST | `/api/auth/refresh` | 否 | 刷新 Access Token |
| 登出 | POST | `/api/auth/logout` | 是 | 使当前 Token 失效 |
| 当前用户 | GET | `/api/auth/me` | 是 | 获取当前用户信息 |
| 忘记密码 | POST | `/api/auth/forgot-password` | 否 | 发送重置链接 |
| 重置密码 | POST | `/api/auth/reset-password` | 否 | 重置密码 |
| 修改密码 | POST | `/api/auth/change-password` | 是 | 修改当前密码 |
| 设备列表 | GET | `/api/auth/devices` | 是 | 获取登录设备列表 |
| 登出设备 | DELETE | `/api/auth/devices/{id}` | 是 | 登出指定设备 |
| 登出其他 | POST | `/api/auth/devices/revoke-others` | 是 | 登出其他所有设备 |
| 2FA 设置 | POST | `/api/auth/2fa/setup` | 是 | 获取 2FA 设置信息 |
| 2FA 启用 | POST | `/api/auth/2fa/enable` | 是 | 启用 2FA |
| 2FA 禁用 | POST | `/api/auth/2fa/disable` | 是 | 禁用 2FA |
| 2FA 验证 | POST | `/api/auth/2fa/authenticate` | 否* | 2FA 登录验证 |

### B. 依赖版本

| 依赖 | 版本 | 用途 |
|------|------|------|
| spring-boot-starter-security | 3.2.0 | Spring Security 框架 |
| jjwt-api | 0.12.3 | JWT 生成与解析 |
| jjwt-impl | 0.12.3 | JWT 实现 |
| jjwt-jackson | 0.12.3 | JWT JSON 序列化 |
| spring-boot-starter-data-redis | 3.2.0 | Redis 集成 |
| bcprov-jdk18on | 1.77 | Argon2 密码哈希（可选） |
| totp | 1.7.1 | TOTP 两步验证（可选） |
| commons-codec | 1.16.0 | 加密工具 |

### C. 配置参考

```yaml
# application.yml 完整配置示例
jwt:
  # 签名算法：HS256、HS384、HS512、RS256、RS384、RS512、ES256
  algorithm: RS256
  
  # HS256 使用（对称加密）
  secret: ${JWT_SECRET:your-256-bit-secret-key-here-at-least-32-characters}
  
  # RS256 使用（非对称加密）
  private-key-path: ${JWT_PRIVATE_KEY_PATH:classpath:keys/private.pem}
  public-key-path: ${JWT_PUBLIC_KEY_PATH:classpath:keys/public.pem}
  
  # Token 有效期
  access-token-expiration: 1800      # 30 分钟
  refresh-token-expiration: 604800   # 7 天
  remember-me-expiration: 7776000    # 90 天
  
  # 签发者和受众
  issuer: https://auth.example.com
  audience: api.example.com

# 限流配置
rate-limit:
  login:
    max-attempts-per-ip: 100         # 每 IP 每小时
    max-attempts-per-user: 5         # 每用户每 15 分钟
    captcha-threshold: 3             # 3 次失败后需验证码
    lockout-duration: 15             # 锁定时间（分钟）

# 密码策略
password:
  min-length: 8
  max-length: 128
  require-uppercase: true
  require-lowercase: true
  require-digit: true
  require-special: true
  history-count: 5                   # 不能重复最近 5 个密码
  expiry-days: 90                    # 密码有效期（天），0 表示不过期

# 2FA 配置
two-factor:
  enabled: true
  issuer: MyApp
  recovery-codes-count: 10
```

### D. 前端集成检查清单

- [ ] Token 存储方案已实现（推荐：Access Token 内存 + Refresh Token httpOnly Cookie）
- [ ] Axios 请求拦截器已添加 Authorization Header
- [ ] Axios 响应拦截器已处理 401 错误和 Token 刷新
- [ ] Token 刷新队列已实现（避免并发刷新）
- [ ] 路由守卫已实现（PrivateRoute）
- [ ] 登录/登出/注册页面已完成
- [ ] 错误处理和用户提示已完善
- [ ] "记住我"功能已实现（可选）
- [ ] 设备管理页面已实现（可选）
- [ ] 2FA 设置页面已实现（可选）

### E. 安全检查清单

- [ ] 使用 HTTPS（生产环境必须）
- [ ] JWT 密钥安全存储（环境变量/配置中心）
- [ ] 密码使用 bcrypt/Argon2 哈希
- [ ] 登录接口已实现限流
- [ ] Token 黑名单已实现
- [ ] Refresh Token Rotation 已实现
- [ ] 敏感操作日志已记录
- [ ] CORS 已正确配置
- [ ] CSP Header 已配置
- [ ] 异常登录检测已实现（可选）

### F. 参考资料

- [JWT 官方网站](https://jwt.io/)
- [RFC 7519 - JSON Web Token](https://tools.ietf.org/html/rfc7519)
- [RFC 6749 - OAuth 2.0](https://tools.ietf.org/html/rfc6749)
- [Spring Security 官方文档](https://docs.spring.io/spring-security/reference/)
- [OWASP JWT 安全指南](https://cheatsheetseries.owasp.org/cheatsheets/JSON_Web_Token_for_Java_Cheat_Sheet.html)
- [OWASP 密码存储指南](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html)
- [OWASP 认证安全指南](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
- [Auth0 Token 最佳实践](https://auth0.com/docs/secure/tokens/token-best-practices)
- [Auth0 Refresh Token Rotation](https://auth0.com/docs/secure/tokens/refresh-tokens/refresh-token-rotation)

---

## 更新记录

| 日期 | 更新内容 |
|------|----------|
| 2026-01-21 | v1.0 - 创建文档，包含架构设计、前端集成、API 规范 |
| 2026-01-21 | v2.0 - 根据国际主流做法全面升级：<br/>- 新增签名算法选择指南（HS256 vs RS256）<br/>- 新增 OAuth 2.0 标准对齐<br/>- 新增完整的 JWT Claims 设计（iss/aud/jti）<br/>- 新增 Refresh Token Rotation 机制<br/>- 新增密码安全规范（bcrypt/Argon2）<br/>- 新增忘记密码/重置密码 API<br/>- 新增登录限流策略<br/>- 新增多设备与会话管理<br/>- 新增"记住我"功能设计<br/>- 新增双因素认证（2FA）方案<br/>- 扩展错误码定义 |
