# Refactoring

This document outlines refactoring guidelines specifically designed for LLM-assisted development, ensuring code modifications are safe, predictable, and maintainable.

## Core Principles for LLM Refactoring

1. **Preserve Functionality**: Never change behavior unless explicitly requested
2. **Incremental Changes**: Make small, testable modifications
3. **Maintain Context**: Keep related code together for better LLM understanding
4. **Clear Boundaries**: Refactor within well-defined module boundaries

## Pre-Refactoring Checklist

Before any refactoring:

- [ ] Understand the current functionality completely
- [ ] Identify and run existing tests
- [ ] Document current behavior if unclear
- [ ] Create a backup branch or commit
- [ ] Verify no active feature work depends on this code

## Refactoring Rules for LLMs

### 1. Test Coverage First

```typescript
// Before refactoring any code, ensure tests exist
// If no tests exist, write them first

// Bad: Refactoring without tests
function complexBusinessLogic(data: any) {
  // 200 lines of untested code
}

// Good: Add tests before refactoring
describe('complexBusinessLogic', () => {
  it('should handle normal case', () => {
    const result = complexBusinessLogic(testData);
    expect(result).toEqual(expectedOutput);
  });
  
  it('should handle edge cases', () => {
    // Test edge cases
  });
});
```

### 2. Single Purpose Refactoring

Each refactoring session should have ONE clear goal:

- **Extract function**: Pull out reusable logic
- **Rename**: Improve naming clarity
- **Restructure**: Reorganize code layout
- **Simplify**: Reduce complexity
- **Type safety**: Add or improve types

Never mix multiple refactoring goals in one session.

### 3. Preserve Public APIs

```typescript
// Bad: Breaking existing interface
// Before
export function processUser(name: string, age: number) {
  // implementation
}

// After - breaks existing callers!
export function processUser(user: { name: string; age: number }) {
  // implementation
}

// Good: Maintain compatibility
export function processUser(name: string, age: number): Result;
export function processUser(user: { name: string; age: number }): Result;
export function processUser(
  nameOrUser: string | { name: string; age: number },
  age?: number
): Result {
  // Handle both signatures
}
```

### 4. Clear Extraction Patterns

When extracting code:

```typescript
// Before
function processOrder(order: Order) {
  // Validation logic (20 lines)
  // Tax calculation (15 lines)
  // Discount application (25 lines)
  // Final calculation (10 lines)
}

// After - Clear, focused functions
function processOrder(order: Order) {
  const validatedOrder = validateOrder(order);
  const orderWithTax = calculateTax(validatedOrder);
  const orderWithDiscount = applyDiscounts(orderWithTax);
  return calculateFinalPrice(orderWithDiscount);
}
```

### 5. Maintain Code Locality

Keep related code close together for better LLM context:

```typescript
// Good: Related code in same file
class UserService {
  private validateEmail(email: string): boolean {
    return EMAIL_REGEX.test(email);
  }
  
  private hashPassword(password: string): string {
    return bcrypt.hashSync(password, 10);
  }
  
  async createUser(data: CreateUserDto): Promise<User> {
    if (!this.validateEmail(data.email)) {
      throw new ValidationError('Invalid email');
    }
    
    const hashedPassword = this.hashPassword(data.password);
    // Create user
  }
}
```

### 6. Progressive Enhancement

Add improvements incrementally:

```typescript
// Step 1: Add basic types
function calculate(a: number, b: number): number {
  return a + b;
}

// Step 2: Add validation
function calculate(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error('Invalid input');
  }
  return a + b;
}

// Step 3: Add documentation
/**
 * Calculates the sum of two numbers
 * @throws {Error} If inputs are not finite numbers
 */
function calculate(a: number, b: number): number {
  if (!Number.isFinite(a) || !Number.isFinite(b)) {
    throw new Error('Invalid input');
  }
  return a + b;
}
```

## Refactoring Patterns

### Extract Variable

```typescript
// Before
if (user.age >= 18 && user.hasVerifiedEmail && user.acceptedTerms) {
  allowAccess();
}

// After
const isEligibleUser = user.age >= 18 
  && user.hasVerifiedEmail 
  && user.acceptedTerms;

if (isEligibleUser) {
  allowAccess();
}
```

### Extract Function

```typescript
// Before
function renderPage() {
  // 50 lines of header rendering
  // 100 lines of content rendering  
  // 30 lines of footer rendering
}

// After
function renderPage() {
  renderHeader();
  renderContent();
  renderFooter();
}
```

### Simplify Conditionals

```typescript
// Before
if (status === 'active') {
  return true;
} else {
  return false;
}

// After
return status === 'active';
```

## Safety Rules

### 1. Never Refactor During Feature Development
Keep refactoring and feature work in separate commits/PRs.

### 2. Run Tests After Each Change
```bash
# After each refactoring step
npm test -- --watch
```

### 3. Use Type System as Safety Net
```typescript
// Let TypeScript catch breaking changes
interface UserData {
  id: string;
  name: string;
  email: string;
}

// Refactoring will cause compile errors if breaking
function processUserData(data: UserData): ProcessedUser {
  // implementation
}
```

### 4. Preserve Error Handling

```typescript
// Never remove error handling during refactoring
try {
  const result = await riskyOperation();
  return result;
} catch (error) {
  // Always preserve error handling logic
  logger.error('Operation failed', error);
  throw new ProcessingError('Failed to process', { cause: error });
}
```

## Communication with LLM

When requesting refactoring:

### Be Specific
```
❌ "Clean up this code"
✅ "Extract the validation logic from processOrder into a separate function"
```

### Provide Context
```
❌ "Refactor the UserService"
✅ "Refactor the UserService to separate data access from business logic. Current tests must continue passing."
```

### Define Success Criteria
```
✅ "Refactor this component to:
1. Extract the API call logic into a custom hook
2. Keep the same props interface
3. Ensure all existing tests pass"
```

## Post-Refactoring Checklist

After refactoring:

- [ ] All tests pass
- [ ] No new warnings or errors
- [ ] Code coverage maintained or improved
- [ ] Performance characteristics unchanged
- [ ] API contracts preserved
- [ ] Documentation updated if needed

## Common Anti-patterns to Avoid

1. **Over-abstraction**: Don't create abstractions for single use cases
2. **Premature optimization**: Profile before optimizing
3. **Breaking changes**: Always maintain backward compatibility
4. **Mixed concerns**: One refactoring goal at a time
5. **Lost context**: Keep related code together

## Rollback Strategy

Always be prepared to rollback:

```bash
# Before refactoring
git checkout -b refactor/extract-user-validation

# If refactoring fails
git checkout main
git branch -D refactor/extract-user-validation
```

Remember: The goal of refactoring is to make code better without changing what it does. When working with LLMs, clear communication and incremental changes are key to successful refactoring.