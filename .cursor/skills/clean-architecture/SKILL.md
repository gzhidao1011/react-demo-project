---
name: clean-architecture
description: Implement clean architecture including layered architecture, dependency inversion, and separation of concerns. Use when structuring applications or implementing clean architecture.
---

# Clean Architecture

Implement clean architecture.

## Quick Checklist

When implementing clean architecture:

- [ ] **Layers** defined
- [ ] **Dependencies** inverted
- [ ] **Domain** isolated
- [ ] **Interfaces** defined
- [ ] **Testing** supported

## Architecture Layers

### 1. Layer Structure

```
domain/
  ├── entities/
  ├── repositories/
  └── services/

application/
  ├── use-cases/
  └── interfaces/

infrastructure/
  ├── repositories/
  └── external/

presentation/
  ├── controllers/
  └── views/
```

## Best Practices

### ✅ Good Practices

- Separate concerns
- Invert dependencies
- Isolate domain
- Use interfaces
- Test each layer

### ❌ Anti-Patterns

- Don't mix layers
- Don't skip interfaces
- Don't ignore domain

## Related Rules

- Code Organization: `.cursor/rules/05-代码组织.mdc`
