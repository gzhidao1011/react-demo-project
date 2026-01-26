---
name: logging-management
description: Implement logging strategies including structured logging, log levels, error tracking, and log aggregation. Use when implementing logging, debugging production issues, or setting up monitoring.
---

# Logging Management

Implement logging strategies for debugging and monitoring.

## Quick Checklist

When implementing logging:

- [ ] **Log levels** defined (debug, info, warn, error)
- [ ] **Structured logging** implemented
- [ ] **Error tracking** configured
- [ ] **Log context** included (user ID, request ID)
- [ ] **Sensitive data** excluded
- [ ] **Log aggregation** set up (if needed)
- [ ] **Performance logging** added (if needed)

## Logging Levels

### 1. Log Level Enum

```typescript
// packages/utils/src/logger.ts
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const currentLogLevel = LogLevel.INFO; // Set based on environment
```

### 2. Logger Implementation

```typescript
interface LogContext {
  userId?: string;
  requestId?: string;
  [key: string]: unknown;
}

class Logger {
  private context: LogContext = {};

  setContext(context: LogContext): void {
    this.context = { ...this.context, ...context };
  }

  clearContext(): void {
    this.context = {};
  }

  private log(level: LogLevel, message: string, data?: unknown): void {
    if (level < currentLogLevel) return;

    const logEntry = {
      timestamp: new Date().toISOString(),
      level: LogLevel[level],
      message,
      ...this.context,
      ...(data && { data }),
    };

    // Console output
    const consoleMethod = this.getConsoleMethod(level);
    consoleMethod(JSON.stringify(logEntry, null, 2));

    // Send to logging service (if configured)
    this.sendToService(logEntry);
  }

  private getConsoleMethod(level: LogLevel): typeof console.log {
    switch (level) {
      case LogLevel.DEBUG:
        return console.debug;
      case LogLevel.INFO:
        return console.info;
      case LogLevel.WARN:
        return console.warn;
      case LogLevel.ERROR:
        return console.error;
      default:
        return console.log;
    }
  }

  private sendToService(logEntry: unknown): void {
    // Send to logging service (e.g., Sentry, LogRocket)
    if (typeof window !== "undefined" && (window as any).logService) {
      (window as any).logService.log(logEntry);
    }
  }

  debug(message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, message, data);
  }

  info(message: string, data?: unknown): void {
    this.log(LogLevel.INFO, message, data);
  }

  warn(message: string, data?: unknown): void {
    this.log(LogLevel.WARN, message, data);
  }

  error(message: string, error?: Error | unknown, data?: unknown): void {
    const errorData = error instanceof Error
      ? {
          name: error.name,
          message: error.message,
          stack: error.stack,
        }
      : error;

    this.log(LogLevel.ERROR, message, {
      error: errorData,
      ...data,
    });
  }
}

export const logger = new Logger();
```

## Structured Logging

### 1. Usage Examples

```typescript
import { logger } from "@repo/utils";

// Simple log
logger.info("User logged in");

// With context
logger.setContext({ userId: "123", requestId: "req-456" });
logger.info("Processing request");

// With data
logger.info("API call completed", {
  endpoint: "/api/users",
  duration: 150,
  status: 200,
});

// Error logging
try {
  await riskyOperation();
} catch (error) {
  logger.error("Operation failed", error, {
    operation: "riskyOperation",
    userId: "123",
  });
}
```

### 2. React Hook for Logging

```tsx
// packages/hooks/src/useLogger.ts
import { useEffect, useRef } from "react";
import { logger } from "@repo/utils";

export function useLogger(componentName: string) {
  const loggerRef = useRef({
    debug: (message: string, data?: unknown) =>
      logger.debug(`[${componentName}] ${message}`, data),
    info: (message: string, data?: unknown) =>
      logger.info(`[${componentName}] ${message}`, data),
    warn: (message: string, data?: unknown) =>
      logger.warn(`[${componentName}] ${message}`, data),
    error: (message: string, error?: unknown, data?: unknown) =>
      logger.error(`[${componentName}] ${message}`, error, data),
  });

  useEffect(() => {
    loggerRef.current.info("Component mounted");
    return () => {
      loggerRef.current.info("Component unmounted");
    };
  }, []);

  return loggerRef.current;
}
```

### 3. Component Usage

```tsx
// apps/web/app/components/UserProfile.tsx
import { useLogger } from "@repo/hooks";

export function UserProfile({ userId }: { userId: string }) {
  const log = useLogger("UserProfile");

  useEffect(() => {
    log.info("Loading user profile", { userId });
    
    fetchUserProfile(userId)
      .then((data) => {
        log.info("User profile loaded", { userId, data });
      })
      .catch((error) => {
        log.error("Failed to load user profile", error, { userId });
      });
  }, [userId, log]);

  return <div>...</div>;
}
```

## Error Tracking

### 1. Error Boundary with Logging

```tsx
// apps/web/app/components/ErrorBoundary.tsx
import { Component, ReactNode } from "react";
import { logger } from "@repo/utils";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
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

  componentDidCatch(error: Error, errorInfo: unknown) {
    logger.error("React Error Boundary caught error", error, {
      errorInfo,
      componentStack: errorInfo,
    });
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div>
            <h1>Something went wrong</h1>
            {process.env.NODE_ENV === "development" && this.state.error && (
              <pre>{this.state.error.stack}</pre>
            )}
          </div>
        )
      );
    }

    return this.props.children;
  }
}
```

### 2. API Error Logging

```typescript
// packages/services/src/api.service.base.ts
import { logger } from "@repo/utils";

export class APIServiceBase {
  protected async request<T>(url: string, options: RequestInit = {}): Promise<T> {
    const startTime = Date.now();
    const requestId = crypto.randomUUID();

    logger.setContext({ requestId });

    try {
      logger.debug("API request started", {
        url,
        method: options.method || "GET",
      });

      const response = await fetch(url, options);
      const duration = Date.now() - startTime;

      if (!response.ok) {
        logger.warn("API request failed", {
          url,
          status: response.status,
          statusText: response.statusText,
          duration,
        });
      } else {
        logger.debug("API request completed", {
          url,
          status: response.status,
          duration,
        });
      }

      return response.json();
    } catch (error) {
      const duration = Date.now() - startTime;
      
      logger.error("API request error", error, {
        url,
        method: options.method || "GET",
        duration,
      });

      throw error;
    } finally {
      logger.clearContext();
    }
  }
}
```

## Performance Logging

### 1. Performance Hook

```tsx
// packages/hooks/src/usePerformance.ts
import { useEffect, useRef } from "react";
import { logger } from "@repo/utils";

export function usePerformance(componentName: string) {
  const renderStartRef = useRef<number>();

  useEffect(() => {
    renderStartRef.current = performance.now();

    return () => {
      const renderTime = performance.now() - (renderStartRef.current || 0);
      
      if (renderTime > 100) {
        logger.warn("Slow render detected", {
          component: componentName,
          renderTime: `${renderTime.toFixed(2)}ms`,
        });
      }
    };
  });

  const measure = (label: string) => {
    const start = performance.now();
    
    return () => {
      const duration = performance.now() - start;
      logger.debug("Performance measurement", {
        component: componentName,
        label,
        duration: `${duration.toFixed(2)}ms`,
      });
    };
  };

  return { measure };
}
```

### 2. Usage

```tsx
export function ExpensiveComponent() {
  const perf = usePerformance("ExpensiveComponent");
  const endMeasure = perf.measure("data-processing");

  useEffect(() => {
    processData();
    endMeasure();
  }, [endMeasure]);

  return <div>...</div>;
}
```

## Sensitive Data Filtering

### 1. Filter Sensitive Fields

```typescript
const SENSITIVE_FIELDS = [
  "password",
  "token",
  "secret",
  "apiKey",
  "authorization",
  "creditCard",
  "ssn",
];

function sanitizeData(data: unknown): unknown {
  if (typeof data !== "object" || data === null) {
    return data;
  }

  if (Array.isArray(data)) {
    return data.map(sanitizeData);
  }

  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_FIELDS.some((field) => key.toLowerCase().includes(field))) {
      sanitized[key] = "[REDACTED]";
    } else if (typeof value === "object") {
      sanitized[key] = sanitizeData(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// Use in logger
logger.info("User data", sanitizeData(userData));
```

## Best Practices

### ✅ Good Practices

- Use structured logging
- Include context (user ID, request ID)
- Set appropriate log levels
- Filter sensitive data
- Log errors with stack traces
- Use consistent log format
- Monitor log volume
- Set up log aggregation for production

### ❌ Anti-Patterns

- Don't log sensitive information
- Don't log in production (debug level)
- Don't use console.log directly
- Don't log large objects
- Don't ignore error logging
- Don't log user actions without context
- Don't skip performance logging for critical paths

## Related Rules

- Error Handling: `.cursor/skills/error-handling/SKILL.md`
- Security: `.cursor/rules/21-安全规范.mdc`
