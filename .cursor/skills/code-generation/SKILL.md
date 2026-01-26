---
name: code-generation
description: Generate code templates, scaffolding, and boilerplate code following project conventions. Use when creating new components, services, or modules.
---

# Code Generation

Generate code templates and scaffolding following project standards.

## Quick Checklist

When generating code:

- [ ] **Template** selected
- [ ] **Naming conventions** followed
- [ ] **Project structure** respected
- [ ] **Dependencies** added correctly
- [ ] **TypeScript types** generated
- [ ] **Tests** scaffolded
- [ ] **Documentation** included

## Component Generator

### 1. Component Template

```typescript
// scripts/generate-component.ts
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";

interface ComponentOptions {
  name: string;
  type: "component" | "page" | "widget";
  withTests?: boolean;
  withStory?: boolean;
}

export function generateComponent(options: ComponentOptions) {
  const { name, type, withTests = true, withStory = false } = options;
  const componentName = name.charAt(0).toUpperCase() + name.slice(1);
  const dir = `apps/web/app/${type}s/${name}`;

  mkdirSync(dir, { recursive: true });

  // Generate component file
  const componentContent = `import { useState } from "react";

interface ${componentName}Props {
  // Add props here
}

export function ${componentName}({}: ${componentName}Props) {
  return (
    <div>
      {/* Component content */}
    </div>
  );
}
`;

  writeFileSync(join(dir, `${name}.tsx`), componentContent);

  // Generate test file
  if (withTests) {
    const testContent = `import { render, screen } from "@testing-library/react";
import { ${componentName} } from "./${name}";

describe("${componentName}", () => {
  it("renders correctly", () => {
    render(<${componentName} />);
    // Add tests
  });
});
`;

    writeFileSync(join(dir, `${name}.test.tsx`), testContent);
  }

  // Generate Storybook story
  if (withStory) {
    const storyContent = `import type { Meta, StoryObj } from "@storybook/react";
import { ${componentName} } from "./${name}";

const meta: Meta<typeof ${componentName}> = {
  title: "${type}s/${componentName}",
  component: ${componentName},
};

export default meta;
type Story = StoryObj<typeof ${componentName}>;

export const Default: Story = {};
`;

    writeFileSync(join(dir, `${name}.stories.tsx`), storyContent);
  }
}
```

## API Service Generator

### 1. Service Template

```typescript
// scripts/generate-service.ts
export function generateService(name: string) {
  const serviceName = name.charAt(0).toUpperCase() + name.slice(1);
  
  const serviceContent = `import { APIServiceBase } from "./api.service.base";

export interface ${serviceName}Request {
  // Add request types
}

export interface ${serviceName}Response {
  // Add response types
}

export class ${serviceName}Service extends APIServiceBase {
  async get${serviceName}(id: string): Promise<${serviceName}Response> {
    return this.request<${serviceName}Response>(\`/api/${name}/\${id}\`);
  }

  async create${serviceName}(data: ${serviceName}Request): Promise<${serviceName}Response> {
    return this.request<${serviceName}Response>(\`/api/${name}\`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
  }
}

export const ${name.toLowerCase()}Service = new ${serviceName}Service();
`;

  return serviceContent;
}
```

## Best Practices

### ✅ Good Practices

- Follow project naming conventions
- Include TypeScript types
- Generate tests by default
- Use consistent templates
- Add proper imports
- Include JSDoc comments

### ❌ Anti-Patterns

- Don't generate without templates
- Don't skip type definitions
- Don't ignore project structure
- Don't forget to add dependencies

## Related Rules

- Code Organization: `.cursor/rules/05-代码组织.mdc`
- Component Development: `.cursor/skills/component-development/SKILL.md`
