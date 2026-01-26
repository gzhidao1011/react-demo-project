---
name: accessibility-audit
description: Perform accessibility audits including ARIA attributes, keyboard navigation, screen reader support, and WCAG compliance. Use when auditing accessibility or fixing a11y issues.
---

# Accessibility Audit

Perform accessibility audits and fix accessibility issues.

## Quick Checklist

When auditing accessibility:

- [ ] **ARIA attributes** checked
- [ ] **Keyboard navigation** tested
- [ ] **Screen reader** compatibility verified
- [ ] **Color contrast** checked
- [ ] **Focus management** reviewed
- [ ] **Semantic HTML** used
- [ ] **WCAG compliance** verified

## Automated Testing

### 1. Install Testing Tools

```bash
pnpm add -D @axe-core/react jest-axe @testing-library/jest-dom
```

### 2. Accessibility Test Setup

```typescript
// packages/utils/src/test-utils.tsx
import { axe, toHaveNoViolations } from "jest-axe";
import { render } from "@testing-library/react";

expect.extend(toHaveNoViolations);

export async function testAccessibility(component: React.ReactElement) {
  const { container } = render(component);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
}
```

### 3. Component Test

```typescript
// apps/web/app/components/Button.test.tsx
import { testAccessibility } from "@repo/utils";
import { Button } from "./Button";

describe("Button Accessibility", () => {
  it("should have no accessibility violations", async () => {
    await testAccessibility(<Button>Click me</Button>);
  });
});
```

## Manual Checklist

### 1. ARIA Attributes

```tsx
// ✅ Good
<button aria-label="Close dialog" onClick={handleClose}>
  <CloseIcon />
</button>

// ✅ Good
<div role="alert" aria-live="polite">
  {message}
</div>

// ❌ Bad
<div onClick={handleClick}>Click me</div>
```

### 2. Keyboard Navigation

```tsx
// ✅ Good - Keyboard accessible
<button
  onKeyDown={(e) => {
    if (e.key === "Enter" || e.key === " ") {
      handleClick();
    }
  }}
>
  Click me
</button>

// ✅ Good - Focus management
useEffect(() => {
  if (isOpen) {
    dialogRef.current?.focus();
  }
}, [isOpen]);
```

### 3. Color Contrast

```tsx
// ✅ Good - Sufficient contrast
<div className="text-gray-900 bg-white">Text</div>

// ❌ Bad - Low contrast
<div className="text-gray-400 bg-gray-300">Text</div>
```

## Accessibility Hook

### 1. useFocusTrap Hook

```tsx
// packages/hooks/src/useFocusTrap.ts
import { useEffect, useRef } from "react";

export function useFocusTrap(isActive: boolean) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleTab = (e: KeyboardEvent) => {
      if (e.key !== "Tab") return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          lastElement.focus();
          e.preventDefault();
        }
      } else {
        if (document.activeElement === lastElement) {
          firstElement.focus();
          e.preventDefault();
        }
      }
    };

    container.addEventListener("keydown", handleTab);
    firstElement?.focus();

    return () => {
      container.removeEventListener("keydown", handleTab);
    };
  }, [isActive]);

  return containerRef;
}
```

### 2. Usage

```tsx
export function Modal({ isOpen, onClose }: ModalProps) {
  const containerRef = useFocusTrap(isOpen);

  if (!isOpen) return null;

  return (
    <div ref={containerRef} role="dialog" aria-modal="true">
      {/* Modal content */}
    </div>
  );
}
```

## Best Practices

### ✅ Good Practices

- Use semantic HTML
- Add ARIA labels where needed
- Ensure keyboard navigation
- Test with screen readers
- Check color contrast
- Manage focus properly
- Provide skip links

### ❌ Anti-Patterns

- Don't use divs for buttons
- Don't skip ARIA attributes
- Don't ignore keyboard users
- Don't use low contrast colors
- Don't trap focus incorrectly

## Related Rules

- Accessibility Improvement: `.cursor/skills/accessibility-improvement/SKILL.md`
