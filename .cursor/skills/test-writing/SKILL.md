---
name: test-writing
description: Write tests following project standards using Vitest and React Testing Library. Use when writing tests, creating test cases, or improving test coverage.
---

# Test Writing

Write tests following project standards: Vitest + React Testing Library.

## Quick Checklist

When writing tests:

- [ ] **AAA pattern** used (Arrange-Act-Assert)
- [ ] **Test name** describes what is tested
- [ ] **Edge cases** covered
- [ ] **Async operations** handled correctly
- [ ] **Mocks** used for external dependencies
- [ ] **Test isolation** maintained
- [ ] **Coverage** meets requirements (80%+)

## Test Structure (AAA Pattern)

### 1. Arrange-Act-Assert Pattern

```typescript
import { describe, it, expect } from "vitest";
import { validateEmail } from "./validate-email";

describe("validateEmail", () => {
  it("should return true for valid email", () => {
    // Arrange: Set up test data
    const email = "user@example.com";
    
    // Act: Execute the function
    const result = validateEmail(email);
    
    // Assert: Verify the result
    expect(result).toBe(true);
  });
});
```

### 2. Test Organization

```typescript
describe("FeatureName", () => {
  describe("Valid inputs", () => {
    it("should handle case 1", () => {
      // Test valid case 1
    });
    
    it("should handle case 2", () => {
      // Test valid case 2
    });
  });
  
  describe("Invalid inputs", () => {
    it("should reject invalid case 1", () => {
      // Test invalid case 1
    });
    
    it("should reject invalid case 2", () => {
      // Test invalid case 2
    });
  });
  
  describe("Edge cases", () => {
    it("should handle edge case 1", () => {
      // Test edge case
    });
  });
});
```

## Unit Tests

### 1. Testing Pure Functions

```typescript
import { describe, it, expect } from "vitest";
import { calculateTotal } from "./utils";

describe("calculateTotal", () => {
  it("should calculate sum of numbers", () => {
    expect(calculateTotal([1, 2, 3])).toBe(6);
  });
  
  it("should return 0 for empty array", () => {
    expect(calculateTotal([])).toBe(0);
  });
  
  it("should handle negative numbers", () => {
    expect(calculateTotal([-1, 2, -3])).toBe(-2);
  });
});
```

### 2. Testing Async Functions

```typescript
import { describe, it, expect, vi } from "vitest";

describe("fetchUser", () => {
  it("should fetch user data", async () => {
    // Arrange
    const userId = "123";
    const mockUser = { id: "123", name: "John" };
    
    // Mock fetch
    global.fetch = vi.fn().mockResolvedValue({
      json: async () => mockUser,
    });
    
    // Act
    const user = await fetchUser(userId);
    
    // Assert
    expect(user).toEqual(mockUser);
    expect(global.fetch).toHaveBeenCalledWith(`/api/users/${userId}`);
  });
  
  it("should throw error on fetch failure", async () => {
    // Arrange
    global.fetch = vi.fn().mockRejectedValue(new Error("Network error"));
    
    // Act & Assert
    await expect(fetchUser("123")).rejects.toThrow("Network error");
  });
});
```

## Component Tests

### 1. Testing Component Rendering

```typescript
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("should render button with text", () => {
    // Arrange & Act
    render(<Button>Click me</Button>);
    
    // Assert
    expect(screen.getByRole("button", { name: /click me/i })).toBeInTheDocument();
  });
  
  it("should call onClick when clicked", () => {
    // Arrange
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click</Button>);
    
    // Act
    screen.getByRole("button").click();
    
    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. Testing User Interactions

```typescript
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";

describe("Form", () => {
  it("should submit form with user input", async () => {
    // Arrange
    const user = userEvent.setup();
    const handleSubmit = vi.fn();
    render(<Form onSubmit={handleSubmit} />);
    
    // Act
    await user.type(screen.getByLabelText(/email/i), "user@example.com");
    await user.click(screen.getByRole("button", { name: /submit/i }));
    
    // Assert
    expect(handleSubmit).toHaveBeenCalledWith({
      email: "user@example.com",
    });
  });
});
```

### 3. Testing Form Validation

```typescript
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";

describe("LoginForm", () => {
  it("should show error for empty email", async () => {
    // Arrange
    const user = userEvent.setup();
    render(<LoginForm />);
    
    // Act
    await user.click(screen.getByRole("button", { name: /submit/i }));
    
    // Assert
    await waitFor(() => {
      expect(screen.getByText("邮箱不能为空")).toBeInTheDocument();
    });
  });
});
```

## Testing Hooks

### 1. Testing Custom Hooks

```typescript
import { renderHook, act } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { useCounter } from "./useCounter";

describe("useCounter", () => {
  it("should initialize with default value", () => {
    const { result } = renderHook(() => useCounter());
    expect(result.current.count).toBe(0);
  });
  
  it("should increment count", () => {
    const { result } = renderHook(() => useCounter());
    
    act(() => {
      result.current.increment();
    });
    
    expect(result.current.count).toBe(1);
  });
});
```

## Mocking

### 1. Mocking Functions

```typescript
import { vi } from "vitest";

// Mock a function
const mockFetch = vi.fn();
vi.mock("./api", () => ({
  fetchData: mockFetch,
}));

// Mock implementation
mockFetch.mockResolvedValue({ data: "test" });

// Verify calls
expect(mockFetch).toHaveBeenCalledTimes(1);
expect(mockFetch).toHaveBeenCalledWith("arg");
```

### 2. Mocking Modules

```typescript
import { vi } from "vitest";

// Mock entire module
vi.mock("@repo/services", () => ({
  apiService: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));
```

### 3. Mocking Browser APIs

```typescript
import { vi } from "vitest";

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
global.localStorage = localStorageMock as any;

// Mock window.matchMedia
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
```

## Test Coverage

### 1. Coverage Requirements

- **Overall**: Minimum 80%
- **Critical modules**: Minimum 90%
- **Utility functions**: Minimum 90%
- **Business logic**: Minimum 70%

### 2. Checking Coverage

```bash
# Generate coverage report
pnpm test:coverage

# View HTML report
# Open coverage/lcov-report/index.html
```

## Best Practices

### ✅ Good Practices

- Use descriptive test names
- Follow AAA pattern
- Test one thing per test
- Test edge cases and error conditions
- Use proper assertions
- Mock external dependencies
- Keep tests independent
- Clean up after tests

### ❌ Anti-Patterns

- Don't test implementation details
- Don't write tests that depend on each other
- Don't use magic numbers/strings
- Don't skip edge cases
- Don't forget to test error cases
- Don't test third-party libraries
- Don't write tests that are too complex

## Common Test Patterns

### 1. Testing Error Handling

```typescript
it("should throw error for invalid input", () => {
  expect(() => {
    processData(null);
  }).toThrow("Input cannot be null");
});
```

### 2. Testing Conditional Logic

```typescript
describe("processUser", () => {
  it("should process admin user", () => {
    const user = { role: "admin", name: "John" };
    const result = processUser(user);
    expect(result.permissions).toContain("admin");
  });
  
  it("should process regular user", () => {
    const user = { role: "user", name: "Jane" };
    const result = processUser(user);
    expect(result.permissions).not.toContain("admin");
  });
});
```

### 3. Testing Side Effects

```typescript
it("should update localStorage", () => {
  const setItemSpy = vi.spyOn(Storage.prototype, "setItem");
  
  saveToStorage("key", "value");
  
  expect(setItemSpy).toHaveBeenCalledWith("key", "value");
});
```

## Related Rules

- Test Standards: `.cursor/rules/20-测试与覆盖率规范.mdc`
- Test Configuration: `.cursor/rules/15-测试与发布流程.mdc`
- Run Tests: `.cursor/skills/run-tests/SKILL.md`
