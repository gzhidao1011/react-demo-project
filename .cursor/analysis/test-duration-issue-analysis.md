# 测试 Duration 长时间执行问题分析

## 问题描述

测试显示 "14 passed (27)"，意味着有 27 个测试用例，但只有 14 个通过。测试 Duration 一直执行，可能的原因：

1. **部分测试失败**：13 个测试可能失败或超时
2. **测试卡住**：某些测试可能在等待永远不会发生的事件
3. **异步操作未完成**：Promise 或 setTimeout 没有正确清理

## 问题根源

### 1. 使用 setTimeout 但未使用 Fake Timers

**问题测试**：`应该禁用提交按钮（提交中时）`

**问题代码**：
```typescript
mockAuthLogin.mockImplementation(() => 
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ... });
    }, 100);
  })
);
```

**问题**：
- 使用真实的 `setTimeout`，测试会等待真实的 100ms
- 如果 Promise 没有正确清理，可能导致测试卡住
- 没有使用 `vi.useFakeTimers()` 来控制时间

**解决方案**：
```typescript
// 使用未解析的 Promise 来模拟正在进行的异步操作
let resolvePromise: (value: any) => void;
const pendingPromise = new Promise<any>((resolve) => {
  resolvePromise = resolve;
});

mockAuthLogin.mockReturnValue(pendingPromise);

// 测试完成后清理
resolvePromise!({ ... });
await pendingPromise;
```

### 2. waitFor 缺少超时设置

**问题**：大部分 `waitFor` 没有设置超时时间，虽然 Vitest 默认超时是 30 秒，但最好为每个 `waitFor` 设置合理的超时时间。

**建议**：
```typescript
// ❌ 没有超时设置
await waitFor(() => {
  expect(element).toBeInTheDocument();
});

// ✅ 设置合理的超时时间
await waitFor(() => {
  expect(element).toBeInTheDocument();
}, { timeout: 3000 }); // 3 秒超时
```

## 已修复的问题

### ✅ 1. 修复 "应该禁用提交按钮（提交中时）" 测试

**修复前**：
```typescript
mockAuthLogin.mockImplementation(() => 
  new Promise((resolve) => {
    setTimeout(() => {
      resolve({ ... });
    }, 100);
  })
);
```

**修复后**：
```typescript
let resolvePromise: (value: any) => void;
const pendingPromise = new Promise<any>((resolve) => {
  resolvePromise = resolve;
});

mockAuthLogin.mockReturnValue(pendingPromise);

// 测试完成后清理
resolvePromise!({ ... });
await pendingPromise;
```

### ✅ 2. 改进断言方法

**修复前**：
```typescript
const emailInput = screen.getByLabelText("邮箱地址") as HTMLInputElement;
expect(emailInput.value).toBe("user@example.com");
```

**修复后**：
```typescript
const emailInput = screen.getByLabelText("邮箱地址");
expect(emailInput).toHaveValue("user@example.com");
```

### ✅ 3. 改进错误处理测试

**修复前**：测试实现细节（`handleServerError` 是否被调用）

**修复后**：测试用户可见的行为（错误消息是否显示）

## 测试超时配置

Vitest 配置（`apps/web/vitest.config.ts`）：
```typescript
test: {
  // 测试超时时间（30秒）
  testTimeout: 30000,
  // 钩子超时时间
  hookTimeout: 30000,
}
```

## 最佳实践

### 1. 使用 Fake Timers 处理 setTimeout

```typescript
it("测试使用 setTimeout 的功能", async () => {
  vi.useFakeTimers();
  const user = userEvent.setup({ 
    delay: null, 
    advanceTimers: (delay) => vi.advanceTimersByTime(delay) 
  });
  
  // ... 测试代码 ...
  
  vi.advanceTimersByTime(2000); // 推进时间
  
  vi.useRealTimers(); // 清理
});
```

### 2. 为 waitFor 设置超时时间

```typescript
await waitFor(() => {
  expect(element).toBeInTheDocument();
}, { timeout: 3000 }); // 3 秒超时
```

### 3. 使用未解析的 Promise 模拟进行中的操作

```typescript
let resolvePromise: (value: any) => void;
const pendingPromise = new Promise<any>((resolve) => {
  resolvePromise = resolve;
});

mockFunction.mockReturnValue(pendingPromise);

// 测试完成后清理
resolvePromise!({ ... });
await pendingPromise;
```

### 4. 确保测试清理

```typescript
afterEach(() => {
  vi.clearAllMocks();
  vi.useRealTimers(); // 如果使用了 fake timers
});
```

## 如何诊断测试问题

### 1. 查看测试输出

```bash
# 运行测试并查看详细输出
pnpm test sign-in/page.test.tsx --reporter=verbose
```

### 2. 使用 Vitest UI

```bash
# 启动 Vitest UI 查看测试状态
pnpm test:ui
```

### 3. 检查超时的测试

在 Vitest UI 中：
- 查看哪些测试超时
- 查看测试的执行时间
- 查看测试的错误信息

### 4. 添加调试日志

```typescript
it("测试名称", async () => {
  console.log("测试开始");
  // ... 测试代码 ...
  console.log("测试完成");
});
```

## 总结

**主要问题**：
1. ✅ **已修复**：使用 `setTimeout` 但未使用 fake timers
2. ⚠️ **建议改进**：为 `waitFor` 设置超时时间
3. ✅ **已改进**：使用 RTL 断言方法而不是直接访问 DOM 属性
4. ✅ **已改进**：测试用户可见的行为而不是实现细节

**建议**：
- 运行测试查看是否所有测试都通过
- 如果还有测试失败，查看具体的错误信息
- 考虑为所有 `waitFor` 设置合理的超时时间
