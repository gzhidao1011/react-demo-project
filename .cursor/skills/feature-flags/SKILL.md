---
name: feature-flags
description: Implement feature flags including feature toggles, A/B testing, and gradual rollouts. Use when implementing feature flags or managing feature releases.
---

# Feature Flags

Implement feature flags for gradual rollouts.

## Quick Checklist

When implementing feature flags:

- [ ] **Feature flag** system selected
- [ ] **Flags** configured
- [ ] **Toggle logic** implemented
- [ ] **A/B testing** set up (if needed)
- [ ] **Monitoring** configured

## Feature Flag Implementation

### 1. Simple Feature Flag

```typescript
// packages/utils/src/feature-flags.ts
interface FeatureFlags {
  [key: string]: boolean | { enabled: boolean; percentage?: number };
}

const flags: FeatureFlags = {
  newFeature: true,
  experimentalFeature: { enabled: true, percentage: 10 },
};

export function isFeatureEnabled(flag: string, userId?: string): boolean {
  const config = flags[flag];
  
  if (!config) return false;
  
  if (typeof config === "boolean") {
    return config;
  }
  
  if (config.enabled && config.percentage) {
    if (!userId) return false;
    const hash = hashUserId(userId);
    return hash % 100 < config.percentage;
  }
  
  return config.enabled;
}
```

## Best Practices

### ✅ Good Practices

- Use feature flags for new features
- Support gradual rollouts
- Monitor flag usage
- Clean up old flags
- Document flag purpose

### ❌ Anti-Patterns

- Don't keep flags forever
- Don't skip monitoring
- Don't use flags for config

## Related Rules

- Component Development: `.cursor/skills/component-development/SKILL.md`
