---
name: write-documentation
description: Write clear and comprehensive documentation including code comments, API docs, README files, and user guides. Use when writing documentation, adding code comments, or creating documentation files.
---

# Write Documentation

Write clear and comprehensive documentation following project standards.

## Quick Checklist

When writing documentation:

- [ ] **Code comments** use Chinese (per project standard)
- [ ] **JSDoc** comments for functions and classes
- [ ] **README** files are clear and up-to-date
- [ ] **API documentation** includes examples
- [ ] **Examples** are provided for complex concepts
- [ ] **Documentation** is kept in sync with code

## Code Comments

### 1. Function Documentation (JSDoc)

```typescript
/**
 * 验证邮箱地址格式
 *
 * @param email - 要验证的邮箱地址
 * @returns 如果邮箱格式有效返回 true，否则返回 false
 *
 * @example
 * ```typescript
 * isValidEmail("user@example.com") // true
 * isValidEmail("invalid") // false
 * ```
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
```

### 2. Class Documentation

```typescript
/**
 * 用户服务类
 *
 * 提供用户相关的业务逻辑，包括用户创建、更新、查询等功能。
 *
 * @example
 * ```typescript
 * const userService = new UserService();
 * const user = await userService.createUser({ name: "John", email: "john@example.com" });
 * ```
 */
export class UserService {
  /**
   * 创建新用户
   *
   * @param userData - 用户数据
   * @returns 创建的用户对象
   * @throws {Error} 如果邮箱已存在则抛出错误
   */
  async createUser(userData: CreateUserRequest): Promise<User> {
    // Implementation
  }
}
```

### 3. Inline Comments

```typescript
// ✅ Good: Explains "why", not "what"
// 使用防抖避免频繁的 API 调用，提升性能
const debouncedSearch = debounce(handleSearch, 300);

// ❌ Bad: States the obvious
// 调用 handleSearch 函数
handleSearch();
```

### 4. Complex Logic Comments

```typescript
/**
 * 计算订单总价
 *
 * 考虑以下因素：
 * 1. 商品单价和数量
 * 2. 折扣（如果有）
 * 3. 税费（根据地区计算）
 * 4. 运费（根据重量和距离）
 */
function calculateOrderTotal(order: Order): number {
  // Implementation
}
```

## README Files

### 1. Project README Structure

```markdown
# Project Name

Brief description of the project.

## Features

- Feature 1
- Feature 2
- Feature 3

## Getting Started

### Prerequisites

- Node.js 22+
- pnpm 10.28.0+

### Installation

\`\`\`bash
pnpm install
\`\`\`

### Development

\`\`\`bash
pnpm dev
\`\`\`

## Project Structure

\`\`\`
project/
├── apps/          # Applications
├── packages/      # Shared packages
└── services/      # Backend services
\`\`\`

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md)

## License

MIT
```

### 2. Package README

```markdown
# @repo/utils

Utility functions for the project.

## Installation

\`\`\`bash
pnpm add @repo/utils
\`\`\`

## Usage

\`\`\`typescript
import { formatDate, validateEmail } from "@repo/utils";

const date = formatDate(new Date());
const isValid = validateEmail("user@example.com");
\`\`\`

## API Reference

### formatDate(date: Date): string

Formats a date to a readable string.

**Parameters:**
- `date` - The date to format

**Returns:** Formatted date string

**Example:**
\`\`\`typescript
formatDate(new Date("2024-01-01")) // "2024年1月1日"
\`\`\`

### validateEmail(email: string): boolean

Validates an email address.

**Parameters:**
- `email` - The email address to validate

**Returns:** `true` if valid, `false` otherwise
```

## API Documentation

### 1. API Endpoint Documentation

```typescript
/**
 * 获取用户信息
 *
 * @route GET /api/users/:id
 * @param id - 用户 ID
 * @returns 用户信息
 *
 * @example
 * ```typescript
 * const user = await getUser("123");
 * console.log(user.name); // "John Doe"
 * ```
 */
export async function getUser(id: string): Promise<User> {
  // Implementation
}
```

### 2. API Response Documentation

```typescript
/**
 * API 响应结构
 *
 * @template T - 响应数据类型
 */
interface ApiResponse<T> {
  /** 业务状态码，0 或 200 表示成功 */
  code: number;
  /** 错误消息（如果有） */
  message: string;
  /** 响应数据 */
  data: T | null;
  /** 时间戳 */
  timestamp?: number;
  /** 追踪 ID */
  traceId?: string;
}
```

## Component Documentation

### 1. Component Props Documentation

```tsx
/**
 * 按钮组件
 *
 * @example
 * ```tsx
 * <Button variant="primary" onClick={handleClick}>
 *   点击我
 * </Button>
 * ```
 */
interface ButtonProps {
  /** 按钮变体 */
  variant?: "primary" | "secondary" | "outline";
  /** 按钮大小 */
  size?: "sm" | "md" | "lg";
  /** 点击事件处理函数 */
  onClick?: () => void;
  /** 子元素 */
  children: React.ReactNode;
}

export function Button({ variant = "primary", size = "md", onClick, children }: ButtonProps) {
  // Implementation
}
```

### 2. Hook Documentation

```typescript
/**
 * 自定义 Hook：获取用户信息
 *
 * @param userId - 用户 ID
 * @returns 用户信息、加载状态和错误信息
 *
 * @example
 * ```typescript
 * const { user, loading, error } = useUser("123");
 *
 * if (loading) return <div>Loading...</div>;
 * if (error) return <div>Error: {error.message}</div>;
 * return <div>{user.name}</div>;
 * ```
 */
export function useUser(userId: string) {
  // Implementation
}
```

## Documentation Best Practices

### ✅ Good Practices

- Write comments in Chinese (per project standard)
- Use JSDoc for functions and classes
- Explain "why", not "what"
- Provide examples for complex concepts
- Keep documentation up-to-date with code
- Use clear, descriptive names
- Document all public APIs

### ❌ Anti-Patterns

- Don't state the obvious
- Don't write comments in English (violates project standard)
- Don't leave outdated documentation
- Don't forget to document breaking changes
- Don't skip examples for complex APIs

## Documentation Types

### 1. Code Comments

- **Inline comments**: Explain complex logic
- **Function comments**: JSDoc format
- **Class comments**: Describe purpose and usage

### 2. README Files

- **Project README**: Overview and getting started
- **Package README**: Package-specific documentation
- **Component README**: Component usage and examples

### 3. API Documentation

- **Endpoint documentation**: Route, parameters, responses
- **Type documentation**: Type definitions and examples
- **Error documentation**: Error codes and handling

### 4. User Guides

- **Getting started**: Step-by-step setup
- **Tutorials**: How-to guides
- **FAQ**: Common questions and answers

## Documentation Maintenance

### Keep Documentation Updated

- Update documentation when code changes
- Review documentation in code reviews
- Remove outdated examples
- Update version numbers
- Keep examples working

### Documentation Review Checklist

- [ ] All public APIs documented
- [ ] Examples are correct and working
- [ ] No outdated information
- [ ] Links are valid
- [ ] Code examples follow project standards

## Related Rules

- Basic Standards: `.cursor/rules/00-基础规范.mdc`
- Code Style: `.cursor/rules/01-代码风格.mdc`
