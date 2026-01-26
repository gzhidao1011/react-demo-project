---
name: design-patterns
description: Apply design patterns including creational, structural, and behavioral patterns. Use when applying design patterns or solving common design problems.
---

# Design Patterns

Apply design patterns effectively.

## Quick Checklist

When applying patterns:

- [ ] **Pattern** identified
- [ ] **Pattern** appropriate for problem
- [ ] **Implementation** follows pattern
- [ ] **Documentation** added
- [ ] **Testing** included

## Common Patterns

### 1. Repository Pattern

```typescript
interface Repository<T> {
  findById(id: string): Promise<T | null>;
  findAll(): Promise<T[]>;
  save(entity: T): Promise<T>;
  delete(id: string): Promise<void>;
}

class UserRepository implements Repository<User> {
  // Implementation
}
```

## Best Practices

### ✅ Good Practices

- Use appropriate patterns
- Don't over-engineer
- Document pattern usage
- Test implementations
- Refactor when needed

### ❌ Anti-Patterns

- Don't force patterns
- Don't over-complicate
- Don't skip documentation

## Related Rules

- Code Refactoring: `.cursor/skills/code-refactoring/SKILL.md`
