---
name: debugging-techniques
description: Debug code effectively using browser DevTools, React DevTools, breakpoints, console logging, and other debugging tools. Use when debugging issues, investigating errors, or troubleshooting problems.
---

# Debugging Techniques

Debug code effectively using modern debugging tools and techniques.

## Quick Checklist

When debugging:

- [ ] **Reproduce** the issue consistently
- [ ] **Check** browser console for errors
- [ ] **Use** React DevTools for component inspection
- [ ] **Set** breakpoints in code
- [ ] **Check** network requests
- [ ] **Verify** state and props
- [ ] **Test** with different inputs
- [ ] **Check** logs and error messages

## Browser DevTools

### 1. Console Debugging

```typescript
// Strategic logging
console.log("Before:", { state, props });
// Do something
console.log("After:", { state, props });

// Group related logs
console.group("User Actions");
console.log("Click:", event);
console.log("State:", state);
console.groupEnd();

// Table for objects/arrays
console.table(users);

// Time operations
console.time("API Call");
await fetchData();
console.timeEnd("API Call");
```

### 2. Breakpoints

```typescript
// Use debugger statement
function complexFunction() {
  debugger; // Execution pauses here
  // Inspect variables in DevTools
  const result = processData();
  return result;
}
```

### 3. Network Tab

```typescript
// Check API requests
fetch("/api/users")
  .then(res => {
    console.log("Status:", res.status);
    console.log("Headers:", res.headers);
    return res.json();
  })
  .then(data => {
    console.log("Data:", data);
  })
  .catch(error => {
    console.error("Error:", error);
  });
```

## React DevTools

### 1. Component Inspection

- **Components tab**: Inspect component tree
- **Props**: View component props
- **State**: View component state
- **Hooks**: Inspect hook values

### 2. Profiler

```tsx
import { Profiler } from "react";

function onRenderCallback(id, phase, actualDuration) {
  console.log("Component:", id);
  console.log("Phase:", phase);
  console.log("Duration:", actualDuration, "ms");
}

<Profiler id="App" onRender={onRenderCallback}>
  <App />
</Profiler>;
```

### 3. Hook Inspection

```typescript
// Use React DevTools to inspect:
const [state, setState] = useState(initialValue);
const memoizedValue = useMemo(() => computeExpensiveValue(a, b), [a, b]);
const callback = useCallback(() => {
  // Function body
}, [dependencies]);
```

## Debugging Strategies

### 1. Binary Search

```typescript
// Narrow down the problem
function findIssue() {
  // Test half of the code
  if (testFirstHalf()) {
    // Issue in first half
    findIssueInFirstHalf();
  } else {
    // Issue in second half
    findIssueInSecondHalf();
  }
}
```

### 2. Isolate the Problem

```typescript
// Test components in isolation
function TestComponent() {
  return <Component prop1="test" prop2="value" />;
}

// Test functions independently
const result = testFunction(input);
console.log("Result:", result);
```

### 3. Check Assumptions

```typescript
// Verify assumptions
console.assert(user !== null, "User should not be null");
console.assert(Array.isArray(items), "Items should be an array");

// Or use TypeScript
if (!user) {
  throw new Error("User is null");
}
```

## Common Debugging Scenarios

### 1. State Not Updating

```typescript
// Check if state update is happening
const [count, setCount] = useState(0);

useEffect(() => {
  console.log("Count changed:", count);
}, [count]);

// Check if setState is called
const handleClick = () => {
  console.log("Before setCount:", count);
  setCount(count + 1);
  console.log("After setCount:", count); // Still old value (async)
};
```

### 2. Infinite Loops

```typescript
// Check useEffect dependencies
useEffect(() => {
  // This runs on every render if dependencies are wrong
  fetchData();
}, [data]); // data changes, triggers fetchData, updates data, infinite loop

// Fix: Remove data from dependencies or use useCallback
useEffect(() => {
  fetchData();
}, []); // Run once on mount
```

### 3. Async Issues

```typescript
// Check async/await
async function fetchData() {
  try {
    const response = await fetch("/api/data");
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error;
  }
}

// Verify promise handling
fetchData()
  .then(data => console.log("Data:", data))
  .catch(error => console.error("Error:", error));
```

### 4. Type Errors

```typescript
// Use TypeScript to catch type errors
function processUser(user: User) {
  // TypeScript will error if user is wrong type
  console.log(user.name);
}

// Runtime type checking
function processUser(user: unknown) {
  if (typeof user !== "object" || user === null) {
    throw new Error("User must be an object");
  }
  if (!("name" in user)) {
    throw new Error("User must have name property");
  }
  console.log(user.name);
}
```

## Debugging Tools

### 1. React Query DevTools

```tsx
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### 2. Redux DevTools

```typescript
// If using Redux
import { configureStore } from "@reduxjs/toolkit";

const store = configureStore({
  reducer: rootReducer,
  devTools: process.env.NODE_ENV !== "production",
});
```

### 3. Error Boundaries

```tsx
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught:", error);
    console.error("Error info:", errorInfo);
    // Send to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return <div>Something went wrong</div>;
    }
    return this.props.children;
  }
}
```

## Network Debugging

### 1. Check Request/Response

```typescript
// Log request details
const response = await fetch("/api/data", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify(data),
});

console.log("Request URL:", response.url);
console.log("Status:", response.status);
console.log("Headers:", Object.fromEntries(response.headers.entries()));

const responseData = await response.json();
console.log("Response:", responseData);
```

### 2. Mock API Responses

```typescript
// Mock API for testing
const mockFetch = async (url: string) => {
  if (url.includes("/api/users")) {
    return {
      json: async () => ({ id: 1, name: "Test User" }),
    };
  }
  return fetch(url);
};
```

## Performance Debugging

### 1. Measure Performance

```typescript
// Measure function execution time
const start = performance.now();
await expensiveOperation();
const end = performance.now();
console.log(`Operation took ${end - start}ms`);

// Use React Profiler
<Profiler id="Component" onRender={onRenderCallback}>
  <Component />
</Profiler>;
```

### 2. Memory Leaks

```typescript
// Check for memory leaks
useEffect(() => {
  const interval = setInterval(() => {
    // Do something
  }, 1000);

  // Cleanup
  return () => clearInterval(interval);
}, []);
```

## Best Practices

### ✅ Good Practices

- Use console.log strategically
- Set breakpoints for complex logic
- Use React DevTools for component inspection
- Check network tab for API issues
- Test in isolation
- Verify assumptions
- Use TypeScript for type safety
- Clean up side effects

### ❌ Anti-Patterns

- Don't leave console.logs in production
- Don't debug without understanding the problem
- Don't ignore error messages
- Don't skip testing edge cases
- Don't forget to clean up side effects

## Related Rules

- Bug Fixing: `.cursor/skills/bug-fixing/SKILL.md`
- Code Review: `.cursor/skills/code-review/SKILL.md`
- Run Tests: `.cursor/skills/run-tests/SKILL.md`
