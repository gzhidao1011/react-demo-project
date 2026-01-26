---
name: authentication-authorization
description: Implement authentication and authorization including JWT tokens, refresh tokens, role-based access control, and permission management. Use when implementing auth features, securing routes, or managing user permissions.
---

# Authentication & Authorization

Implement authentication and authorization following JWT best practices and security standards.

## Quick Checklist

When implementing authentication:

- [ ] **JWT tokens** configured correctly
- [ ] **Refresh tokens** implemented
- [ ] **Token storage** is secure (memory preferred)
- [ ] **Token expiration** handled
- [ ] **Route guards** implemented
- [ ] **Role-based access** configured
- [ ] **Permission checks** added
- [ ] **Error handling** for auth failures

## Token Management

### 1. Token Storage

**✅ Recommended**: Store tokens in memory (most secure)

```typescript
// packages/utils/src/auth.ts
let accessTokenInMemory: string | null = null;

export function getAccessToken(): string | null {
  // Prefer memory over localStorage
  if (accessTokenInMemory) {
    return accessTokenInMemory;
  }
  
  // Fallback to localStorage (if needed)
  return storage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string, rememberMe = false): void {
  // Store in memory (primary)
  accessTokenInMemory = token;
  
  // Optionally store in localStorage (if rememberMe)
  if (rememberMe) {
    storage.setItem(ACCESS_TOKEN_KEY, token);
  }
}

export function clearAccessToken(): void {
  accessTokenInMemory = null;
  storage.removeItem(ACCESS_TOKEN_KEY);
}
```

### 2. Token Expiration

```typescript
export function setTokenExpires(expiresIn: number, rememberMe = false): void {
  const expiresAt = Date.now() + expiresIn * 1000;
  if (rememberMe) {
    storage.setItem(TOKEN_EXPIRES_KEY, expiresAt.toString());
  }
}

export function isTokenExpired(): boolean {
  const expiresAt = storage.getItem(TOKEN_EXPIRES_KEY);
  if (!expiresAt) return true;
  
  return Date.now() >= parseInt(expiresAt, 10);
}
```

### 3. Refresh Token Flow

```typescript
export async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    throw new Error("No refresh token available");
  }

  try {
    const response = await fetch("/api/auth/refresh", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) {
      throw new Error("Token refresh failed");
    }

    const data = await response.json();
    setAccessToken(data.accessToken);
    setRefreshToken(data.refreshToken);
    setTokenExpires(data.expiresIn);

    return data.accessToken;
  } catch (error) {
    clearAccessToken();
    clearRefreshToken();
    throw error;
  }
}
```

## API Service Integration

### 1. Token Injection

```typescript
// packages/services/src/api.service.base.ts
import { getAccessToken } from "@repo/utils";

export class APIServiceBase {
  protected async request<T>(
    url: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = getAccessToken();
    
    const headers = new Headers(options.headers);
    
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
    
    const response = await fetch(url, {
      ...options,
      headers,
    });

    // Handle token expiration
    if (response.status === 401) {
      // Try refresh token
      try {
        const newToken = await refreshAccessToken();
        if (newToken) {
          headers.set("Authorization", `Bearer ${newToken}`);
          return fetch(url, { ...options, headers }).then(res => res.json());
        }
      } catch {
        // Redirect to login
        window.location.href = "/sign-in";
        throw new Error("Authentication required");
      }
    }

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`);
    }

    return response.json();
  }
}
```

### 2. Login Service

```typescript
// packages/services/src/auth.service.ts
import { APIServiceBase } from "./api.service.base";
import { setAccessToken, setRefreshToken, setTokenExpires } from "@repo/utils";

export interface LoginRequest {
  username: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: {
    id: string;
    username: string;
    email: string;
    roles: string[];
  };
}

export class AuthService extends APIServiceBase {
  async login(data: LoginRequest): Promise<LoginResponse> {
    const response = await this.request<LoginResponse>("/api/auth/login", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        username: data.username,
        password: data.password,
      }),
    });

    // Store tokens
    setAccessToken(response.accessToken, data.rememberMe);
    setRefreshToken(response.refreshToken, data.rememberMe);
    setTokenExpires(response.expiresIn, data.rememberMe);

    return response;
  }

  async logout(): Promise<void> {
    try {
      await this.request("/api/auth/logout", {
        method: "POST",
      });
    } finally {
      // Always clear tokens
      clearAccessToken();
      clearRefreshToken();
    }
  }
}

export const authService = new AuthService();
```

## Route Guards

### 1. Protected Route Component

```tsx
// apps/web/app/components/ProtectedRoute.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router";
import { getAccessToken, isTokenExpired } from "@repo/utils";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({
  children,
  requiredRoles,
}: ProtectedRouteProps) {
  const navigate = useNavigate();

  useEffect(() => {
    const token = getAccessToken();
    
    if (!token || isTokenExpired()) {
      navigate("/sign-in", { replace: true });
      return;
    }

    // Check roles if required
    if (requiredRoles && requiredRoles.length > 0) {
      // Decode token to get roles
      const payload = JSON.parse(atob(token.split(".")[1]));
      const userRoles = payload.roles || [];
      
      const hasRequiredRole = requiredRoles.some((role) =>
        userRoles.includes(role)
      );
      
      if (!hasRequiredRole) {
        navigate("/unauthorized", { replace: true });
      }
    }
  }, [navigate, requiredRoles]);

  return <>{children}</>;
}
```

### 2. Route Configuration

```tsx
// apps/web/app/routes.ts
import { ProtectedRoute } from "./components/ProtectedRoute";

export const routes = [
  {
    path: "/",
    element: <Home />,
  },
  {
    path: "/sign-in",
    element: <SignIn />,
  },
  {
    path: "/dashboard",
    element: (
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    ),
  },
  {
    path: "/admin",
    element: (
      <ProtectedRoute requiredRoles={["admin"]}>
        <AdminPanel />
      </ProtectedRoute>
    ),
  },
];
```

## Permission Management

### 1. Permission Hook

```tsx
// packages/hooks/src/usePermissions.ts
import { useMemo } from "react";
import { getAccessToken } from "@repo/utils";

export function usePermissions() {
  const permissions = useMemo(() => {
    const token = getAccessToken();
    if (!token) return { roles: [], permissions: [] };

    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return {
        roles: payload.roles || [],
        permissions: payload.permissions || [],
      };
    } catch {
      return { roles: [], permissions: [] };
    }
  }, []);

  const hasRole = (role: string) => {
    return permissions.roles.includes(role);
  };

  const hasPermission = (permission: string) => {
    return permissions.permissions.includes(permission);
  };

  const hasAnyRole = (roles: string[]) => {
    return roles.some((role) => hasRole(role));
  };

  const hasAllRoles = (roles: string[]) => {
    return roles.every((role) => hasRole(role));
  };

  return {
    ...permissions,
    hasRole,
    hasPermission,
    hasAnyRole,
    hasAllRoles,
  };
}
```

### 2. Permission Component

```tsx
// apps/web/app/components/PermissionGuard.tsx
import { usePermissions } from "@repo/hooks";

interface PermissionGuardProps {
  children: React.ReactNode;
  requiredRole?: string;
  requiredPermission?: string;
  requiredRoles?: string[];
  fallback?: React.ReactNode;
}

export function PermissionGuard({
  children,
  requiredRole,
  requiredPermission,
  requiredRoles,
  fallback = null,
}: PermissionGuardProps) {
  const { hasRole, hasPermission, hasAnyRole } = usePermissions();

  if (requiredRole && !hasRole(requiredRole)) {
    return <>{fallback}</>;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <>{fallback}</>;
  }

  if (requiredRoles && !hasAnyRole(requiredRoles)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}
```

### 3. Usage Example

```tsx
// Show admin button only to admins
<PermissionGuard requiredRole="admin">
  <button>Admin Panel</button>
</PermissionGuard>

// Show button if user has any of these roles
<PermissionGuard requiredRoles={["admin", "moderator"]}>
  <button>Moderate</button>
</PermissionGuard>

// Show content with custom fallback
<PermissionGuard
  requiredPermission="edit:users"
  fallback={<p>You don't have permission to edit users</p>}
>
  <UserEditForm />
</PermissionGuard>
```

## Security Best Practices

### ✅ Good Practices

- Store tokens in memory (not localStorage)
- Implement refresh token rotation
- Use HTTPS for all API calls
- Validate tokens on server side
- Set appropriate token expiration times
- Clear tokens on logout
- Handle token expiration gracefully
- Use role-based access control (RBAC)
- Implement permission checks
- Sanitize user input

### ❌ Anti-Patterns

- Don't store tokens in localStorage (XSS risk)
- Don't expose tokens in URLs
- Don't skip token validation
- Don't use weak token secrets
- Don't ignore token expiration
- Don't store sensitive data in tokens
- Don't skip permission checks
- Don't trust client-side validation only

## Error Handling

### 1. Auth Error Types

```typescript
export class AuthenticationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "AuthenticationError";
  }
}

export class AuthorizationError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = "AuthorizationError";
  }
}
```

### 2. Error Handling in API

```typescript
export class APIServiceBase {
  protected async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    try {
      const response = await fetch(url, options);
      
      if (response.status === 401) {
        // Try refresh token
        const newToken = await refreshAccessToken();
        if (newToken) {
          // Retry request
          return this.request(url, options);
        }
        throw new AuthenticationError("Authentication required", "AUTH_REQUIRED");
      }
      
      if (response.status === 403) {
        throw new AuthorizationError("Insufficient permissions", "FORBIDDEN");
      }
      
      return response.json();
    } catch (error) {
      if (error instanceof AuthenticationError) {
        // Redirect to login
        window.location.href = "/sign-in";
      }
      throw error;
    }
  }
}
```

## Related Rules

- Security: `.cursor/rules/21-安全规范.mdc`
- API Structure: `.cursor/rules/06-API结构.mdc`
- JWT Guide: `services/docs/jwt-authentication-guide.md`
