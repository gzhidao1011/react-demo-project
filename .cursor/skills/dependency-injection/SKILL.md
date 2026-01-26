---
name: dependency-injection
description: Implement dependency injection including DI containers, service registration, and dependency resolution. Use when implementing DI or managing dependencies.
---

# Dependency Injection

Implement dependency injection.

## Quick Checklist

When implementing DI:

- [ ] **DI container** selected
- [ ] **Services** registered
- [ ] **Dependencies** resolved
- [ ] **Lifetime** managed
- [ ] **Testing** supported

## Dependency Injection

### 1. Service Registration

```typescript
// Register services
container.register("userService", UserService);
container.register("authService", AuthService);

// Resolve dependencies
const userService = container.resolve<UserService>("userService");
```

## Best Practices

### ✅ Good Practices

- Use DI container
- Register all services
- Manage lifetimes
- Support testing
- Avoid service locator

### ❌ Anti-Patterns

- Don't use service locator
- Don't skip registration
- Don't ignore lifetimes

## Related Rules

- Code Organization: `.cursor/rules/05-代码组织.mdc`
