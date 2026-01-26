---
name: bug-fixing
description: Fix bugs systematically including bug identification, root cause analysis, testing, and verification. Use when fixing bugs, debugging issues, or resolving errors.
---

# Bug Fixing

Fix bugs systematically following best practices and project standards.

## Quick Checklist

When fixing bugs:

- [ ] **Reproduce** the bug consistently
- [ ] **Identify** root cause
- [ ] **Write** test case for the bug
- [ ] **Fix** the issue
- [ ] **Verify** fix works
- [ ] **Check** for regressions
- [ ] **Update** documentation if needed

## Bug Fixing Process

### 1. Reproduce the Bug

```typescript
// Document reproduction steps
/**
 * Bug: User cannot submit form when email is empty
 * 
 * Steps to reproduce:
 * 1. Open form page
 * 2. Leave email field empty
 * 3. Click submit button
 * 
 * Expected: Form shows validation error
 * Actual: Form submits without validation
 */
```

### 2. Identify Root Cause

```typescript
// Use debugging tools
console.log("Debug info:", { email, errors, isValid });

// Check browser console for errors
// Check network tab for API errors
// Check React DevTools for component state
```

### 3. Write Test Case

```typescript
// Write test that reproduces the bug
describe("Form validation", () => {
  it("should show error when email is empty", async () => {
    const { getByLabelText, getByRole, queryByText } = render(<Form />);
    
    const submitButton = getByRole("button", { name: /提交/i });
    fireEvent.click(submitButton);
    
    // This test should fail initially (reproducing the bug)
    expect(queryByText("邮箱不能为空")).toBeInTheDocument();
  });
});
```

### 4. Fix the Issue

```typescript
// Fix the root cause
const handleSubmit = async (data: FormData) => {
  // ✅ Fixed: Validate before submit
  if (!data.email) {
    setError("email", { message: "邮箱不能为空" });
    return;
  }
  
  await submitForm(data);
};
```

### 5. Verify the Fix

```typescript
// Test should now pass
describe("Form validation", () => {
  it("should show error when email is empty", async () => {
    // Test passes after fix
    expect(queryByText("邮箱不能为空")).toBeInTheDocument();
  });
});
```

## Common Bug Types

### 1. Type Errors

```typescript
// ❌ Bug: Type mismatch
function processData(data: string) {
  return data.toUpperCase();
}
processData(123); // Type error

// ✅ Fix: Add type guard
function processData(data: unknown) {
  if (typeof data !== "string") {
    throw new Error("Data must be a string");
  }
  return data.toUpperCase();
}
```

### 2. Null/Undefined Errors

```typescript
// ❌ Bug: Accessing property on undefined
const user = users.find(u => u.id === id);
console.log(user.name); // Error if user is undefined

// ✅ Fix: Check for null/undefined
const user = users.find(u => u.id === id);
if (!user) {
  throw new Error("User not found");
}
console.log(user.name);

// Or use optional chaining
console.log(user?.name);
```

### 3. Async/Await Errors

```typescript
// ❌ Bug: Not awaiting async function
function handleClick() {
  fetchData(); // Returns Promise, not awaited
  setData(result); // result is undefined
}

// ✅ Fix: Properly await
async function handleClick() {
  const result = await fetchData();
  setData(result);
}
```

### 4. State Update Errors

```typescript
// ❌ Bug: Direct state mutation
const updateUser = (id: string, data: Partial<User>) => {
  const user = users.find(u => u.id === id);
  user.name = data.name; // Mutates state directly
};

// ✅ Fix: Create new object
const updateUser = (id: string, data: Partial<User>) => {
  setUsers(users.map(u => 
    u.id === id ? { ...u, ...data } : u
  ));
};
```

### 5. Event Handler Errors

```typescript
// ❌ Bug: Event not prevented
<form onSubmit={handleSubmit}>
  {/* Form submits and page reloads */}
</form>

// ✅ Fix: Prevent default
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();
  // Handle submit
};
```

## Debugging Techniques

### 1. Console Logging

```typescript
// Strategic logging
console.log("Before:", { state, props });
// Do something
console.log("After:", { state, props });
```

### 2. Breakpoints

```typescript
// Use debugger statement
function complexFunction() {
  debugger; // Pause execution here
  // Code execution pauses, inspect variables
}
```

### 3. React DevTools

- Inspect component props and state
- Check component hierarchy
- Profile component performance
- Track state changes

### 4. Network Debugging

```typescript
// Check API responses
fetch("/api/data")
  .then(res => {
    console.log("Response status:", res.status);
    return res.json();
  })
  .then(data => {
    console.log("Response data:", data);
  })
  .catch(error => {
    console.error("Error:", error);
  });
```

## Bug Fix Patterns

### Pattern 1: Defensive Programming

```typescript
// ✅ Good: Handle edge cases
function divide(a: number, b: number): number {
  if (b === 0) {
    throw new Error("Division by zero");
  }
  return a / b;
}
```

### Pattern 2: Early Returns

```typescript
// ✅ Good: Early returns for clarity
function processUser(user: User | null) {
  if (!user) {
    return null;
  }
  if (!user.email) {
    return null;
  }
  // Process valid user
  return process(user);
}
```

### Pattern 3: Error Boundaries

```tsx
// ✅ Good: Catch errors in React
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught:", error, errorInfo);
    // Log to error tracking service
  }
  
  render() {
    if (this.state.hasError) {
      return <div>Something went wrong</div>;
    }
    return this.props.children;
  }
}
```

## Testing Bug Fixes

### 1. Unit Tests

```typescript
describe("Bug fix: Email validation", () => {
  it("should reject empty email", () => {
    const result = validateEmail("");
    expect(result).toBe(false);
  });
  
  it("should accept valid email", () => {
    const result = validateEmail("user@example.com");
    expect(result).toBe(true);
  });
});
```

### 2. Integration Tests

```typescript
describe("Form submission", () => {
  it("should not submit with empty email", async () => {
    const { getByRole, queryByText } = render(<Form />);
    const submitButton = getByRole("button", { name: /提交/i });
    
    fireEvent.click(submitButton);
    
    expect(queryByText("邮箱不能为空")).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});
```

### 3. Regression Tests

```typescript
// Test that fix doesn't break existing functionality
describe("Regression tests", () => {
  it("should still work for valid inputs", () => {
    // Test existing functionality still works
  });
});
```

## Bug Fix Checklist

Before submitting fix:

- [ ] Bug is reproducible
- [ ] Root cause identified
- [ ] Test case written (fails before fix, passes after)
- [ ] Fix implemented
- [ ] All tests pass
- [ ] No regressions introduced
- [ ] Code follows project standards
- [ ] Documentation updated if needed
- [ ] Commit message follows Conventional Commits

## Best Practices

### ✅ Good Practices

- Reproduce bug before fixing
- Write test case first (TDD approach)
- Fix root cause, not symptoms
- Test thoroughly after fix
- Check for regressions
- Document the fix
- Follow project coding standards

### ❌ Anti-Patterns

- Don't fix without understanding root cause
- Don't skip writing tests
- Don't introduce new bugs
- Don't ignore edge cases
- Don't forget to test edge cases
- Don't commit without verification

## Related Rules

- Code Review: `.cursor/skills/code-review/SKILL.md`
- Run Tests: `.cursor/skills/run-tests/SKILL.md`
- Generate Commit Message: `.cursor/skills/generate-commit-message/SKILL.md`
