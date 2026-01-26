---
name: state-management
description: Manage application state effectively using React hooks, context, and state management patterns. Use when managing component state, sharing state between components, or implementing state management solutions.
---

# State Management

Manage application state following React best practices and project standards.

## Quick Checklist

When managing state:

- [ ] **Local state** used for component-specific data
- [ ] **Context** used for shared state (when appropriate)
- [ ] **State lifted** to common ancestor when needed
- [ ] **State updates** are immutable
- [ ] **Side effects** handled in useEffect
- [ ] **State structure** is clear and organized

## Local State (useState)

### 1. Basic State Management

```tsx
import { useState } from "react";

function Counter() {
  const [count, setCount] = useState(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>Increment</button>
    </div>
  );
}
```

### 2. State with Initializer Function

```tsx
// ✅ Good: Use function for expensive initialization
const [data, setData] = useState(() => {
  return expensiveComputation();
});

// ❌ Bad: Expensive computation on every render
const [data, setData] = useState(expensiveComputation());
```

### 3. Updating State Based on Previous State

```tsx
// ✅ Good: Use functional update
const [count, setCount] = useState(0);

const increment = () => {
  setCount(prev => prev + 1);
};

// ❌ Bad: May use stale state
const increment = () => {
  setCount(count + 1); // May be stale in async scenarios
};
```

### 4. Object State Updates

```tsx
// ✅ Good: Spread previous state
const [user, setUser] = useState({ name: "", email: "" });

const updateName = (name: string) => {
  setUser(prev => ({ ...prev, name }));
};

// ❌ Bad: Mutating state directly
const updateName = (name: string) => {
  user.name = name; // Mutation!
  setUser(user);
};
```

## Custom Hooks for State Logic

### 1. Extract State Logic

```tsx
// ✅ Good: Extract to custom hook
function useCounter(initialValue = 0) {
  const [count, setCount] = useState(initialValue);
  
  const increment = () => setCount(prev => prev + 1);
  const decrement = () => setCount(prev => prev - 1);
  const reset = () => setCount(initialValue);
  
  return { count, increment, decrement, reset };
}

// Use in component
function Counter() {
  const { count, increment, decrement, reset } = useCounter(0);
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
      <button onClick={reset}>Reset</button>
    </div>
  );
}
```

### 2. Async State Management

```tsx
function useAsyncData<T>(fetchFn: () => Promise<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  
  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await fetchFn();
      setData(result);
    } catch (err) {
      setError(err as Error);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => {
    fetchData();
  }, []);
  
  return { data, loading, error, refetch: fetchData };
}
```

## Context API

### 1. Creating Context

```tsx
import { createContext, useContext, useState, ReactNode } from "react";

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  
  const login = (userData: User) => {
    setUser(userData);
  };
  
  const logout = () => {
    setUser(null);
  };
  
  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
```

### 2. Using Context

```tsx
function App() {
  return (
    <AuthProvider>
      <Dashboard />
    </AuthProvider>
  );
}

function Dashboard() {
  const { user, logout } = useAuth();
  
  return (
    <div>
      <p>Welcome, {user?.name}</p>
      <button onClick={logout}>Logout</button>
    </div>
  );
}
```

## State Lifting

### 1. Lift State Up

```tsx
// ❌ Bad: State in child component
function Child() {
  const [value, setValue] = useState("");
  return <input value={value} onChange={e => setValue(e.target.value)} />;
}

// ✅ Good: Lift state to parent
function Parent() {
  const [value, setValue] = useState("");
  return (
    <div>
      <Child value={value} onChange={setValue} />
      <Sibling value={value} />
    </div>
  );
}
```

## State Management Patterns

### 1. Reducer Pattern (useReducer)

```tsx
import { useReducer } from "react";

type State = {
  count: number;
  step: number;
};

type Action =
  | { type: "increment" }
  | { type: "decrement" }
  | { type: "reset" }
  | { type: "setStep"; payload: number };

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "increment":
      return { ...state, count: state.count + state.step };
    case "decrement":
      return { ...state, count: state.count - state.step };
    case "reset":
      return { ...state, count: 0 };
    case "setStep":
      return { ...state, step: action.payload };
    default:
      return state;
  }
}

function Counter() {
  const [state, dispatch] = useReducer(reducer, { count: 0, step: 1 });
  
  return (
    <div>
      <p>Count: {state.count}</p>
      <button onClick={() => dispatch({ type: "increment" })}>+</button>
      <button onClick={() => dispatch({ type: "decrement" })}>-</button>
      <button onClick={() => dispatch({ type: "reset" })}>Reset</button>
    </div>
  );
}
```

### 2. Derived State

```tsx
import { useMemo } from "react";

function UserList({ users }: { users: User[] }) {
  // ✅ Good: Use useMemo for derived state
  const activeUsers = useMemo(
    () => users.filter(user => user.isActive),
    [users]
  );
  
  return <div>{/* Render activeUsers */}</div>;
}
```

## Best Practices

### ✅ Good Practices

- Use local state for component-specific data
- Lift state up when multiple components need it
- Use Context for shared state across component tree
- Keep state updates immutable
- Use useReducer for complex state logic
- Extract state logic to custom hooks
- Use useMemo for expensive computations
- Clean up side effects in useEffect

### ❌ Anti-Patterns

- Don't mutate state directly
- Don't use global state for local data
- Don't put all state in Context
- Don't forget to clean up effects
- Don't create state for derived values
- Don't use useState for async operations without proper handling

## Common Patterns

### 1. Form State

```tsx
function useForm<T>(initialValues: T) {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  
  const setValue = <K extends keyof T>(key: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [key]: value }));
  };
  
  const setError = <K extends keyof T>(key: K, error: string) => {
    setErrors(prev => ({ ...prev, [key]: error }));
  };
  
  return { values, errors, setValue, setError };
}
```

### 2. Toggle State

```tsx
function useToggle(initialValue = false) {
  const [value, setValue] = useState(initialValue);
  
  const toggle = () => setValue(prev => !prev);
  const setTrue = () => setValue(true);
  const setFalse = () => setValue(false);
  
  return [value, { toggle, setTrue, setFalse }] as const;
}
```

## Related Rules

- Code Organization: `.cursor/rules/05-代码组织.mdc`
- Component Development: `.cursor/skills/component-development/SKILL.md`
- Code Refactoring: `.cursor/skills/code-refactoring/SKILL.md`
