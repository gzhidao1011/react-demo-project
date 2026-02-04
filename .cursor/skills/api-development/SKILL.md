---
name: api-development
description: Create API service functions following project standards using APIServiceBase. Use when creating new API endpoints, implementing API calls, or working with backend services.
---

# API Development

Create API service functions following project standards: APIServiceBase pattern.

## Quick Start

```typescript
import { apiService } from "@repo/services";
import type { ApiResponseBase } from "@repo/services";

// 1. Define request/response types
interface UserRequest {
  username: string;
  email: string;
}

interface UserResponse {
  id: string;
  username: string;
  email: string;
}

// 2. Create API function
export async function createUser(data: UserRequest): Promise<UserResponse> {
  const response = await apiService.post<ApiResponseBase<UserResponse>>(
    "/users",
    data
  );
  
  // Handle business errors
  if (response.data.code !== 0 && response.data.code !== 200) {
    throw new Error(response.data.message || "创建用户失败");
  }
  
  return response.data.data!;
}
```

## API Service Structure

### 1. Using APIServiceBase

```typescript
import { APIServiceBase } from "@repo/services";
import type { ApiResponseBase } from "@repo/services";

// Create custom API service
export class UserService extends APIServiceBase {
  constructor() {
    super("/api/users"); // Base URL
  }

  // GET request
  async getUser(id: string): Promise<UserResponse> {
    const response = await this.get<ApiResponseBase<UserResponse>>(`/${id}`);
    if (response.data.code !== 0 && response.data.code !== 200) {
      throw new Error(response.data.message || "获取用户失败");
    }
    return response.data.data!;
  }

  // POST request
  async createUser(data: UserRequest): Promise<UserResponse> {
    const response = await this.post<ApiResponseBase<UserResponse>>("/", data);
    if (response.data.code !== 0 && response.data.code !== 200) {
      throw new Error(response.data.message || "创建用户失败");
    }
    return response.data.data!;
  }

  // PUT request
  async updateUser(id: string, data: Partial<UserRequest>): Promise<UserResponse> {
    const response = await this.put<ApiResponseBase<UserResponse>>(`/${id}`, data);
    if (response.data.code !== 0 && response.data.code !== 200) {
      throw new Error(response.data.message || "更新用户失败");
    }
    return response.data.data!;
  }

  // DELETE request
  async deleteUser(id: string): Promise<void> {
    const response = await this.delete<ApiResponseBase<void>>(`/${id}`);
    if (response.data.code !== 0 && response.data.code !== 200) {
      throw new Error(response.data.message || "删除用户失败");
    }
  }
}

// Export singleton instance
export const userService = new UserService();
```

### 2. Using apiService Instance

```typescript
import { apiService } from "@repo/services";
import type { ApiResponseBase } from "@repo/services";

// Direct API calls
export async function getUser(id: string): Promise<UserResponse> {
  const response = await apiService.get<ApiResponseBase<UserResponse>>(
    `/users/${id}`
  );
  
  if (response.data.code !== 0 && response.data.code !== 200) {
    throw new Error(response.data.message || "获取用户失败");
  }
  
  return response.data.data!;
}
```

## Response Structure

All API responses follow `ApiResponseBase<T>`:

```typescript
interface ApiResponseBase<T> {
  code: number;        // 0 or 200 = success
  message: string;      // Error message
  data: T | null;       // Response data
  timestamp?: number;   // Timestamp
  traceId?: string;     // Trace ID
  errors?: Array<{      // Field-level errors
    field: string;
    message: string;
    code?: string;
  }>;
}
```

## Error Handling

### Using handleApiResponse (Recommended)

```typescript
import { apiService, handleApiResponse } from "@repo/services";
import type { ApiResponseBase } from "@repo/services";

export async function createUser(data: UserRequest): Promise<UserResponse> {
  try {
    const response = await apiService.post<ApiResponseBase<UserResponse>>(
      "/users",
      data
    );
    
    // handleApiResponse automatically checks code and throws ServerError if failed
    const body = handleApiResponse(response, "创建用户失败");
    return body.data!;
  } catch (error) {
    // Handle ServerError (business errors) or network errors
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("网络错误，请稍后重试");
  }
}
```

### Manual Error Handling

```typescript
export async function createUser(data: UserRequest): Promise<UserResponse> {
  try {
    const response = await apiService.post<ApiResponseBase<UserResponse>>(
      "/users",
      data
    );
    
    // Check business error manually
    if (response.data.code !== 0 && response.data.code !== 200) {
      // Handle field-level errors
      if (response.data.errors && response.data.errors.length > 0) {
        const fieldErrors = response.data.errors;
        throw new Error(fieldErrors.map(e => e.message).join(", "));
      }
      
      // Handle general error
      throw new Error(response.data.message || "操作失败");
    }
    
    return response.data.data!;
  } catch (error) {
    // Handle network errors
    if (error instanceof Error) {
      throw error;
    }
    throw new Error("网络错误，请稍后重试");
  }
}
```

### Field-Level Error Handling (for Forms)

```typescript
import { handleServerError } from "@repo/utils";
import type { UseFormSetError } from "react-hook-form";

// For form integration with React Hook Form
export async function createUserWithFormErrors(
  data: UserRequest,
  setError: UseFormSetError<UserRequest>
): Promise<UserResponse | null> {
  try {
    const response = await apiService.post<ApiResponseBase<UserResponse>>(
      "/users",
      data
    );
    
    // Use handleApiResponse for business errors
    const body = handleApiResponse(response, "创建用户失败");
    return body.data!;
  } catch (error) {
    // Use handleServerError to set form errors
    const result = handleServerError(error, setError, "创建用户失败");
    
    // Return null if there are field-level errors
    if (result.type === "field") {
      return null;
    }
    
    // Re-throw for other error types
    throw error;
  }
}
```

## Authentication

Token is automatically injected by `APIServiceBase`:

```typescript
// ✅ Token is automatically added to Authorization header
// No need to manually add token

// White-list paths (no token required):
// - /auth/login
// - /auth/register
// - /auth/refresh
```

## Type Safety

### Define Types

```typescript
// types/user.types.ts
export interface User {
  id: string;
  username: string;
  email: string;
  createdAt: string;
}

export interface CreateUserRequest {
  username: string;
  email: string;
  password: string;
}

export interface UpdateUserRequest {
  username?: string;
  email?: string;
}
```

### Use Types in API Functions

```typescript
import type { User, CreateUserRequest } from "@/types/user.types";

export async function createUser(data: CreateUserRequest): Promise<User> {
  const response = await apiService.post<ApiResponseBase<User>>("/users", data);
  // ... error handling
  return response.data.data!;
}
```

## Common Patterns

### List with Pagination

```typescript
import { apiService, handleApiResponse } from "@repo/services";
import type { ApiResponseBase } from "@repo/services";

interface PaginationParams {
  page: number;
  pageSize: number;
}

interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
}

export async function getUsers(
  params: PaginationParams
): Promise<PaginatedResponse<User>> {
  const response = await apiService.get<ApiResponseBase<PaginatedResponse<User>>>(
    "/users",
    params
  );
  
  const body = handleApiResponse(response, "获取用户列表失败");
  return body.data!;
}
```

### File Upload

```typescript
import { apiService, handleApiResponse } from "@repo/services";
import type { ApiResponseBase } from "@repo/services";

export async function uploadFile(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("file", file);
  
  const response = await apiService.post<ApiResponseBase<{ url: string }>>(
    "/upload",
    formData,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
  
  const body = handleApiResponse(response, "上传失败");
  return body.data!;
}
```

## Best Practices

### ✅ Good Practices

- Use TypeScript types for all requests/responses
- Use `handleApiResponse` for consistent error handling
- Provide meaningful error messages
- Use `APIServiceBase` for consistent behavior
- Export singleton instances for services
- Group related APIs in service files
- Use `handleServerError` for form integration

### ❌ Anti-Patterns

- Don't ignore business errors (`code !== 0`)
- Don't use `any` types
- Don't hardcode API endpoints (use base URL)
- Don't manually add tokens (handled automatically)
- Don't mix error handling patterns
- Don't forget to check `code` field or use `handleApiResponse`

## Related Rules

- API Structure: `.cursor/rules/06-API结构.mdc`
- Form Error Handling: `.cursor/rules/10-表单错误处理.mdc`
- Security: `.cursor/rules/21-安全规范.mdc`
