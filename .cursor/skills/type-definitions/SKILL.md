---
name: type-definitions
description: Create TypeScript type definitions following best practices including interfaces, types, generics, and utility types. Use when defining types, creating type definitions, or working with TypeScript types.
---

# Type Definitions

Create TypeScript type definitions following best practices and project standards.

## Quick Checklist

When defining types:

- [ ] **Avoid** `any` type
- [ ] **Use** interfaces for objects
- [ ] **Use** types for unions/intersections
- [ ] **Extend** existing types when possible
- [ ] **Use** generics for reusable types
- [ ] **Document** complex types
- [ ] **Export** types from index files

## Type vs Interface

### 1. Use Interface for Objects

```typescript
// ✅ Good: Use interface for object shapes
interface User {
  id: string;
  name: string;
  email: string;
}

// ✅ Good: Interface can be extended
interface AdminUser extends User {
  permissions: string[];
}
```

### 2. Use Type for Unions/Intersections

```typescript
// ✅ Good: Use type for unions
type Status = "pending" | "approved" | "rejected";

// ✅ Good: Use type for intersections
type UserWithRole = User & { role: Role };

// ✅ Good: Use type for computed types
type UserKeys = keyof User;
```

## Type Definitions Best Practices

### 1. Avoid `any`

```typescript
// ❌ Bad: Using any
function processData(data: any) {
  return data.value;
}

// ✅ Good: Use unknown and type guards
function processData(data: unknown) {
  if (typeof data === "object" && data !== null && "value" in data) {
    return (data as { value: string }).value;
  }
  throw new Error("Invalid data");
}

// ✅ Better: Define proper type
interface Data {
  value: string;
}

function processData(data: Data) {
  return data.value;
}
```

### 2. Extend Existing Types

```typescript
// ✅ Good: Extend existing type
interface User {
  id: string;
  name: string;
  email: string;
}

type UserWithTimestamp = User & {
  createdAt: Date;
  updatedAt: Date;
};

// ✅ Good: Use utility types
type PartialUser = Partial<User>;
type UserId = Pick<User, "id">;
type UserWithoutEmail = Omit<User, "email">;
```

### 3. Use Generics

```typescript
// ✅ Good: Generic function
function identity<T>(value: T): T {
  return value;
}

// ✅ Good: Generic interface
interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

// ✅ Good: Generic with constraints
interface Repository<T extends { id: string }> {
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
}
```

### 4. Document Complex Types

```typescript
/**
 * 用户信息类型
 *
 * @property id - 用户唯一标识
 * @property name - 用户姓名
 * @property email - 用户邮箱
 * @property role - 用户角色（可选）
 */
interface User {
  /** 用户唯一标识 */
  id: string;
  /** 用户姓名 */
  name: string;
  /** 用户邮箱 */
  email: string;
  /** 用户角色 */
  role?: "admin" | "user" | "guest";
}
```

## Common Type Patterns

### 1. API Response Types

```typescript
// Base response type
interface ApiResponseBase<T> {
  code: number;
  message: string;
  data: T | null;
  timestamp?: number;
  traceId?: string;
}

// Specific response types
type UserResponse = ApiResponseBase<User>;
type UsersResponse = ApiResponseBase<User[]>;
```

### 2. Form Types

```typescript
// Form data type
interface LoginFormData {
  username: string;
  password: string;
}

// Form with errors
type LoginFormErrors = {
  [K in keyof LoginFormData]?: string;
};

// Form state
interface LoginFormState {
  data: LoginFormData;
  errors: LoginFormErrors;
  isSubmitting: boolean;
}
```

### 3. Component Props Types

```typescript
// Base props
interface BaseComponentProps {
  className?: string;
  children?: React.ReactNode;
}

// Extended props
interface ButtonProps extends BaseComponentProps {
  variant?: "primary" | "secondary" | "outline";
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
  disabled?: boolean;
}
```

### 4. Event Handler Types

```typescript
// Event handler types
type ClickHandler = (event: React.MouseEvent<HTMLButtonElement>) => void;
type ChangeHandler = (event: React.ChangeEvent<HTMLInputElement>) => void;
type SubmitHandler = (event: React.FormEvent<HTMLFormElement>) => void;

// Usage
interface FormProps {
  onSubmit: SubmitHandler;
  onChange: ChangeHandler;
}
```

## Utility Types

### 1. Built-in Utility Types

```typescript
// Partial: Make all properties optional
type PartialUser = Partial<User>;

// Required: Make all properties required
type RequiredUser = Required<User>;

// Pick: Select specific properties
type UserIdAndName = Pick<User, "id" | "name">;

// Omit: Exclude specific properties
type UserWithoutEmail = Omit<User, "email">;

// Record: Create object type
type UserRoles = Record<string, "admin" | "user">;

// Readonly: Make all properties readonly
type ReadonlyUser = Readonly<User>;
```

### 2. Custom Utility Types

```typescript
// Make specific properties optional
type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

type UserWithOptionalEmail = Optional<User, "email">;

// Make specific properties required
type Required<T, K extends keyof T> = T & { [P in K]-?: T[P] };

type UserWithRequiredEmail = Required<User, "email">;
```

## Type Organization

### 1. Type Files Structure

```
types/
├── index.ts           # Export all types
├── user.types.ts      # User-related types
├── api.types.ts       # API-related types
└── common.types.ts    # Common types
```

### 2. Export Types

```typescript
// types/user.types.ts
export interface User {
  id: string;
  name: string;
}

export type UserRole = "admin" | "user";

// types/index.ts
export * from "./user.types";
export * from "./api.types";
export * from "./common.types";
```

## Type Safety Patterns

### 1. Type Guards

```typescript
// Type guard function
function isUser(obj: unknown): obj is User {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "id" in obj &&
    "name" in obj &&
    "email" in obj
  );
}

// Usage
function processUser(data: unknown) {
  if (isUser(data)) {
    // TypeScript knows data is User here
    console.log(data.name);
  }
}
```

### 2. Discriminated Unions

```typescript
// Discriminated union
type ApiResult<T> =
  | { status: "success"; data: T }
  | { status: "error"; error: string };

function handleResult<T>(result: ApiResult<T>) {
  if (result.status === "success") {
    // TypeScript knows result.data exists
    return result.data;
  } else {
    // TypeScript knows result.error exists
    throw new Error(result.error);
  }
}
```

## Best Practices

### ✅ Good Practices

- Avoid `any` type
- Use interfaces for object shapes
- Use types for unions/intersections
- Extend existing types when possible
- Use generics for reusable code
- Document complex types
- Use type guards for runtime checks
- Export types from index files

### ❌ Anti-Patterns

- Don't use `any` unless absolutely necessary
- Don't create duplicate types
- Don't ignore type errors
- Don't use `as` type assertions unnecessarily
- Don't forget to export types
- Don't mix interface and type unnecessarily

## Related Rules

- TypeScript Guide: `.cursor/rules/03-TypeScript指南.mdc`
- Code Style: `.cursor/rules/01-代码风格.mdc`
- API Development: `.cursor/skills/api-development/SKILL.md`
