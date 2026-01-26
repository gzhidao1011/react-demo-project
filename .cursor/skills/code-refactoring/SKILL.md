---
name: code-refactoring
description: Refactor code safely including extracting functions, improving structure, reducing complexity, and maintaining functionality. Use when refactoring code, improving code quality, or reducing technical debt.
---

# Code Refactoring

Refactor code safely following best practices and maintaining functionality.

## Quick Checklist

When refactoring:

- [ ] **Tests** written and passing before refactoring
- [ ] **Small incremental** changes
- [ ] **Functionality** preserved
- [ ] **Code review** conducted
- [ ] **Documentation** updated
- [ ] **No breaking changes** (or documented)

## Refactoring Principles

### 1. Test First

```typescript
// ✅ Good: Write tests before refactoring
describe("calculateTotal", () => {
  it("should calculate total correctly", () => {
    expect(calculateTotal([1, 2, 3])).toBe(6);
  });
});

// Now refactor with confidence
function calculateTotal(numbers: number[]): number {
  return numbers.reduce((sum, n) => sum + n, 0);
}
```

### 2. Small Incremental Changes

```typescript
// ❌ Bad: Large refactoring in one go
function processOrder(order: Order) {
  // 200 lines of complex logic
}

// ✅ Good: Extract functions incrementally
function validateOrder(order: Order): boolean {
  // Validation logic
}

function calculateTotal(order: Order): number {
  // Calculation logic
}

function processOrder(order: Order) {
  if (!validateOrder(order)) {
    throw new Error("Invalid order");
  }
  const total = calculateTotal(order);
  // Process order
}
```

### 3. Preserve Functionality

```typescript
// Before refactoring: Test passes
test("original behavior", () => {
  expect(originalFunction(input)).toBe(expectedOutput);
});

// After refactoring: Same test should pass
test("refactored behavior", () => {
  expect(refactoredFunction(input)).toBe(expectedOutput);
});
```

## Common Refactoring Patterns

### 1. Extract Function

```typescript
// ❌ Before: Long function
function processUser(user: User) {
  // Validate email
  if (!user.email || !user.email.includes("@")) {
    throw new Error("Invalid email");
  }
  
  // Validate age
  if (user.age < 0 || user.age > 120) {
    throw new Error("Invalid age");
  }
  
  // Process user
  // ...
}

// ✅ After: Extracted functions
function validateEmail(email: string): boolean {
  return email && email.includes("@");
}

function validateAge(age: number): boolean {
  return age >= 0 && age <= 120;
}

function processUser(user: User) {
  if (!validateEmail(user.email)) {
    throw new Error("Invalid email");
  }
  if (!validateAge(user.age)) {
    throw new Error("Invalid age");
  }
  // Process user
}
```

### 2. Extract Variable

```typescript
// ❌ Before: Complex expression
if (user.age >= 18 && user.age <= 65 && user.status === "active" && user.verified) {
  // ...
}

// ✅ After: Extracted variable
const isEligible = user.age >= 18 
  && user.age <= 65 
  && user.status === "active" 
  && user.verified;

if (isEligible) {
  // ...
}
```

### 3. Rename for Clarity

```typescript
// ❌ Before: Unclear name
function proc(data: Data): Result {
  // ...
}

// ✅ After: Clear name
function processOrderData(orderData: OrderData): ProcessResult {
  // ...
}
```

### 4. Replace Magic Numbers

```typescript
// ❌ Before: Magic numbers
if (user.age >= 18 && user.age <= 65) {
  // ...
}

// ✅ After: Named constants
const MIN_AGE = 18;
const MAX_AGE = 65;

if (user.age >= MIN_AGE && user.age <= MAX_AGE) {
  // ...
}
```

### 5. Simplify Conditionals

```typescript
// ❌ Before: Complex conditional
function canVote(user: User): boolean {
  if (user.age >= 18) {
    if (user.citizenship === "US") {
      if (!user.felony) {
        return true;
      }
    }
  }
  return false;
}

// ✅ After: Simplified
function canVote(user: User): boolean {
  return user.age >= 18 
    && user.citizenship === "US" 
    && !user.felony;
}
```

### 6. Extract Component

```tsx
// ❌ Before: Large component
function UserProfile({ user }: { user: User }) {
  return (
    <div>
      <div>
        <img src={user.avatar} alt={user.name} />
        <h1>{user.name}</h1>
        <p>{user.bio}</p>
      </div>
      <div>
        <h2>联系信息</h2>
        <p>邮箱: {user.email}</p>
        <p>电话: {user.phone}</p>
      </div>
      <div>
        <h2>地址</h2>
        <p>{user.address}</p>
      </div>
    </div>
  );
}

// ✅ After: Extracted components
function UserAvatar({ user }: { user: User }) {
  return (
    <div>
      <img src={user.avatar} alt={user.name} />
      <h1>{user.name}</h1>
      <p>{user.bio}</p>
    </div>
  );
}

function ContactInfo({ user }: { user: User }) {
  return (
    <div>
      <h2>联系信息</h2>
      <p>邮箱: {user.email}</p>
      <p>电话: {user.phone}</p>
    </div>
  );
}

function UserProfile({ user }: { user: User }) {
  return (
    <div>
      <UserAvatar user={user} />
      <ContactInfo user={user} />
      <AddressInfo user={user} />
    </div>
  );
}
```

## React-Specific Refactoring

### 1. Extract Custom Hook

```tsx
// ❌ Before: Logic in component
function UserList() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchUsers()
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return <div>{/* Render users */}</div>;
}

// ✅ After: Extracted hook
function useUsers() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchUsers()
      .then(setUsers)
      .catch(setError)
      .finally(() => setLoading(false));
  }, []);

  return { users, loading, error };
}

function UserList() {
  const { users, loading, error } = useUsers();
  return <div>{/* Render users */}</div>;
}
```

### 2. Memoize Expensive Calculations

```tsx
// ❌ Before: Recalculates on every render
function ProductList({ products }: { products: Product[] }) {
  const expensiveProducts = products.filter(p => p.price > 100);
  return <div>{/* Render */}</div>;
}

// ✅ After: Memoized
function ProductList({ products }: { products: Product[] }) {
  const expensiveProducts = useMemo(
    () => products.filter(p => p.price > 100),
    [products]
  );
  return <div>{/* Render */}</div>;
}
```

## Refactoring Workflow

### 1. Identify Code Smells

- **Long functions**: > 20-30 lines
- **Deep nesting**: > 3 levels
- **Duplicate code**: Same logic in multiple places
- **Magic numbers**: Hard-coded values
- **Complex conditionals**: Hard to understand
- **Large components**: > 200 lines

### 2. Plan Refactoring

```markdown
## Refactoring Plan

### Goal
Extract user validation logic into separate functions

### Steps
1. Write tests for current behavior
2. Extract validateEmail function
3. Extract validateAge function
4. Update main function to use extracted functions
5. Run tests to verify behavior unchanged

### Risks
- Low: Small incremental changes
- Tests ensure no breaking changes
```

### 3. Execute Incrementally

```bash
# Make small commits
git commit -m "refactor: extract validateEmail function"
git commit -m "refactor: extract validateAge function"
git commit -m "refactor: update processUser to use extracted functions"
```

### 4. Verify After Each Step

```bash
# Run tests after each change
pnpm test

# Check for regressions
pnpm check
```

## Refactoring Checklist

Before refactoring:

- [ ] Tests written and passing
- [ ] Refactoring plan documented
- [ ] Small incremental changes planned
- [ ] Breaking changes identified (if any)

During refactoring:

- [ ] One change at a time
- [ ] Tests pass after each change
- [ ] Code follows project standards
- [ ] No functionality changed

After refactoring:

- [ ] All tests pass
- [ ] Code review completed
- [ ] Documentation updated
- [ ] No regressions introduced

## Best Practices

### ✅ Good Practices

- Write tests before refactoring
- Make small incremental changes
- Preserve functionality
- Run tests frequently
- Document refactoring plan
- Get code review
- Commit incrementally

### ❌ Anti-Patterns

- Don't refactor without tests
- Don't make large changes at once
- Don't change functionality while refactoring
- Don't skip code review
- Don't refactor production code without testing

## Related Rules

- Code Review: `.cursor/skills/code-review/SKILL.md`
- Run Tests: `.cursor/skills/run-tests/SKILL.md`
- Code Style: `.cursor/rules/01-代码风格.mdc`
