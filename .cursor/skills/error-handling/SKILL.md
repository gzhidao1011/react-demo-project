---
name: error-handling
description: Handle errors effectively including try-catch blocks, error boundaries, error types, and user-friendly error messages. Use when handling errors, implementing error boundaries, or improving error handling patterns.
---

# Error Handling

Handle errors effectively following best practices and project standards.

## Quick Checklist

When handling errors:

- [ ] **Try-catch** blocks used for async operations
- [ ] **Error boundaries** implemented for React components
- [ ] **Error types** defined and used
- [ ] **User-friendly** error messages displayed
- [ ] **Error logging** implemented
- [ ] **Error recovery** strategies considered
- [ ] **Validation** prevents errors where possible

## Try-Catch Blocks

### 1. Basic Error Handling

```typescript
async function fetchData() {
  try {
    const response = await fetch("/api/data");
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Fetch error:", error);
    throw error; // Re-throw or handle appropriately
  }
}
```

### 2. Error Handling with Fallback

```typescript
async function fetchUser(id: string) {
  try {
    const user = await apiService.get(`/users/${id}`);
    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    // Return fallback or default value
    return null;
  }
}
```

### 3. Error Handling with Retry

```typescript
async function fetchWithRetry(
  url: string,
  retries = 3,
  delay = 1000
): Promise<Response> {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return response;
      }
      throw new Error(`HTTP ${response.status}`);
    } catch (error) {
      if (i === retries - 1) {
        throw error;
      }
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("Max retries exceeded");
}
```

## Error Types

### 1. Custom Error Classes

```typescript
// Define custom error types
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = "ValidationError";
  }
}

class NetworkError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NetworkError";
  }
}

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// Use custom errors
function validateEmail(email: string) {
  if (!email) {
    throw new ValidationError("邮箱不能为空", "email");
  }
  if (!email.includes("@")) {
    throw new ValidationError("邮箱格式无效", "email");
  }
}
```

### 2. Error Type Guards

```typescript
function isValidationError(error: unknown): error is ValidationError {
  return error instanceof ValidationError;
}

function isNetworkError(error: unknown): error is NetworkError {
  return error instanceof Error && error.name === "NetworkError";
}

// Use type guards
try {
  await processData();
} catch (error) {
  if (isValidationError(error)) {
    // Handle validation error
    setFieldError(error.field, error.message);
  } else if (isNetworkError(error)) {
    // Handle network error
    showNetworkError();
  } else {
    // Handle unknown error
    showGenericError();
  }
}
```

## React Error Boundaries

### 1. Error Boundary Component

```tsx
import { Component, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("Error caught by boundary:", error, errorInfo);
    // Log to error tracking service
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div>
          <h2>Something went wrong</h2>
          <p>{this.state.error?.message}</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

### 2. Using Error Boundaries

```tsx
function App() {
  return (
    <ErrorBoundary fallback={<ErrorFallback />}>
      <Dashboard />
    </ErrorBoundary>
  );
}
```

## API Error Handling

### 1. Unified Error Handling

```typescript
import { handleServerError } from "@repo/utils";
import toast from "react-hot-toast";

async function createUser(data: UserData) {
  try {
    const user = await apiService.post("/users", data);
    toast.success("用户创建成功");
    return user;
  } catch (error) {
    // Use unified error handler
    const result = handleServerError(error, setError, "创建用户失败");
    
    if (result.shouldShowToast && result.toastMessage) {
      toast.error(result.toastMessage);
    }
    
    throw error;
  }
}
```

### 2. Error Response Handling

```typescript
interface ApiErrorResponse {
  code: number;
  message: string;
  errors?: Array<{ field: string; message: string }>;
}

async function handleApiError(response: Response): Promise<never> {
  const errorData: ApiErrorResponse = await response.json();
  
  if (errorData.errors && errorData.errors.length > 0) {
    // Field-level errors
    throw new ValidationError(
      errorData.errors.map(e => e.message).join(", "),
      errorData.errors[0].field
    );
  }
  
  // General error
  throw new ApiError(
    errorData.message,
    response.status,
    errorData.code.toString()
  );
}
```

## Form Error Handling

### 1. Form Validation Errors

```typescript
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";

const schema = z.object({
  email: z.string().email("请输入有效的邮箱地址"),
});

function Form() {
  const { register, handleSubmit, formState: { errors }, setError } = useForm({
    resolver: zodResolver(schema),
  });
  
  const onSubmit = async (data: FormData) => {
    try {
      await submitForm(data);
    } catch (error) {
      // Handle server errors
      handleServerError(error, setError);
    }
  };
  
  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <input
        {...register("email")}
        aria-invalid={errors.email ? "true" : "false"}
        aria-describedby={errors.email ? "email-error" : undefined}
      />
      {errors.email && (
        <span id="email-error" role="alert">
          {errors.email.message}
        </span>
      )}
    </form>
  );
}
```

## Error Logging

### 1. Error Logging Service

```typescript
interface ErrorLog {
  message: string;
  stack?: string;
  context?: Record<string, unknown>;
  timestamp: Date;
}

function logError(error: Error, context?: Record<string, unknown>) {
  const errorLog: ErrorLog = {
    message: error.message,
    stack: error.stack,
    context,
    timestamp: new Date(),
  };
  
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.error("Error:", errorLog);
  }
  
  // Send to error tracking service in production
  if (process.env.NODE_ENV === "production") {
    // Send to Sentry, LogRocket, etc.
    // errorTrackingService.captureException(error, context);
  }
}
```

### 2. Global Error Handler

```typescript
// Global error handler for unhandled errors
window.addEventListener("error", (event) => {
  logError(event.error, {
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno,
  });
});

// Global promise rejection handler
window.addEventListener("unhandledrejection", (event) => {
  logError(event.reason, {
    type: "unhandledRejection",
  });
});
```

## User-Friendly Error Messages

### 1. Error Message Mapping

```typescript
const ERROR_MESSAGES: Record<string, string> = {
  NETWORK_ERROR: "网络连接失败，请检查网络设置",
  TIMEOUT_ERROR: "请求超时，请稍后重试",
  SERVER_ERROR: "服务器错误，请稍后重试",
  VALIDATION_ERROR: "输入数据无效，请检查后重试",
};

function getUserFriendlyMessage(error: Error): string {
  if (error instanceof NetworkError) {
    return ERROR_MESSAGES.NETWORK_ERROR;
  }
  if (error instanceof ApiError) {
    return ERROR_MESSAGES.SERVER_ERROR;
  }
  return error.message || "发生未知错误，请稍后重试";
}
```

### 2. Error Display Components

```tsx
function ErrorDisplay({ error }: { error: Error }) {
  const message = getUserFriendlyMessage(error);
  
  return (
    <div role="alert" className="error-container">
      <p>{message}</p>
      {process.env.NODE_ENV === "development" && (
        <details>
          <summary>Technical Details</summary>
          <pre>{error.stack}</pre>
        </details>
      )}
    </div>
  );
}
```

## Best Practices

### ✅ Good Practices

- Use try-catch for async operations
- Implement error boundaries for React components
- Define custom error types
- Provide user-friendly error messages
- Log errors for debugging
- Handle errors at appropriate levels
- Validate input to prevent errors
- Provide error recovery options

### ❌ Anti-Patterns

- Don't ignore errors silently
- Don't expose technical details to users
- Don't catch errors without handling them
- Don't forget to log errors
- Don't use generic error messages
- Don't catch errors too broadly
- Don't forget error boundaries

## Related Rules

- Form Error Handling: `.cursor/rules/10-表单错误处理.mdc`
- Bug Fixing: `.cursor/skills/bug-fixing/SKILL.md`
- API Development: `.cursor/skills/api-development/SKILL.md`
