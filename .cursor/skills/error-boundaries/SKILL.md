---
name: error-boundaries
description: Implement React Error Boundaries to catch and handle errors gracefully, preventing entire app crashes. Use when implementing error handling or improving app resilience.
---

# Error Boundaries

Implement React Error Boundaries for graceful error handling.

## Quick Checklist

When implementing error boundaries:

- [ ] **Error Boundary** component created
- [ ] **Error logging** implemented
- [ ] **Fallback UI** designed
- [ ] **Error recovery** options provided
- [ ] **Error reporting** configured
- [ ] **Boundary placement** strategic

## Basic Error Boundary

### 1. Error Boundary Component

```tsx
// apps/web/app/components/ErrorBoundary.tsx
import { Component, ReactNode, ErrorInfo } from "react";
import { logger } from "@repo/utils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("Error Boundary caught error", error, {
      componentStack: errorInfo.componentStack,
    });

    this.props.onError?.(error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="error-boundary">
            <h2>出错了</h2>
            <p>应用程序遇到了错误。请刷新页面重试。</p>
            <button onClick={() => window.location.reload()}>
              刷新页面
            </button>
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### 2. Usage

```tsx
<ErrorBoundary fallback={<CustomErrorUI />}>
  <App />
</ErrorBoundary>
```

## Error Boundary Hook

### 1. useErrorHandler Hook

```tsx
// packages/hooks/src/useErrorHandler.ts
import { useCallback } from "react";

export function useErrorHandler() {
  const handleError = useCallback((error: Error) => {
    // Trigger error boundary
    throw error;
  }, []);

  return { handleError };
}
```

## Best Practices

### ✅ Good Practices

- Place boundaries strategically
- Provide helpful fallback UI
- Log errors for debugging
- Allow error recovery
- Test error scenarios

### ❌ Anti-Patterns

- Don't catch all errors in one boundary
- Don't ignore error logging
- Don't skip fallback UI
- Don't forget error recovery

## Related Rules

- Error Handling: `.cursor/skills/error-handling/SKILL.md`
