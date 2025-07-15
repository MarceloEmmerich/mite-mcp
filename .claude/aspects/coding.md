# Coding Standards

This document outlines our coding standards, conventions, and best practices to ensure consistent, maintainable, and high-quality code across the project.

## Core Principles

1. **Readability First**: Code is read far more often than it's written
2. **Consistency**: Follow established patterns throughout the codebase
3. **Simplicity**: Prefer simple, obvious solutions over clever ones
4. **Maintainability**: Write code that's easy to understand, modify, and extend
5. **Performance**: Optimize only when necessary, after profiling

## File Organization

### File Size Limits
- **Maximum file length**: 300 lines (excluding imports and comments)
- **Maximum function length**: 50 lines
- **Maximum class size**: 200 lines
- If a file exceeds these limits, consider splitting it into smaller, focused modules

### File Structure Template

```typescript
// 1. File header comment (if necessary)
/**
 * @fileoverview Brief description of the module's purpose
 * @module moduleName
 */

// 2. Imports - grouped and ordered
// External dependencies
import React from 'react';
import { useQuery } from '@tanstack/react-query';

// Internal dependencies - absolute paths
import { Button } from '@/components/ui';
import { useAuth } from '@/hooks/auth';

// Internal dependencies - relative paths
import { validateInput } from './utils';
import type { UserProfile } from './types';

// 3. Constants
const MAX_RETRY_ATTEMPTS = 3;
const DEFAULT_TIMEOUT = 5000;

// 4. Types/Interfaces (TypeScript)
interface ComponentProps {
  userId: string;
  onUpdate: (user: UserProfile) => void;
}

// 5. Main implementation
export function UserProfileCard({ userId, onUpdate }: ComponentProps) {
  // Implementation
}

// 6. Helper functions (if needed)
function formatUserName(user: UserProfile): string {
  return `${user.firstName} ${user.lastName}`;
}

// 7. Exports (if using named exports)
export { helperFunction } from './helpers';
```

## Naming Conventions

### General Rules
- Use descriptive, self-documenting names
- Avoid abbreviations except well-known ones (e.g., URL, API)
- Be consistent with naming patterns
- Name length should be proportional to scope

### Variables and Functions
```typescript
// Variables - camelCase
const userAge = 25;
const isLoggedIn = true;
const hasPermission = false;

// Constants - UPPER_SNAKE_CASE
const MAX_LOGIN_ATTEMPTS = 3;
const API_BASE_URL = 'https://api.example.com';

// Functions - camelCase, verb + noun
function calculateTotal(items: Item[]): number {
  // Implementation
}

function getUserById(id: string): User {
  // Implementation
}

// Boolean functions - start with is/has/can/should
function isValidEmail(email: string): boolean {
  // Implementation
}

function hasAdminRole(user: User): boolean {
  // Implementation
}
```

### Classes and Interfaces
```typescript
// Classes - PascalCase
class UserAccount {
  private balance: number;
  
  constructor(initialBalance: number) {
    this.balance = initialBalance;
  }
}

// Interfaces - PascalCase, prefix with 'I' only if it conflicts
interface UserProfile {
  id: string;
  name: string;
  email: string;
}

// Types - PascalCase
type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

// Enums - PascalCase for name, UPPER_SNAKE_CASE for values
enum HttpStatus {
  OK = 200,
  NOT_FOUND = 404,
  INTERNAL_ERROR = 500
}
```

### React Components
```typescript
// Components - PascalCase
function UserDashboard() {
  return <div>Dashboard</div>;
}

// Component files - PascalCase
UserDashboard.tsx
Button.tsx
NavigationMenu.tsx

// Hooks - camelCase, start with 'use'
function useUserData(userId: string) {
  // Implementation
}

// Event handlers - handle + Event + Action
function handleButtonClick() {
  // Implementation
}

function handleFormSubmit() {
  // Implementation
}
```

### Files and Directories
```
src/
├── components/
│   ├── common/
│   │   ├── Button/
│   │   │   ├── Button.tsx
│   │   │   ├── Button.test.tsx
│   │   │   ├── Button.styles.ts
│   │   │   └── index.ts
│   └── features/
│       └── UserProfile/
├── hooks/
│   ├── useAuth.ts
│   └── useLocalStorage.ts
├── services/
│   ├── api/
│   │   ├── userService.ts
│   │   └── authService.ts
│   └── storage/
├── utils/
│   ├── formatters.ts
│   ├── validators.ts
│   └── constants.ts
├── types/
│   ├── user.types.ts
│   └── api.types.ts
└── config/
    └── app.config.ts
```

## Code Style

### Indentation and Spacing
- Use 2 spaces for indentation (never tabs)
- Add blank lines between logical sections
- No trailing whitespace
- End files with a single newline character

### Line Length
- Maximum 100 characters per line
- Break long lines at logical points:
```typescript
// Good - break at logical operators
const isEligible = user.age >= 18 
  && user.hasVerifiedEmail 
  && user.acceptedTerms;

// Good - break function arguments
function createUser(
  name: string,
  email: string,
  role: UserRole,
  permissions: Permission[]
): User {
  // Implementation
}
```

### Brackets and Braces
```typescript
// Always use braces, even for single-line blocks
if (condition) {
  doSomething();
}

// Opening brace on same line
function calculatePrice(quantity: number): number {
  return quantity * unitPrice;
}

// Consistent spacing
if (condition) {
  // Implementation
} else {
  // Alternative
}
```

### Comments
```typescript
// Use comments sparingly - code should be self-documenting
// When needed, explain WHY, not WHAT

// Bad - explains what the code does
// Increment counter by 1
counter++;

// Good - explains why
// Compensate for zero-based index when displaying to user
const displayIndex = index + 1;

// TODO comments should include assignee and date
// TODO(john): Implement caching mechanism - 2024-01-15

// Function documentation for complex logic
/**
 * Calculates the compound interest for a given principal.
 * Uses the formula: A = P(1 + r/n)^(nt)
 * 
 * @param principal - Initial amount
 * @param rate - Annual interest rate (as decimal)
 * @param time - Time period in years
 * @param compound - Compounding frequency per year
 * @returns Final amount after interest
 */
function calculateCompoundInterest(
  principal: number,
  rate: number,
  time: number,
  compound: number = 12
): number {
  return principal * Math.pow(1 + rate / compound, compound * time);
}
```

## Function Design

### Function Guidelines
```typescript
// Single Responsibility - each function does ONE thing
// Bad
function processUserData(user: User) {
  validateUser(user);
  saveToDatabase(user);
  sendWelcomeEmail(user);
  logActivity(user);
}

// Good
function processUserData(user: User) {
  const validatedUser = validateUser(user);
  const savedUser = await saveUser(validatedUser);
  await notifyUserCreation(savedUser);
  return savedUser;
}

// Pure functions when possible
// Bad - modifies input
function addTax(order: Order): void {
  order.total = order.subtotal * 1.1;
}

// Good - returns new value
function calculateTotal(subtotal: number, taxRate: number): number {
  return subtotal * (1 + taxRate);
}

// Default parameters instead of optional checks
// Bad
function greet(name?: string): string {
  const displayName = name || 'Guest';
  return `Hello, ${displayName}!`;
}

// Good
function greet(name: string = 'Guest'): string {
  return `Hello, ${name}!`;
}
```

### Error Handling
```typescript
// Use try-catch for async operations
async function fetchUserData(userId: string): Promise<User> {
  try {
    const response = await api.get(`/users/${userId}`);
    return response.data;
  } catch (error) {
    logger.error('Failed to fetch user data', { userId, error });
    throw new UserFetchError(`Could not fetch user ${userId}`, error);
  }
}

// Validate inputs early
function processPayment(amount: number, currency: string): PaymentResult {
  if (amount <= 0) {
    throw new InvalidAmountError('Amount must be positive');
  }
  
  if (!SUPPORTED_CURRENCIES.includes(currency)) {
    throw new UnsupportedCurrencyError(`Currency ${currency} not supported`);
  }
  
  // Process payment...
}

// Use custom error classes
class ValidationError extends Error {
  constructor(message: string, public field: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
```

## Type Safety (TypeScript)

### Type Guidelines
```typescript
// Prefer interfaces for objects
interface User {
  id: string;
  name: string;
  email: string;
}

// Use type aliases for unions and primitives
type Status = 'active' | 'inactive' | 'pending';
type UserId = string;

// Avoid 'any' - use 'unknown' if type is truly unknown
// Bad
function processData(data: any): void {
  console.log(data.someProperty); // No type safety
}

// Good
function processData(data: unknown): void {
  if (isUserData(data)) {
    console.log(data.name); // Type safe
  }
}

// Use generics for reusable components
function first<T>(array: T[]): T | undefined {
  return array[0];
}

// Const assertions for literal types
const CONFIG = {
  apiUrl: 'https://api.example.com',
  timeout: 5000,
  retries: 3
} as const;

// Discriminated unions for complex state
type RequestState<T> = 
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; data: T }
  | { status: 'error'; error: Error };
```

## Async Code

### Async/Await Best Practices
```typescript
// Always use async/await over promises chains
// Bad
function fetchData() {
  return fetch('/api/data')
    .then(response => response.json())
    .then(data => processData(data))
    .catch(error => handleError(error));
}

// Good
async function fetchData() {
  try {
    const response = await fetch('/api/data');
    const data = await response.json();
    return processData(data);
  } catch (error) {
    handleError(error);
  }
}

// Parallel operations with Promise.all
async function fetchUserDetails(userId: string) {
  const [profile, posts, friends] = await Promise.all([
    fetchUserProfile(userId),
    fetchUserPosts(userId),
    fetchUserFriends(userId)
  ]);
  
  return { profile, posts, friends };
}

// Handle errors appropriately
async function updateUser(userId: string, data: UpdateData) {
  try {
    const user = await userService.update(userId, data);
    showSuccessNotification('User updated successfully');
    return user;
  } catch (error) {
    if (error instanceof ValidationError) {
      showValidationErrors(error.errors);
    } else if (error instanceof NetworkError) {
      showErrorNotification('Network error. Please try again.');
    } else {
      showErrorNotification('An unexpected error occurred');
      logger.error('User update failed', { userId, error });
    }
    throw error;
  }
}
```

## Performance Considerations

### Optimization Guidelines
```typescript
// Memoize expensive calculations
import { useMemo } from 'react';

function ExpensiveComponent({ data }: Props) {
  const processedData = useMemo(() => {
    return data.map(item => complexTransformation(item));
  }, [data]);
  
  return <DataDisplay data={processedData} />;
}

// Debounce user input
import { debounce } from 'lodash';

const handleSearch = debounce((query: string) => {
  searchAPI(query);
}, 300);

// Use early returns to avoid unnecessary processing
function processOrder(order: Order): ProcessResult {
  if (!order.items.length) {
    return { status: 'empty' };
  }
  
  if (order.status === 'cancelled') {
    return { status: 'cancelled' };
  }
  
  // Main processing logic
  return calculateOrderTotal(order);
}

// Lazy load components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

function App() {
  return (
    <Suspense fallback={<Loading />}>
      <HeavyComponent />
    </Suspense>
  );
}
```

## Security Best Practices

### Input Validation
```typescript
// Always validate and sanitize user input
function createUser(input: unknown): User {
  const validated = userSchema.parse(input); // Using zod
  const sanitized = {
    ...validated,
    name: DOMPurify.sanitize(validated.name),
    bio: DOMPurify.sanitize(validated.bio)
  };
  
  return userService.create(sanitized);
}

// Never trust client-side data
// Bad
app.delete('/api/users/:id', (req, res) => {
  const userId = req.params.id;
  database.delete(userId); // No authorization check!
});

// Good
app.delete('/api/users/:id', authenticate, authorize, (req, res) => {
  const userId = req.params.id;
  const requestingUser = req.user;
  
  if (!canDeleteUser(requestingUser, userId)) {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  database.delete(userId);
});
```

### Sensitive Data
```typescript
// Never log sensitive information
// Bad
logger.info('User login', { email, password });

// Good
logger.info('User login attempt', { email });

// Use environment variables for secrets
const config = {
  apiKey: process.env.API_KEY,
  databaseUrl: process.env.DATABASE_URL
};

// Validate environment variables at startup
function validateEnv() {
  const required = ['API_KEY', 'DATABASE_URL', 'JWT_SECRET'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length) {
    throw new Error(`Missing environment variables: ${missing.join(', ')}`);
  }
}
```

## Linting and Formatting

### Biome Configuration

Biome is an all-in-one toolchain for web projects, combining linting, formatting, and more in a single fast tool.

#### biome.json
```json
{
  "$schema": "https://biomejs.dev/schemas/1.9.4/schema.json",
  "vcs": {
    "enabled": true,
    "clientKind": "git",
    "useIgnoreFile": true
  },
  "files": {
    "ignore": [
      "**/node_modules",
      "**/dist",
      "**/build",
      "**/.next",
      "**/coverage"
    ],
    "ignoreUnknown": false
  },
  "formatter": {
    "enabled": true,
    "formatWithErrors": false,
    "indentStyle": "space",
    "indentWidth": 2,
    "lineEnding": "lf",
    "lineWidth": 100,
    "attributePosition": "auto"
  },
  "linter": {
    "enabled": true,
    "rules": {
      "recommended": true,
      "complexity": {
        "noForEach": "off",
        "noStaticOnlyClass": "warn",
        "noUselessConstructor": "error"
      },
      "correctness": {
        "noUnusedVariables": {
          "level": "error",
          "options": {
            "argsIgnorePattern": "^_"
          }
        },
        "noUnusedImports": "error"
      },
      "performance": {
        "noAccumulatingSpread": "warn",
        "noDelete": "warn"
      },
      "style": {
        "noNonNullAssertion": "warn",
        "noParameterAssign": "error",
        "useConst": "error",
        "useTemplate": "warn"
      },
      "suspicious": {
        "noConsoleLog": "warn",
        "noDebugger": "error",
        "noExplicitAny": "error"
      }
    }
  },
  "javascript": {
    "formatter": {
      "jsxQuoteStyle": "double",
      "quoteProperties": "asNeeded",
      "trailingCommas": "es5",
      "semicolons": "always",
      "arrowParentheses": "asNeeded",
      "bracketSpacing": true,
      "bracketSameLine": false,
      "quoteStyle": "single",
      "attributePosition": "auto"
    }
  },
  "json": {
    "formatter": {
      "trailingCommas": "none",
      "indentWidth": 2
    }
  }
}
```

### Pre-commit Hooks
```json
{
  "husky": {
    "hooks": {
      "pre-commit": "lint-staged"
    }
  },
  "lint-staged": {
    "*.{js,jsx,ts,tsx,json,css,md}": [
      "biome check --write --unsafe"
    ]
  }
}
```

### Running Biome

```bash
# Install Biome
npm install --save-dev @biomejs/biome

# Check files (linting and formatting)
biome check .

# Fix auto-fixable issues
biome check --write .

# Fix with unsafe fixes (more aggressive)
biome check --write --unsafe .

# Format only
biome format --write .

# Lint only
biome lint .

# CI mode (exits with error code if issues found)
biome ci .
```

## Code Review Checklist

Before submitting code for review:

- [ ] Code follows naming conventions
- [ ] No commented-out code
- [ ] No console.logs in production code
- [ ] Functions are focused and under 50 lines
- [ ] Complex logic has comments explaining why
- [ ] Error cases are handled appropriately
- [ ] No hardcoded values (use constants/config)
- [ ] TypeScript types are specific (no `any`)
- [ ] Async operations have proper error handling
- [ ] Security considerations addressed
- [ ] Performance implications considered
- [ ] Code passes all Biome linting rules
- [ ] Tests are updated/added as needed

## Refactoring Guidelines

### When to Refactor
- When adding a feature that makes existing code harder to understand
- When fixing a bug reveals design issues
- When code violates DRY (Don't Repeat Yourself)
- When performance profiling identifies bottlenecks
- As part of regular maintenance (Boy Scout Rule)

### Refactoring Safely
1. Ensure comprehensive tests exist
2. Make small, incremental changes
3. Run tests after each change
4. Use version control effectively
5. Consider feature flags for large refactors

### Common Refactoring Patterns
```typescript
// Extract Method
// Before
function processOrder(order: Order) {
  // Validate order
  if (!order.items || order.items.length === 0) {
    throw new Error('Order has no items');
  }
  if (order.total <= 0) {
    throw new Error('Order total must be positive');
  }
  
  // Calculate tax
  const taxRate = getTaxRate(order.shippingAddress);
  const tax = order.subtotal * taxRate;
  
  // Process payment...
}

// After
function processOrder(order: Order) {
  validateOrder(order);
  const tax = calculateOrderTax(order);
  // Process payment...
}

function validateOrder(order: Order): void {
  if (!order.items || order.items.length === 0) {
    throw new Error('Order has no items');
  }
  if (order.total <= 0) {
    throw new Error('Order total must be positive');
  }
}

function calculateOrderTax(order: Order): number {
  const taxRate = getTaxRate(order.shippingAddress);
  return order.subtotal * taxRate;
}
```

Remember: Clean code is not written, it's refactored. Continuous improvement is key to maintaining a healthy codebase.