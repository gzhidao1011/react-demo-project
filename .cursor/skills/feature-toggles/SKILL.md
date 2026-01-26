---
name: feature-toggles
description: Implement feature toggles including feature flags, A/B testing, and gradual rollouts. Use when implementing feature toggles or managing feature releases.
---

# Feature Toggles

Implement feature toggles.

## Quick Checklist

When implementing toggles:

- [ ] **Toggle** system selected
- [ ] **Toggles** configured
- [ ] **Evaluation** logic implemented
- [ ] **Monitoring** configured
- [ ] **Cleanup** planned

## Feature Toggle Implementation

### 1. Toggle System

```typescript
interface FeatureToggle {
  name: string;
  enabled: boolean;
  percentage?: number;
  users?: string[];
}

class FeatureToggleService {
  isEnabled(toggle: FeatureToggle, userId?: string): boolean {
    if (!toggle.enabled) return false;
    
    if (toggle.percentage) {
      const hash = hashUserId(userId || "");
      return hash % 100 < toggle.percentage;
    }
    
    if (toggle.users) {
      return toggle.users.includes(userId || "");
    }
    
    return true;
  }
}
```

## Best Practices

### ✅ Good Practices

- Use for new features
- Support gradual rollout
- Monitor usage
- Clean up old toggles
- Document purpose

### ❌ Anti-Patterns

- Don't keep forever
- Don't skip monitoring
- Don't use for config

## Related Rules

- Feature Flags: `.cursor/skills/feature-flags/SKILL.md`
