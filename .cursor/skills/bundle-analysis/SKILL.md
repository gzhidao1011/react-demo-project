---
name: bundle-analysis
description: Analyze bundle size, identify large dependencies, and optimize bundle composition. Use when optimizing bundle size or analyzing build output.
---

# Bundle Analysis

Analyze and optimize bundle size.

## Quick Checklist

When analyzing bundles:

- [ ] **Bundle analyzer** configured
- [ ] **Build output** analyzed
- [ ] **Large dependencies** identified
- [ ] **Code splitting** opportunities found
- [ ] **Tree shaking** verified
- [ ] **Optimization** applied

## Bundle Analyzer Setup

### 1. Install Analyzer

```bash
pnpm add -D rollup-plugin-visualizer
```

### 2. Vite Configuration

```typescript
// vite.config.ts
import { visualizer } from "rollup-plugin-visualizer";

export default defineConfig({
  plugins: [
    // ... other plugins
    visualizer({
      open: true,
      filename: "dist/stats.html",
    }),
  ],
});
```

## Bundle Analysis

### 1. Analyze Command

```json
// package.json
{
  "scripts": {
    "analyze": "vite build --mode production && npx vite-bundle-visualizer"
  }
}
```

## Best Practices

### ✅ Good Practices

- Regular bundle analysis
- Identify large dependencies
- Use code splitting
- Enable tree shaking
- Remove unused code
- Optimize images

### ❌ Anti-Patterns

- Don't ignore bundle size
- Don't skip analysis
- Don't bundle everything
- Don't forget tree shaking

## Related Rules

- Performance Optimization: `.cursor/skills/performance-optimization/SKILL.md`
