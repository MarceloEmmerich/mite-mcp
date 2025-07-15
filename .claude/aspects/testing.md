# Testing

This document outlines our testing strategy, focusing on Behavior-Driven Development (BDD) style unit testing and comprehensive code coverage.

## Testing Philosophy

We follow a **Behavior-Driven Development (BDD)** approach that emphasizes:
- Testing behavior, not implementation
- Writing tests that serve as living documentation
- Clear, descriptive test names that explain what the system does
- Tests that are readable by both developers and stakeholders

## Test Structure: AAA Pattern

All tests follow the **Arrange-Act-Assert (AAA)** pattern:

```javascript
describe('UserAuthentication', () => {
  it('should successfully authenticate a user with valid credentials', () => {
    // Arrange: Set up test data and dependencies
    const validCredentials = {
      email: 'user@example.com',
      password: 'SecurePassword123!'
    };
    const authService = new AuthenticationService();
    
    // Act: Execute the behavior being tested
    const result = authService.authenticate(validCredentials);
    
    // Assert: Verify the expected outcome
    expect(result.success).toBe(true);
    expect(result.user.email).toBe(validCredentials.email);
    expect(result.token).toBeDefined();
  });
});
```

## BDD Test Naming Conventions

### Describe Blocks
- Use the component/module name or feature being tested
- Group related behaviors together

### Test Names (it/test blocks)
- Start with "should" to describe expected behavior
- Be specific about the condition and outcome
- Avoid technical implementation details

#### Good Examples:
```javascript
describe('ShoppingCart', () => {
  describe('when adding items', () => {
    it('should increase the total item count', () => {});
    it('should calculate the correct total price including tax', () => {});
    it('should apply bulk discount when quantity exceeds threshold', () => {});
  });
  
  describe('when removing items', () => {
    it('should decrease the total item count', () => {});
    it('should return zero total when cart becomes empty', () => {});
  });
});
```

#### Bad Examples:
```javascript
// Too vague
it('should work correctly', () => {});

// Implementation-focused
it('should call calculateTotal() method', () => {});

// No clear behavior
it('test cart functionality', () => {});
```

## Code Coverage Standards

### Coverage Targets
- **Overall Coverage**: Minimum 80%
- **Critical Paths**: 100% coverage required
- **New Code**: Must maintain or improve existing coverage

### Coverage Metrics
1. **Line Coverage**: 80% minimum
2. **Branch Coverage**: 75% minimum
3. **Function Coverage**: 90% minimum
4. **Statement Coverage**: 80% minimum

### Coverage Configuration

#### Jest Configuration (jest.config.js)
```javascript
module.exports = {
  collectCoverage: true,
  coverageDirectory: 'coverage',
  coverageReporters: ['text', 'lcov', 'html'],
  coverageThreshold: {
    global: {
      branches: 75,
      functions: 90,
      lines: 80,
      statements: 80
    }
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/index.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/**/__tests__/**',
    '!src/**/test/**'
  ]
};
```

#### Vitest Configuration (vitest.config.js)
```javascript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    coverage: {
      enabled: true,
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData/**'
      ],
      thresholds: {
        lines: 80,
        functions: 90,
        branches: 75,
        statements: 80
      }
    }
  }
});
```

## Test Categories

### 1. Unit Tests
- Test individual functions, methods, or components in isolation
- Mock all external dependencies
- Fast execution (< 50ms per test)
- Located next to source files or in `__tests__` directories

### 2. Integration Tests
- Test interaction between multiple components
- Use real implementations where practical
- Located in `tests/integration/` directory

### 3. Component Tests (for UI projects)
- Test React/Vue/Angular components
- Focus on user interactions and rendered output
- Use testing library best practices

### 4. API Tests
- Test HTTP endpoints
- Verify request/response contracts
- Include error scenarios

## Testing Best Practices

### 1. Test Organization
```
src/
├── components/
│   ├── Button/
│   │   ├── Button.tsx
│   │   └── Button.test.tsx
├── services/
│   ├── auth/
│   │   ├── AuthService.ts
│   │   └── AuthService.test.ts
tests/
├── integration/
│   └── user-flow.test.ts
├── fixtures/
│   └── users.json
└── helpers/
    └── test-utils.ts
```

### 2. Test Data Management
- Use factories for test data creation
- Keep test data close to tests
- Avoid sharing mutable test data

```javascript
// Test data factory example
const createUser = (overrides = {}) => ({
  id: faker.datatype.uuid(),
  email: faker.internet.email(),
  name: faker.name.fullName(),
  createdAt: new Date(),
  ...overrides
});

// Usage in tests
it('should update user profile', () => {
  const user = createUser({ name: 'John Doe' });
  // test implementation
});
```

### 3. Mocking Strategy
- Mock at the boundary (APIs, databases, file system)
- Prefer dependency injection over module mocking
- Keep mocks simple and focused

```javascript
// Good: Dependency injection
class UserService {
  constructor(private database: Database) {}
  
  async getUser(id: string) {
    return this.database.users.findById(id);
  }
}

// Test
it('should retrieve user by id', async () => {
  const mockDb = { users: { findById: jest.fn() } };
  const service = new UserService(mockDb);
  // test implementation
});
```

### 4. Async Testing
- Always handle promises properly
- Use async/await for clarity
- Test both success and failure cases

```javascript
describe('API calls', () => {
  it('should handle successful responses', async () => {
    const data = await fetchUserData('123');
    expect(data).toMatchObject({ id: '123' });
  });
  
  it('should handle network errors gracefully', async () => {
    await expect(fetchUserData('invalid')).rejects.toThrow('Network error');
  });
});
```

## Testing Commands

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- Button.test.tsx

# Run tests matching pattern
npm test -- --testNamePattern="should add item"
```

### Coverage Reports
```bash
# Generate coverage report
npm run test:coverage

# Open HTML coverage report
npm run coverage:open

# Check coverage thresholds
npm run coverage:check
```

## Continuous Integration

### CI Pipeline Test Stages
1. **Lint & Format Check**
2. **Unit Tests**
3. **Integration Tests**
4. **Coverage Check**
5. **Build Verification**

### Example GitHub Actions
```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run linter
        run: npm run lint
        
      - name: Run tests
        run: npm run test:coverage
        
      - name: Upload coverage
        uses: codecov/codecov-action@v3
        with:
          file: ./coverage/lcov.info
          
      - name: Check coverage thresholds
        run: npm run coverage:check
```

## Testing Checklist

Before submitting code:

- [ ] All tests pass locally
- [ ] New features have corresponding tests
- [ ] Bug fixes include regression tests
- [ ] Coverage meets or exceeds thresholds
- [ ] Test names clearly describe behavior
- [ ] No skipped or commented-out tests
- [ ] Mocks are properly cleaned up
- [ ] No hardcoded test data
- [ ] Tests run in isolation (order independent)
- [ ] Performance-sensitive code has benchmarks

## Common Testing Patterns

### 1. Testing Error Conditions
```javascript
describe('Error handling', () => {
  it('should throw error when required parameter is missing', () => {
    expect(() => processData()).toThrow('Data parameter is required');
  });
  
  it('should return error response for invalid input', async () => {
    const result = await validateUser({ email: 'invalid' });
    expect(result.error).toBe('Invalid email format');
  });
});
```

### 2. Testing State Changes
```javascript
describe('State management', () => {
  it('should update state when action is dispatched', () => {
    const initialState = { count: 0 };
    const newState = reducer(initialState, { type: 'INCREMENT' });
    expect(newState.count).toBe(1);
    expect(initialState.count).toBe(0); // Ensure immutability
  });
});
```

### 3. Testing Time-based Behavior
```javascript
describe('Time-dependent features', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });
  
  afterEach(() => {
    jest.useRealTimers();
  });
  
  it('should expire session after timeout', () => {
    const session = createSession();
    expect(session.isActive()).toBe(true);
    
    jest.advanceTimersByTime(30 * 60 * 1000); // 30 minutes
    expect(session.isActive()).toBe(false);
  });
});
```

## Testing Anti-patterns to Avoid

1. **Testing Implementation Details**
   - Don't test private methods directly
   - Don't assert on internal state
   - Focus on public API and behavior

2. **Overmocking**
   - Don't mock everything
   - Keep real implementations when they're fast and reliable
   - Mock only external dependencies

3. **Test Interdependence**
   - Each test should run independently
   - Don't rely on test execution order
   - Clean up after each test

4. **Unclear Test Intent**
   - Avoid generic test names
   - Don't test multiple behaviors in one test
   - Keep tests focused and simple

5. **Ignoring Test Maintenance**
   - Don't skip failing tests
   - Update tests when requirements change
   - Remove obsolete tests

## Test Review Checklist

When reviewing tests:

1. **Clarity**: Can you understand what's being tested without reading the implementation?
2. **Completeness**: Are edge cases covered?
3. **Maintainability**: Will the test break unnecessarily when refactoring?
4. **Performance**: Do tests run quickly?
5. **Reliability**: Do tests produce consistent results?
6. **Value**: Does the test catch real bugs or prevent regressions?

## Tools and Libraries

### Recommended Testing Stack

#### JavaScript/TypeScript
- **Test Runner**: Jest, Vitest
- **Assertion Library**: Built-in (Jest/Vitest)
- **Mocking**: Built-in (Jest/Vitest)
- **Coverage**: Built-in with v8/babel
- **React Testing**: React Testing Library
- **E2E Testing**: Playwright, Cypress

#### Additional Tools
- **Test Data**: Faker.js
- **API Mocking**: MSW (Mock Service Worker)
- **Snapshot Testing**: Built-in (use sparingly)
- **Performance Testing**: Benchmark.js
- **Mutation Testing**: Stryker

## Measuring Test Quality

Beyond coverage numbers:

1. **Mutation Score**: How many mutations does your test suite catch?
2. **Test Execution Time**: Keep total suite under 5 minutes
3. **Flakiness Rate**: Track and eliminate flaky tests
4. **Bug Detection Rate**: What percentage of bugs are caught by tests?
5. **Test Maintenance Cost**: How often do tests need updates?

Remember: Code coverage is a tool, not a goal. High coverage doesn't guarantee quality tests. Focus on testing critical paths and complex logic thoroughly.