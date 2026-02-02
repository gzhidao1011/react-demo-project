# @repo/utils 测试规范

本文档定义了 `@repo/utils` 包的测试驱动开发（TDD）规范和最佳实践。

## 测试框架

项目使用 **Vitest** 作为测试框架，它是 Vite 原生的测试运行器，具有以下优势：

- ✅ 与 Vite 配置兼容
- ✅ 支持 ESM 和 TypeScript
- ✅ 快速的热重载
- ✅ 内置覆盖率支持
- ✅ 兼容 Jest API

## 目录结构

### 推荐方式：Co-located Tests（测试文件与源文件同目录）

这是 **Vitest/Jest 官方推荐的首选方式**，也是大型项目和国外主流做法：

```
packages/utils/
├── src/
│   ├── validate-email.ts          # 源代码文件
│   ├── validate-email.test.ts     # 对应的测试文件（推荐）
│   ├── auth.ts
│   ├── form-errors.ts
│   └── index.ts
├── vitest.config.ts               # Vitest 配置文件
├── .vitest-setup.ts               # 全局测试设置文件
└── TESTING.md                     # 本文档
```

**优势**：
- ✅ **官方推荐**：Vitest/Jest 官方文档首选方式
- ✅ **主流做法**：React、Vue、Next.js、Remix 等大型项目采用
- ✅ **易于发现**：测试文件紧邻源文件，容易找到
- ✅ **维护性好**：修改源文件时，测试文件就在旁边
- ✅ **导入简单**：相对路径导入更直观

**采用此方式的知名项目**：
- React（Facebook）
- Vue.js
- Next.js（Vercel）
- Remix
- Svelte
- Angular（部分）

### 替代方式：__tests__ 目录（可选）

如果项目偏好分离测试文件，可以使用 `__tests__` 目录：

```
packages/utils/
├── src/
│   ├── validate-email.ts
│   ├── auth.ts
│   ├── form-errors.ts
│   ├── index.ts
│   └── __tests__/                 # 测试文件目录（可选）
│       ├── validate-email.test.ts
│       └── auth.test.ts
```

**适用场景**：
- 测试文件较多，希望保持 `src/` 目录整洁
- 团队偏好测试文件与源文件分离
- 需要为同一源文件编写多个测试文件

**注意**：这种方式不是官方推荐的首选，但在某些项目中也有使用。

## 测试文件命名规范

- **推荐**：`*.test.ts` 或 `*.spec.ts`
- **位置**：测试文件与源文件放在同一目录（`src/`）- **推荐方式**
- **示例**：
  - `validate-email.ts` → `validate-email.test.ts`
  - `auth.ts` → `auth.test.ts`

## 测试驱动开发（TDD）流程

### 1. 编写测试（Red）

首先编写测试用例，描述期望的行为：

```typescript
import { describe, it, expect } from "vitest"
import { validateEmail } from "./validate-email"

describe("validateEmail", () => {
  it("应该接受标准邮箱格式", () => {
    expect(validateEmail("user@example.com")).toBe(true)
  })
})
```

### 2. 运行测试（Red）

运行测试，确认测试失败（因为函数还未实现）：

```bash
pnpm test
```

### 3. 实现功能（Green）

实现最小代码使测试通过：

```typescript
export function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}
```

### 4. 重构（Refactor）

在测试通过的基础上重构代码，提高代码质量。

### 5. 重复

添加更多测试用例，逐步完善功能。

## 测试用例编写规范

### 使用 describe 组织测试

```typescript
describe("函数名", () => {
  describe("功能分组1", () => {
    it("应该...", () => {
      // 测试代码
    })
  })

  describe("功能分组2", () => {
    it("应该...", () => {
      // 测试代码
    })
  })
})
```

### 测试用例命名规范

- **使用中文描述**：测试用例描述应该清晰说明测试的目的
- **使用"应该"开头**：描述期望的行为
- **示例**：
  - ✅ `it("应该接受标准邮箱格式", ...)`
  - ✅ `it("应该拒绝空字符串", ...)`
  - ❌ `it("test email", ...)`
  - ❌ `it("email validation", ...)`

### 测试用例结构

每个测试用例应该包含：

1. **Arrange（准备）**：设置测试数据和环境
2. **Act（执行）**：调用被测试的函数
3. **Assert（断言）**：验证结果

```typescript
it("应该接受标准邮箱格式", () => {
  // Arrange: 准备测试数据
  const validEmail = "user@example.com"

  // Act: 执行函数
  const result = validateEmail(validEmail)

  // Assert: 验证结果
  expect(result).toBe(true)
})
```

### 测试覆盖范围

每个函数应该包含以下类型的测试：

1. **正常情况**：有效输入的各种情况
2. **边界情况**：边界值、空值、null/undefined
3. **异常情况**：无效输入、错误类型
4. **边界值**：最大值、最小值、空字符串

### 示例：完整的测试文件

```typescript
import { describe, it, expect } from "vitest"
import { validateEmail } from "./validate-email"

describe("validateEmail", () => {
  describe("有效邮箱地址", () => {
    it("应该接受标准邮箱格式", () => {
      expect(validateEmail("user@example.com")).toBe(true)
    })

    it("应该接受包含加号的邮箱", () => {
      expect(validateEmail("user+tag@example.com")).toBe(true)
    })
  })

  describe("无效邮箱地址", () => {
    it("应该拒绝空字符串", () => {
      expect(validateEmail("")).toBe(false)
    })

    it("应该拒绝缺少 @ 符号的邮箱", () => {
      expect(validateEmail("userexample.com")).toBe(false)
    })
  })

  describe("边界情况", () => {
    it("应该处理包含首尾空格的邮箱", () => {
      expect(validateEmail("  user@example.com  ")).toBe(true)
    })
  })
})
```

## 测试命令

### 运行所有测试

```bash
pnpm test
```

### 监听模式（开发时使用）

```bash
pnpm test:watch
```

### 生成覆盖率报告

```bash
pnpm test:coverage
```

### 使用 UI 界面

```bash
pnpm test:ui
```

## 断言最佳实践

### 使用明确的断言

```typescript
// ✅ 推荐：明确的断言
expect(result).toBe(true)
expect(result).toBe(false)
expect(result).toEqual(expectedValue)

// ❌ 不推荐：模糊的断言
expect(result).toBeTruthy()
expect(result).toBeFalsy()
```

### 测试错误情况

```typescript
// 测试函数抛出错误
it("应该在输入无效时抛出错误", () => {
  expect(() => {
    someFunction(invalidInput)
  }).toThrow()
})

// 测试特定错误消息
it("应该抛出特定错误消息", () => {
  expect(() => {
    someFunction(invalidInput)
  }).toThrow("错误消息")
})
```

### 测试异步函数

```typescript
it("应该正确处理异步操作", async () => {
  const result = await asyncFunction()
  expect(result).toBe(expectedValue)
})
```

## 代码覆盖率目标

- **语句覆盖率**：≥ 80%
- **分支覆盖率**：≥ 80%
- **函数覆盖率**：≥ 80%
- **行覆盖率**：≥ 80%

## 最佳实践

### 1. 测试应该独立

每个测试用例应该独立运行，不依赖其他测试的状态。

```typescript
// ✅ 推荐：每个测试独立
it("测试1", () => {
  const result = validateEmail("test@example.com")
  expect(result).toBe(true)
})

it("测试2", () => {
  const result = validateEmail("invalid")
  expect(result).toBe(false)
})

// ❌ 不推荐：测试之间依赖
let sharedState = ""

it("测试1", () => {
  sharedState = "test"
})

it("测试2", () => {
  expect(sharedState).toBe("test") // 依赖测试1
})
```

### 2. 测试应该快速

避免在测试中进行慢速操作（如网络请求、文件 I/O）。

```typescript
// ✅ 推荐：使用 mock
vi.mock("./api", () => ({
  fetchData: vi.fn(() => Promise.resolve({ data: "test" })),
}))

// ❌ 不推荐：真实网络请求
it("测试", async () => {
  const result = await fetch("https://api.example.com/data")
  // ...
})
```

### 3. 测试应该可读

测试代码应该清晰易懂，使用描述性的变量名和注释。

```typescript
// ✅ 推荐：清晰的测试
it("应该接受标准邮箱格式", () => {
  const validEmail = "user@example.com"
  const result = validateEmail(validEmail)
  expect(result).toBe(true)
})

// ❌ 不推荐：难以理解的测试
it("测试", () => {
  expect(validateEmail("a@b.c")).toBe(true)
})
```

### 4. 测试应该全面

覆盖所有重要的代码路径，包括正常情况、边界情况和异常情况。

### 5. 使用测试辅助函数

对于重复的测试逻辑，提取为辅助函数：

```typescript
// 测试辅助函数
function testValidEmail(email: string) {
  expect(validateEmail(email)).toBe(true)
}

function testInvalidEmail(email: string) {
  expect(validateEmail(email)).toBe(false)
}

// 使用
it("应该接受多种有效邮箱格式", () => {
  testValidEmail("user@example.com")
  testValidEmail("user.name@example.com")
  testValidEmail("user+tag@example.com")
})
```

## 常见问题

### Q: 测试文件应该放在哪里？

A: **推荐与源文件放在同一目录（`src/`）**，使用 `*.test.ts` 命名。这是：
- ✅ Vitest/Jest 官方推荐的首选方式
- ✅ React、Vue、Next.js 等大型项目的标准做法
- ✅ 国外主流开发团队的首选

**为什么选择 co-located tests？**
1. **易于发现**：测试文件紧邻源文件，修改代码时容易找到对应的测试
2. **维护性好**：删除或移动源文件时，测试文件一起移动
3. **导入简单**：相对路径导入更直观（`./validate-email`）
4. **符合直觉**：测试是代码的一部分，应该与代码放在一起

**什么时候使用 `__tests__` 目录？**
- 测试文件特别多，希望保持 `src/` 目录整洁
- 团队有明确的分离偏好
- 需要为同一文件编写多个测试文件

### Q: 如何测试私有函数？

A: 通常只测试公共 API。如果私有函数逻辑复杂，可以考虑：
1. 将私有函数提取为独立的公共函数
2. 通过公共函数间接测试
3. 使用 `export` 导出用于测试（不推荐，除非必要）

### Q: 如何测试错误处理？

A: 使用 `expect().toThrow()` 或 `expect().rejects.toThrow()`：

```typescript
it("应该在输入无效时抛出错误", () => {
  expect(() => {
    validateEmail(null as any)
  }).toThrow()
})
```

### Q: 如何测试异步函数？

A: 使用 `async/await` 或返回 Promise：

```typescript
it("应该正确处理异步操作", async () => {
  const result = await asyncFunction()
  expect(result).toBe(expectedValue)
})
```

## 参考资源

- [Vitest 文档](https://vitest.dev/)
- [测试驱动开发（TDD）](https://en.wikipedia.org/wiki/Test-driven_development)
- [单元测试最佳实践](https://github.com/goldbergyoni/javascript-testing-best-practices)
