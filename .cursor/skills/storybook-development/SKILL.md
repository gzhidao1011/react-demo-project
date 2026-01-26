---
name: storybook-development
description: Create Storybook stories following project standards. Use when creating component stories, documenting components, or working with Storybook.
---

# Storybook Development

Create Storybook stories following project standards: CSF format with Meta + StoryObj.

## Quick Start

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@repo/ui";

const ButtonPlayground = () => {
  return <Button type="button">Click me</Button>;
};

const meta: Meta<typeof ButtonPlayground> = {
  title: "ui/button", // Package name / component name
  component: ButtonPlayground,
};

export default meta;

type Story = StoryObj<typeof ButtonPlayground>;

export const Basic: Story = {};
```

## Story Structure

### Standard Story Format (CSF)

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Component } from "@repo/ui";

// Playground component (wrapper for the actual component)
const ComponentPlayground = () => {
  return <Component prop1="value1" prop2="value2" />;
};

// Meta configuration
const meta: Meta<typeof ComponentPlayground> = {
  title: "package-name/component-name", // Format: package/component
  component: ComponentPlayground,
  tags: ["autodocs"], // Enable autodocs (default in project)
};

export default meta;

// Story type
type Story = StoryObj<typeof ComponentPlayground>;

// Stories
export const Basic: Story = {};

export const WithProps: Story = {
  args: {
    prop1: "custom value",
    prop2: "another value",
  },
};
```

## Title Naming Convention

### Format: `package-name/component-name`

```tsx
// ✅ Correct: Package name as first level
title: "ui/button"        // ui package, button component
title: "propel/toast"     // propel package, toast component

// ❌ Wrong: Don't use src/ or implementation paths
title: "src/ui/button"    // Don't use src/
title: "packages/ui/button" // Don't use packages/
```

### Package Names

- `ui` - Base UI components (`packages/ui`)
- `propel` - Enhanced/wrapper components (`packages/propel`)

## Story File Location

Stories should be placed next to the component:

```
packages/
  ├── ui/src/
  │   └── button/
  │       ├── button.tsx
  │       └── button.stories.tsx  ✅ Next to component
  └── propel/src/
      └── toast/
          ├── toast.tsx
          └── toast.stories.tsx    ✅ Next to component
```

## Story Examples

### Basic Story

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@repo/ui";

const ButtonPlayground = () => {
  return <Button type="button">Click me</Button>;
};

const meta: Meta<typeof ButtonPlayground> = {
  title: "ui/button",
  component: ButtonPlayground,
};

export default meta;

type Story = StoryObj<typeof ButtonPlayground>;

export const Basic: Story = {};
```

### Story with Variants

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { Button } from "@repo/ui";

const ButtonPlayground = ({ variant, size, children }: ButtonProps) => {
  return (
    <Button variant={variant} size={size}>
      {children}
    </Button>
  );
};

const meta: Meta<typeof ButtonPlayground> = {
  title: "ui/button",
  component: ButtonPlayground,
};

export default meta;

type Story = StoryObj<typeof ButtonPlayground>;

export const Default: Story = {
  args: {
    variant: "default",
    size: "md",
    children: "Button",
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    size: "md",
    children: "Outline Button",
  },
};

export const Small: Story = {
  args: {
    variant: "default",
    size: "sm",
    children: "Small Button",
  },
};
```

### Interactive Story

```tsx
import type { Meta, StoryObj } from "@storybook/react";
import { useState } from "react";
import { Button } from "@repo/ui";

const CounterPlayground = () => {
  const [count, setCount] = useState(0);
  
  return (
    <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
      <Button onClick={() => setCount(count - 1)}>-</Button>
      <span>{count}</span>
      <Button onClick={() => setCount(count + 1)}>+</Button>
    </div>
  );
};

const meta: Meta<typeof CounterPlayground> = {
  title: "ui/counter",
  component: CounterPlayground,
};

export default meta;

type Story = StoryObj<typeof CounterPlayground>;

export const Interactive: Story = {};
```

## Theme Support

Storybook automatically includes theme styles via `preview.ts`:

```tsx
// ✅ Components automatically have theme support
// No need to manually import styles in stories

const ButtonPlayground = () => {
  return <Button>Theme-aware button</Button>;
};
```

## Autodocs

Autodocs is enabled globally. To disable for specific stories:

```tsx
const meta: Meta<typeof ComponentPlayground> = {
  title: "ui/component",
  component: ComponentPlayground,
  tags: ["!autodocs"], // Disable autodocs for this component
};

// Or disable for specific story
export const Experimental: Story = {
  tags: ["!autodocs"],
};
```

## Best Practices

### ✅ Good Practices

- Use `package-name/component-name` format for titles
- Place stories next to components
- Use Playground components for complex setups
- Provide multiple variants/states
- Use TypeScript types
- Enable autodocs (default)

### ❌ Anti-Patterns

- Don't use `src/` or implementation paths in titles
- Don't place stories in separate `stories/` directory
- Don't disable autodocs unless necessary
- Don't use `any` types
- Don't hardcode theme values (use CSS variables)

## Running Storybook

### Development Mode

```bash
pnpm -C apps/storybook storybook
```

### Build Static Site

```bash
pnpm -C apps/storybook build-storybook
```

### From Root (Recommended)

```bash
pnpm build:storybook
```

## Common Patterns

### Component with Props

```tsx
interface CardProps {
  title: string;
  description?: string;
  children: React.ReactNode;
}

const CardPlayground = ({ title, description, children }: CardProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        {description && <p>{description}</p>}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
};

const meta: Meta<typeof CardPlayground> = {
  title: "ui/card",
  component: CardPlayground,
};

export default meta;

type Story = StoryObj<typeof CardPlayground>;

export const Basic: Story = {
  args: {
    title: "Card Title",
    description: "Card description",
    children: "Card content",
  },
};
```

### Multiple States

```tsx
export const Default: Story = {
  args: {
    variant: "default",
  },
};

export const Loading: Story = {
  args: {
    loading: true,
  },
};

export const Disabled: Story = {
  args: {
    disabled: true,
  },
};

export const Error: Story = {
  args: {
    error: "Error message",
  },
};
```

## Related Rules

- Storybook Usage: `.cursor/rules/14-Storybook使用规范.mdc`
- Component Development: `.cursor/skills/component-development/SKILL.md`
- Design System: `.cursor/rules/07-设计系统.mdc`
