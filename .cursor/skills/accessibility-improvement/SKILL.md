---
name: accessibility-improvement
description: Improve accessibility including ARIA attributes, keyboard navigation, screen reader support, and WCAG compliance. Use when improving accessibility, fixing a11y issues, or ensuring WCAG compliance.
---

# Accessibility Improvement

Improve accessibility following WCAG 2.1 guidelines and best practices.

## Quick Checklist

When improving accessibility:

- [ ] **ARIA attributes** properly used
- [ ] **Keyboard navigation** works for all interactive elements
- [ ] **Screen reader** support tested
- [ ] **Color contrast** meets WCAG AA standards
- [ ] **Focus indicators** visible
- [ ] **Semantic HTML** used correctly
- [ ] **Alt text** provided for images
- [ ] **Form labels** properly associated

## ARIA Attributes

### 1. Basic ARIA Usage

```tsx
// ✅ Good: Proper ARIA attributes
<button
  aria-label="关闭对话框"
  aria-expanded={isOpen}
  aria-controls="dialog-id"
>
  关闭
</button>

// ✅ Good: Form field with error
<input
  id="email"
  type="email"
  aria-invalid={hasError}
  aria-describedby={hasError ? "email-error" : undefined}
/>
{hasError && (
  <span id="email-error" role="alert">
    请输入有效的邮箱地址
  </span>
)}
```

### 2. ARIA Labels

```tsx
// ✅ Good: Descriptive labels
<button aria-label="删除用户 John Doe">删除</button>

// ✅ Good: Icon buttons
<button aria-label="搜索">
  <SearchIcon />
</button>

// ❌ Bad: No label for icon button
<button>
  <SearchIcon />
</button>
```

### 3. ARIA Live Regions

```tsx
// ✅ Good: Announce dynamic content
<div role="status" aria-live="polite" aria-atomic="true">
  {message}
</div>

// ✅ Good: Alert for errors
<div role="alert" aria-live="assertive">
  {errorMessage}
</div>
```

## Keyboard Navigation

### 1. Focusable Elements

```tsx
// ✅ Good: Keyboard accessible
<button onClick={handleClick} onKeyDown={(e) => {
  if (e.key === "Enter" || e.key === " ") {
    handleClick();
  }
}}>
  点击
</button>

// ✅ Good: Use native elements
<button onClick={handleClick}>点击</button>

// ❌ Bad: Div with onClick (not keyboard accessible)
<div onClick={handleClick}>点击</div>
```

### 2. Focus Management

```tsx
import { useEffect, useRef } from "react";

function Modal({ isOpen, onClose }: ModalProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (isOpen && closeButtonRef.current) {
      closeButtonRef.current.focus();
    }
  }, [isOpen]);

  return (
    <div role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <h2 id="modal-title">标题</h2>
      <button ref={closeButtonRef} onClick={onClose}>
        关闭
      </button>
    </div>
  );
}
```

### 3. Keyboard Shortcuts

```tsx
useEffect(() => {
  const handleKeyDown = (e: KeyboardEvent) => {
    if (e.key === "Escape") {
      onClose();
    }
  };

  document.addEventListener("keydown", handleKeyDown);
  return () => document.removeEventListener("keydown", handleKeyDown);
}, [onClose]);
```

## Semantic HTML

### 1. Use Semantic Elements

```tsx
// ✅ Good: Semantic HTML
<header>
  <nav>
    <ul>
      <li><a href="/">首页</a></li>
    </ul>
  </nav>
</header>

<main>
  <article>
    <h1>文章标题</h1>
    <p>文章内容</p>
  </article>
</main>

<footer>
  <p>版权信息</p>
</footer>

// ❌ Bad: Div soup
<div>
  <div>
    <div>首页</div>
  </div>
</div>
```

### 2. Headings Hierarchy

```tsx
// ✅ Good: Proper heading hierarchy
<h1>页面标题</h1>
<h2>章节标题</h2>
<h3>子章节标题</h3>

// ❌ Bad: Skipping levels
<h1>页面标题</h1>
<h3>章节标题</h3> {/* Skipped h2 */}
```

## Form Accessibility

### 1. Label Association

```tsx
// ✅ Good: Proper label association
<label htmlFor="email">邮箱</label>
<input id="email" type="email" name="email" />

// ✅ Good: Implicit label
<label>
  邮箱
  <input type="email" name="email" />
</label>

// ❌ Bad: No label association
<input type="email" placeholder="邮箱" />
```

### 2. Error Messages

```tsx
// ✅ Good: Accessible error messages
<div>
  <label htmlFor="email">邮箱</label>
  <input
    id="email"
    type="email"
    aria-invalid={hasError}
    aria-describedby={hasError ? "email-error" : undefined}
  />
  {hasError && (
    <span id="email-error" role="alert">
      {errorMessage}
    </span>
  )}
</div>
```

### 3. Required Fields

```tsx
// ✅ Good: Indicate required fields
<label htmlFor="name">
  姓名 <span aria-label="必填">*</span>
</label>
<input id="name" type="text" required aria-required="true" />
```

## Color and Contrast

### 1. Color Contrast

```tsx
// ✅ Good: Sufficient contrast (WCAG AA: 4.5:1 for text)
<div className="text-[var(--color-text-primary)] bg-[var(--color-bg-card)]">
  文本内容
</div>

// ❌ Bad: Low contrast
<div className="text-gray-400 bg-gray-300">
  文本内容 {/* Hard to read */}
</div>
```

### 2. Don't Rely on Color Alone

```tsx
// ✅ Good: Use color + icon/text
<button className={hasError ? "text-red-500" : "text-green-500"}>
  {hasError ? "❌ 错误" : "✅ 成功"}
</button>

// ❌ Bad: Color only
<button className={hasError ? "text-red-500" : "text-green-500"}>
  状态
</button>
```

## Image Accessibility

### 1. Alt Text

```tsx
// ✅ Good: Descriptive alt text
<img src="chart.jpg" alt="2024年第一季度销售数据图表，显示收入增长20%" />

// ✅ Good: Decorative image
<img src="decoration.jpg" alt="" role="presentation" />

// ❌ Bad: Missing alt text
<img src="chart.jpg" />
```

### 2. SVG Accessibility

```tsx
// ✅ Good: Accessible SVG
<svg role="img" aria-label="用户图标">
  <path d="..." />
</svg>

// ✅ Good: Decorative SVG
<svg aria-hidden="true">
  <path d="..." />
</svg>
```

## Testing Accessibility

### 1. Manual Testing

- **Keyboard navigation**: Tab through all interactive elements
- **Screen reader**: Test with NVDA (Windows) or VoiceOver (Mac)
- **Color contrast**: Use contrast checker tools
- **Focus indicators**: Ensure all focusable elements have visible focus

### 2. Automated Testing

```typescript
import { render, screen } from "@testing-library/react";
import { axe, toHaveNoViolations } from "jest-axe";

expect.extend(toHaveNoViolations);

test("should have no accessibility violations", async () => {
  const { container } = render(<Component />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

### 3. Browser Extensions

- **axe DevTools**: Chrome/Firefox extension
- **WAVE**: Web accessibility evaluation tool
- **Lighthouse**: Built into Chrome DevTools

## Common Accessibility Issues

### Issue 1: Missing Labels

**Problem**: Form inputs without labels

**Solution**: Always associate labels with inputs using `htmlFor` and `id`

### Issue 2: Low Contrast

**Problem**: Text color doesn't meet contrast requirements

**Solution**: Use theme variables that meet WCAG AA standards (4.5:1)

### Issue 3: Missing Focus Indicators

**Problem**: No visible focus outline

**Solution**: Ensure focus styles are visible:
```css
button:focus-visible {
  outline: 2px solid var(--color-primary);
  outline-offset: 2px;
}
```

### Issue 4: Keyboard Traps

**Problem**: Users can't navigate away from modal/dialog

**Solution**: Implement proper focus management and Escape key handling

## Best Practices

### ✅ Good Practices

- Use semantic HTML elements
- Provide alt text for images
- Associate labels with form inputs
- Ensure keyboard navigation works
- Test with screen readers
- Use ARIA attributes appropriately
- Maintain proper heading hierarchy
- Ensure sufficient color contrast

### ❌ Anti-Patterns

- Don't use divs for buttons
- Don't rely on color alone
- Don't skip heading levels
- Don't forget keyboard navigation
- Don't ignore focus indicators
- Don't use generic alt text like "image"

## WCAG Compliance

### Level A (Minimum)

- All images have alt text
- Forms have labels
- Keyboard navigation works
- No keyboard traps

### Level AA (Recommended)

- Color contrast 4.5:1 for text
- Focus indicators visible
- Consistent navigation
- Error identification

### Level AAA (Enhanced)

- Color contrast 7:1 for text
- Sign language interpretation
- Extended audio descriptions

## Related Rules

- Form Development: `.cursor/skills/form-development/SKILL.md`
- Component Development: `.cursor/skills/component-development/SKILL.md`
- Code Review: `.cursor/skills/code-review/SKILL.md`
