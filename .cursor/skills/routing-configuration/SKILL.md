---
name: routing-configuration
description: Configure routing including React Router setup, route definitions, nested routes, and route guards. Use when setting up routing, defining routes, or configuring navigation.
---

# Routing Configuration

Configure routing following React Router best practices and project standards.

## Quick Checklist

When configuring routing:

- [ ] **Routes** defined clearly
- [ ] **Route guards** implemented (if needed)
- [ ] **Nested routes** configured properly
- [ ] **404 page** handled
- [ ] **Route parameters** typed correctly
- [ ] **Navigation** works correctly
- [ ] **Code splitting** implemented

## React Router Setup

### 1. Basic Router Configuration

```tsx
// apps/web/app/root.tsx
import { createBrowserRouter, RouterProvider } from "react-router";

const router = createBrowserRouter([
  {
    path: "/",
    element: <RootLayout />,
    children: [
      {
        index: true,
        element: <HomePage />,
      },
      {
        path: "about",
        element: <AboutPage />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}
```

### 2. Route Configuration File

```typescript
// apps/web/app/routes.ts
import type { RouteConfig } from "@react-router/dev/routes";

export default [
  {
    path: "/",
    file: "routes/home.tsx",
  },
  {
    path: "/about",
    file: "routes/about.tsx",
  },
  {
    path: "/users/:id",
    file: "routes/user-detail.tsx",
  },
] satisfies RouteConfig;
```

## Route Definitions

### 1. Basic Routes

```tsx
// apps/web/app/routes/home.tsx
export default function HomePage() {
  return <div>Home Page</div>;
}
```

### 2. Routes with Parameters

```tsx
// apps/web/app/routes/user-detail.tsx
import { useParams } from "react-router";

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  
  return <div>User ID: {id}</div>;
}
```

### 3. Routes with Loaders

```tsx
// apps/web/app/routes/user-detail.tsx
import { useLoaderData } from "react-router";
import type { LoaderFunctionArgs } from "react-router";

export async function loader({ params }: LoaderFunctionArgs) {
  const { id } = params;
  const user = await fetchUser(id!);
  return { user };
}

export default function UserDetailPage() {
  const { user } = useLoaderData<typeof loader>();
  
  return <div>{user.name}</div>;
}
```

### 4. Routes with Actions

```tsx
// apps/web/app/routes/user-edit.tsx
import { useActionData, Form } from "react-router";
import type { ActionFunctionArgs } from "react-router";

export async function action({ request, params }: ActionFunctionArgs) {
  const formData = await request.formData();
  const { id } = params;
  
  const result = await updateUser(id!, {
    name: formData.get("name") as string,
  });
  
  if (result.error) {
    return { error: result.error };
  }
  
  return { success: true };
}

export default function UserEditPage() {
  const actionData = useActionData<typeof action>();
  
  return (
    <Form method="post">
      <input name="name" />
      {actionData?.error && <div>{actionData.error}</div>}
      <button type="submit">Save</button>
    </Form>
  );
}
```

## Nested Routes

### 1. Layout Routes

```tsx
// apps/web/app/routes/dashboard.tsx
import { Outlet } from "react-router";

export default function DashboardLayout() {
  return (
    <div>
      <nav>Dashboard Navigation</nav>
      <Outlet /> {/* Child routes render here */}
    </div>
  );
}
```

### 2. Nested Route Configuration

```typescript
// apps/web/app/routes.ts
export default [
  {
    path: "/dashboard",
    file: "routes/dashboard.tsx",
    children: [
      {
        index: true,
        file: "routes/dashboard/index.tsx",
      },
      {
        path: "settings",
        file: "routes/dashboard/settings.tsx",
      },
    ],
  },
] satisfies RouteConfig;
```

## Route Guards

### 1. Protected Routes

```tsx
// apps/web/app/routes/protected.tsx
import { Navigate } from "react-router";
import { useAuth } from "@/hooks/useAuth";

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
}
```

### 2. Route Guard Usage

```typescript
// apps/web/app/routes.ts
export default [
  {
    path: "/dashboard",
    file: "routes/protected.tsx",
    children: [
      {
        path: "",
        file: "routes/dashboard.tsx",
      },
    ],
  },
] satisfies RouteConfig;
```

## Error Handling

### 1. Error Boundaries

```tsx
// apps/web/app/routes/user-detail.tsx
import { useRouteError, isRouteErrorResponse } from "react-router";

export function ErrorBoundary() {
  const error = useRouteError();
  
  if (isRouteErrorResponse(error)) {
    return (
      <div>
        <h1>{error.status}</h1>
        <p>{error.statusText}</p>
      </div>
    );
  }
  
  return <div>Something went wrong</div>;
}
```

### 2. 404 Page

```tsx
// apps/web/app/not-found.tsx
import { Link } from "react-router";

export default function NotFoundPage() {
  return (
    <div>
      <h1>404 - Page Not Found</h1>
      <Link to="/">Go Home</Link>
    </div>
  );
}
```

## Navigation

### 1. Programmatic Navigation

```tsx
import { useNavigate } from "react-router";

function Component() {
  const navigate = useNavigate();
  
  const handleClick = () => {
    navigate("/users/123");
  };
  
  return <button onClick={handleClick}>Go to User</button>;
}
```

### 2. Link Navigation

```tsx
import { Link } from "react-router";

function Navigation() {
  return (
    <nav>
      <Link to="/">Home</Link>
      <Link to="/about">About</Link>
      <Link to="/users/123">User 123</Link>
    </nav>
  );
}
```

## Code Splitting

### 1. Lazy Loading Routes

```tsx
import { lazy } from "react";

const DashboardPage = lazy(() => import("./routes/dashboard.tsx"));
const SettingsPage = lazy(() => import("./routes/settings.tsx"));
```

### 2. Route-Based Code Splitting

```typescript
// React Router automatically code-splits by route
// Each route file is loaded on demand
export default [
  {
    path: "/dashboard",
    file: "routes/dashboard.tsx", // Loaded when route is accessed
  },
] satisfies RouteConfig;
```

## Best Practices

### ✅ Good Practices

- Define routes clearly
- Use typed route parameters
- Implement route guards for protected routes
- Handle 404 and error cases
- Use code splitting for large routes
- Keep route configuration organized
- Use loaders for data fetching
- Use actions for mutations

### ❌ Anti-Patterns

- Don't hardcode routes
- Don't skip error handling
- Don't forget route guards
- Don't load all routes upfront
- Don't ignore route parameters types
- Don't mix navigation methods unnecessarily

## Related Rules

- Code Organization: `.cursor/rules/05-代码组织.mdc`
- API Development: `.cursor/skills/api-development/SKILL.md`
- Component Development: `.cursor/skills/component-development/SKILL.md`
