---
name: component-development
description: Create React components following project standards including styling, theming, and component library usage. Use when creating new components, styling components, or working with the component library.
---

# Component Development

Create React components following project standards.

## Component Structure

```tsx
import { cn } from "@repo/ui";
import { Button } from "@repo/ui";

interface ComponentProps {
  className?: string;
  children: React.ReactNode;
}

export function Component({ className, children }: ComponentProps) {
  return (
    <div className={cn("base-styles", className)}>
      {children}
    </div>
  );
}
```

## Styling Guidelines

### Use Tailwind CSS

```tsx
// ✅ Good
<div className="flex items-center gap-2 p-4 bg-[var(--color-bg-card)]">

// ❌ Bad
<div className="custom-wrapper">
```

### Use CSS Variables for Theming

```tsx
// ✅ Good - Supports dark mode
<div className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)]">

// ❌ Bad - Hardcoded colors
<div className="bg-white text-gray-900">
```

### Use Component Library

```tsx
// ✅ Good - Use project components
import { Button, Card, Input } from "@repo/ui";

// ❌ Bad - Don't use external libraries directly
import { Button } from "antd";
```

## Component Library Usage

### Button

```tsx
import { Button } from "@repo/ui";

<Button variant="default" size="lg">
  提交
</Button>

<Button variant="outline" size="sm">
  取消
</Button>
```

### Card

```tsx
import { Card, CardHeader, CardTitle, CardContent } from "@repo/ui";

<Card>
  <CardHeader>
    <CardTitle>标题</CardTitle>
  </CardHeader>
  <CardContent>
    内容
  </CardContent>
</Card>
```

### Input

```tsx
import { Input } from "@repo/ui";

<Input
  type="email"
  placeholder="请输入邮箱"
  className={errors.email ? "border-red-500" : ""}
/>
```

## Theme Support

All components must support dark mode:

```tsx
// Use CSS variables
<div className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)]">

// Or use Tailwind dark: prefix
<div className="bg-white dark:bg-gray-900">
```

## Component Organization

Follow FSD architecture:

```
components/
  ├── ui/              # Base UI components
  ├── features/        # Feature-specific components
  └── widgets/         # Complex composite components
```

## Best Practices

### ✅ Good Practices

- Use TypeScript for props
- Support className prop
- Use CSS variables for theming
- Support dark mode
- Use project component library
- Keep components focused (single responsibility)

### ❌ Anti-Patterns

- Hardcoded colors
- No dark mode support
- Using external UI libraries directly
- Components doing too much
- Missing TypeScript types

## Related Rules

- Design System: `.cursor/rules/07-设计系统.mdc`
- Component Library: `.cursor/rules/11-组件库与主题系统.mdc`
- Code Organization: `.cursor/rules/05-代码组织.mdc`
